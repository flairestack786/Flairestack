/**
 * Public inquiry / contact form EmailJS configuration.
 * Completely independent of Careers application confirmation email.
 */

/** Expected production EmailJS SMTP service for inquiries. */
export const INQUIRY_EMAILJS_SERVICE_ID = 'service_mqjkoth'

/** Canonical inquiry mailbox (SMTP From + notification To). */
export const INQUIRY_TO_EMAIL = 'info@flairestack.com'

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [envSource]
 */
export function resolveInquiryEmailConfig(envSource = process.env) {
  const read = (name) => String(envSource[name] ?? '').trim()

  // Inquiry uses browser NEXT_PUBLIC_* only. Never read Careers APPLICATION_* IDs.
  const serviceId = read('NEXT_PUBLIC_EMAILJS_SERVICE_ID') || read('VITE_EMAILJS_SERVICE_ID')
  const templateId = read('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID') || read('VITE_EMAILJS_TEMPLATE_ID')
  const publicKey = read('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY') || read('VITE_EMAILJS_PUBLIC_KEY')
  // Env may still carry a legacy mailbox (e.g. hello@). Notifications always go to info@.
  const configuredToEmail = (
    read('NEXT_PUBLIC_EMAILJS_TO_EMAIL') ||
    read('VITE_EMAILJS_TO_EMAIL') ||
    INQUIRY_TO_EMAIL
  ).toLowerCase()
  const toEmail = INQUIRY_TO_EMAIL

  /** @type {string[]} */
  const missing = []
  if (!serviceId) missing.push('NEXT_PUBLIC_EMAILJS_SERVICE_ID')
  if (!templateId) missing.push('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID')
  if (!publicKey) missing.push('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY')

  return {
    serviceId,
    templateId,
    publicKey,
    toEmail,
    configuredToEmail,
    missing,
    configured: missing.length === 0,
    usesExpectedService: serviceId === INQUIRY_EMAILJS_SERVICE_ID,
    usesCanonicalInbox: toEmail === INQUIRY_TO_EMAIL,
    envInboxMismatch: configuredToEmail !== INQUIRY_TO_EMAIL,
    // Explicitly unused by inquiry — documented for isolation checks.
    careersServiceIdIgnored: read('EMAILJS_APPLICATION_SERVICE_ID'),
    careersTemplateIdIgnored: read('EMAILJS_APPLICATION_TEMPLATE_ID'),
  }
}

/**
 * @param {{
 *   fullName: string,
 *   email: string,
 *   company?: string,
 *   phone?: string,
 *   service?: string,
 *   message: string,
 *   toEmail: string,
 *   turnstileToken?: string,
 * }} input
 */
export function buildInquiryEmailJsTemplateParams(input) {
  return {
    name: String(input.fullName || '').trim(),
    email: String(input.email || '').trim(),
    company: String(input.company || '').trim(),
    phone: String(input.phone || '').trim(),
    service: String(input.service || '').trim(),
    message: String(input.message || '').trim(),
    to_email: String(input.toEmail || INQUIRY_TO_EMAIL).trim().toLowerCase() || INQUIRY_TO_EMAIL,
    reply_to: String(input.email || '').trim(),
    from_name: 'FlaireStack Website',
    turnstile_token: String(input.turnstileToken || ''),
    submitted_at: new Date().toISOString(),
  }
}

/**
 * @param {unknown} result
 */
export function isInquiryEmailJsSuccess(result) {
  if (!result || typeof result !== 'object') return false
  const status = Number(/** @type {{ status?: unknown }} */ (result).status)
  return status === 200
}

/**
 * Safe EmailJS error details for console (no message body / PII dumps).
 * @param {unknown} error
 */
export function formatInquiryEmailJsFailure(error) {
  if (!error || typeof error !== 'object') {
    return { status: null, text: 'Unknown EmailJS failure' }
  }
  const err = /** @type {{ status?: unknown, text?: unknown, message?: unknown }} */ (error)
  const status = err.status != null ? Number(err.status) : null
  const text = String(err.text || err.message || 'EmailJS send failed').slice(0, 240)
  return { status: Number.isFinite(status) ? status : null, text }
}
