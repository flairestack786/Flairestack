/**
 * Server-side public inquiry submission (POST /api/inquiry/submit).
 *
 * Order is security-critical: validate → Turnstile Siteverify → rate/duplicate
 * checks → insert. Nothing touches the database before Cloudflare confirms the token.
 * Dependencies are injected so the flow is testable without network or Supabase.
 */

export const INQUIRY_MAX_BODY_BYTES = 16 * 1024

export const INQUIRY_FIELD_LIMITS = Object.freeze({
  fullName: 120,
  email: 254,
  phone: 40,
  company: 160,
  service: 120,
  message: 5000,
  turnstileToken: 2048,
})

export const INQUIRY_MESSAGE_MIN = 20

/** Same submission (email + message) inside this window is treated as a resend. */
export const INQUIRY_DUPLICATE_WINDOW_MS = 10 * 60 * 1000

/** Per hashed IP, enforced against persisted leads (works across serverless instances). */
export const INQUIRY_RATE_LIMIT = Object.freeze({ max: 5, windowMs: 10 * 60 * 1000 })

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
// eslint-disable-next-line no-control-regex
const LINE_BREAKS_AND_CONTROL = /[\u0000-\u001F\u007F]+/g

/** @param {unknown} value */
function singleLine(value) {
  if (typeof value !== 'string') return ''
  return value.replace(LINE_BREAKS_AND_CONTROL, ' ').replace(/\s+/g, ' ').trim()
}

/** @param {unknown} value */
function multiLine(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').trim()
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, data: { fullName: string, email: string, phone: string, company: string, service: string, message: string, turnstileToken: string } } | { ok: false, fieldErrors: Record<string, string> }}
 */
export function validateInquiryPayload(body) {
  const source = body && typeof body === 'object' && !Array.isArray(body) ? body : {}
  const raw = /** @type {Record<string, unknown>} */ (source)

  const data = {
    fullName: singleLine(raw.fullName),
    email: singleLine(raw.email).toLowerCase(),
    phone: singleLine(raw.phone),
    company: singleLine(raw.company),
    service: singleLine(raw.service),
    message: multiLine(raw.message),
    turnstileToken: typeof raw.turnstileToken === 'string' ? raw.turnstileToken.trim() : '',
  }

  /** @type {Record<string, string>} */
  const fieldErrors = {}
  if (!data.fullName) fieldErrors.fullName = 'Please enter your full name.'
  if (!data.email) fieldErrors.email = 'Please enter your email address.'
  else if (!EMAIL_PATTERN.test(data.email)) fieldErrors.email = 'Please enter a valid email address.'
  if (!data.service) fieldErrors.service = 'Please select a service.'
  if (!data.message) fieldErrors.message = 'Please tell us about your project.'
  else if (data.message.length < INQUIRY_MESSAGE_MIN) {
    fieldErrors.message = `Please provide at least ${INQUIRY_MESSAGE_MIN} characters about your project.`
  }

  for (const [key, max] of Object.entries(INQUIRY_FIELD_LIMITS)) {
    if (key === 'turnstileToken') continue
    if (data[/** @type {keyof typeof data} */ (key)].length > max && !fieldErrors[key]) {
      fieldErrors[key] = `Please keep this under ${max} characters.`
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }
  return { ok: true, data }
}

/**
 * @param {{ status: number, error: string, code: string, fieldErrors?: Record<string, string> }} input
 */
function failure({ status, error, code, fieldErrors }) {
  return { status, body: { ok: false, error, code, ...(fieldErrors ? { fieldErrors } : {}) } }
}

/**
 * @typedef {{
 *   turnstileSecret: string,
 *   verifyTurnstile: (token: string, secret: string, remoteip?: string) => Promise<{ success?: boolean, 'error-codes'?: string[] }>,
 *   countRecentByIpHash: (ipHash: string, sinceIso: string) => Promise<number>,
 *   findRecentDuplicate: (email: string, message: string, sinceIso: string) => Promise<boolean>,
 *   insertLead: (row: Record<string, unknown>) => Promise<void>,
 *   now?: () => Date,
 *   log?: (message: string) => void,
 * }} InquiryDeps
 */

/**
 * @param {{ body: unknown, ip?: string, ipHash?: string | null }} request
 * @param {InquiryDeps} deps
 * @returns {Promise<{ status: number, body: Record<string, unknown> }>}
 */
export async function processInquirySubmission(request, deps) {
  const log = deps.log ?? (() => {})
  const now = deps.now ? deps.now() : new Date()

  const validated = validateInquiryPayload(request.body)
  if (!validated.ok) {
    return failure({
      status: 400,
      error: 'Please fix the highlighted fields.',
      code: 'invalid_fields',
      fieldErrors: validated.fieldErrors,
    })
  }
  const data = validated.data

  if (!deps.turnstileSecret) {
    log('turnstile secret missing')
    return failure({
      status: 503,
      error: 'Security verification is unavailable. Please try again later.',
      code: 'turnstile_unconfigured',
    })
  }

  if (!data.turnstileToken || data.turnstileToken.length > INQUIRY_FIELD_LIMITS.turnstileToken) {
    return failure({
      status: 400,
      error: 'Please complete the security verification before sending.',
      code: 'turnstile_missing',
    })
  }

  let verification
  try {
    verification = await deps.verifyTurnstile(data.turnstileToken, deps.turnstileSecret, request.ip)
  } catch {
    log('turnstile siteverify unreachable')
    return failure({
      status: 503,
      error: 'Security verification is unavailable. Please try again.',
      code: 'turnstile_unavailable',
    })
  }

  if (verification?.success !== true) {
    const codes = Array.isArray(verification?.['error-codes']) ? verification['error-codes'] : []
    log(`turnstile rejected codes=${codes.join(',') || 'none'}`)
    const expired = codes.includes('timeout-or-duplicate')
    return failure({
      status: 403,
      error: expired
        ? 'Security verification expired. Please complete it again.'
        : 'Security verification failed. Please try again.',
      code: expired ? 'turnstile_expired' : 'turnstile_failed',
    })
  }

  if (request.ipHash) {
    try {
      const since = new Date(now.getTime() - INQUIRY_RATE_LIMIT.windowMs).toISOString()
      const recent = await deps.countRecentByIpHash(request.ipHash, since)
      if (recent >= INQUIRY_RATE_LIMIT.max) {
        return failure({
          status: 429,
          error: 'Too many inquiries were sent recently. Please try again in a few minutes.',
          code: 'rate_limited',
        })
      }
    } catch {
      // Turnstile already passed; do not block a verified visitor on a lookup failure.
      log('rate-limit lookup failed')
    }
  }

  try {
    const since = new Date(now.getTime() - INQUIRY_DUPLICATE_WINDOW_MS).toISOString()
    if (await deps.findRecentDuplicate(data.email, data.message, since)) {
      return { status: 200, body: { ok: true, duplicate: true } }
    }
  } catch {
    log('duplicate lookup failed')
  }

  try {
    await deps.insertLead({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      service_interest: data.service,
      message: data.message,
      source: 'contact_form',
      status: 'new',
      priority: 'medium',
      metadata: {
        submitted_at: now.toISOString(),
        turnstile_verified: true,
        ...(request.ipHash ? { ip_hash: request.ipHash } : {}),
      },
    })
  } catch {
    log('lead insert failed')
    return failure({
      status: 500,
      error: 'Unable to save your inquiry right now. Please try again in a moment.',
      code: 'persist_failed',
    })
  }

  return { status: 200, body: { ok: true, duplicate: false } }
}
