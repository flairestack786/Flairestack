/**
 * Pure validation helpers for public job applications (safe for Node tests).
 */

export const JOB_RESUME_MAX_BYTES = 5 * 1024 * 1024

export const JOB_RESUME_ALLOWED_MIME = Object.freeze([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const JOB_APPLICATION_STATUSES = Object.freeze([
  'new',
  'under_review',
  'shortlisted',
  'interview',
  'rejected',
  'hired',
])

export const JOB_PROFILE_LINK_TYPES = Object.freeze([
  'linkedin',
  'github',
  'website',
  'portfolio',
  'behance',
  'dribbble',
  'stackoverflow',
  'other',
])

export const JOB_PROFILE_LINK_LABELS = Object.freeze({
  linkedin: 'LinkedIn',
  github: 'GitHub',
  website: 'Personal website',
  portfolio: 'Portfolio',
  behance: 'Behance',
  dribbble: 'Dribbble',
  stackoverflow: 'Stack Overflow',
  other: 'Other',
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param {unknown} value
 * @returns {string}
 */
export function trimText(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return EMAIL_RE.test(trimText(value))
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidHttpsUrl(value) {
  const raw = trimText(value)
  if (!raw) return false
  try {
    const url = new URL(raw)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * @param {unknown} filename
 * @param {unknown} mimeType
 * @returns {{ ok: true, mime: string, ext: string } | { ok: false, error: string }}
 */
export function validateResumeIdentity(filename, mimeType) {
  const name = trimText(filename)
  const mime = trimText(mimeType).toLowerCase()
  const lower = name.toLowerCase()
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : ''

  if (!name) return { ok: false, error: 'Please upload your resume.' }
  if (ext !== '.pdf' && ext !== '.docx') {
    return { ok: false, error: 'Resume must be a PDF or DOCX file.' }
  }

  const expectedMime =
    ext === '.pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  // Some browsers send empty or generic MIME — allow when extension is trusted.
  if (mime && mime !== expectedMime && mime !== 'application/octet-stream') {
    return { ok: false, error: 'Resume file type is not supported.' }
  }

  return { ok: true, mime: mime || expectedMime, ext }
}

/**
 * Lightweight content sniffing for PDF / DOCX.
 * @param {ArrayBuffer | Uint8Array} bytes
 * @param {string} ext
 * @returns {boolean}
 */
export function looksLikeResumeBytes(bytes, ext) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (view.length < 5) return false

  if (ext === '.pdf') {
    return (
      view[0] === 0x25 &&
      view[1] === 0x50 &&
      view[2] === 0x44 &&
      view[3] === 0x46
    ) // %PDF
  }

  if (ext === '.docx') {
    // DOCX is a ZIP container (PK..)
    return view[0] === 0x50 && view[1] === 0x4b
  }

  return false
}

/**
 * @param {unknown} input
 * @returns {{ platform: string, url: string, label?: string }[]}
 */
export function sanitizeProfileLinks(input) {
  const list = Array.isArray(input) ? input : []
  const out = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = /** @type {{ platform?: unknown, url?: unknown, label?: unknown }} */ (item)
    const platformRaw = trimText(row.platform).toLowerCase()
    const platform = JOB_PROFILE_LINK_TYPES.includes(platformRaw) ? platformRaw : 'other'
    const url = trimText(row.url)
    if (!url) continue
    if (!isValidHttpsUrl(url)) continue
    /** @type {{ platform: string, url: string, label?: string }} */
    const entry = { platform, url }
    if (platform === 'other') {
      const label = trimText(row.label).slice(0, 80)
      if (label) entry.label = label
    }
    out.push(entry)
    if (out.length >= 8) break
  }
  return out
}

/**
 * Client-side validation for profile link rows before submit.
 * @param {unknown} input
 * @returns {{ ok: true, links: { platform: string, url: string, label?: string }[] } | { ok: false, error: string }}
 */
export function validateProfileLinksInput(input) {
  const list = Array.isArray(input) ? input : []
  if (list.length === 0) return { ok: true, links: [] }

  /** @type {{ platform: string, url: string, label?: string }[]} */
  const links = []
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i]
    if (!item || typeof item !== 'object') continue
    const row = /** @type {{ platform?: unknown, url?: unknown, label?: unknown }} */ (item)
    const platformRaw = trimText(row.platform).toLowerCase()
    const platform = JOB_PROFILE_LINK_TYPES.includes(platformRaw) ? platformRaw : 'other'
    const url = trimText(row.url)
    const label = trimText(row.label).slice(0, 80)

    if (!url && !label) continue
    if (!url) {
      return { ok: false, error: `Enter an HTTPS URL for profile link ${i + 1}.` }
    }
    if (!isValidHttpsUrl(url)) {
      return {
        ok: false,
        error: `Profile link ${i + 1} must be a valid HTTPS URL (https://…).`,
      }
    }
    if (platform === 'other' && !label) {
      return { ok: false, error: `Enter a custom platform name for profile link ${i + 1}.` }
    }
    /** @type {{ platform: string, url: string, label?: string }} */
    const entry = { platform, url }
    if (platform === 'other' && label) entry.label = label
    links.push(entry)
    if (links.length >= 8) break
  }
  return { ok: true, links }
}

/**
 * @param {Record<string, unknown>} fields
 * @returns {{ ok: true, data: Record<string, string> } | { ok: false, errors: Record<string, string> }}
 */
export function validateApplicationFields(fields) {
  /** @type {Record<string, string>} */
  const errors = {}
  const first_name = trimText(fields.first_name)
  const last_name = trimText(fields.last_name)
  const email = trimText(fields.email).toLowerCase()
  const phone = trimText(fields.phone)

  if (!first_name) errors.first_name = 'First name is required.'
  if (!last_name) errors.last_name = 'Last name is required.'
  if (!email) errors.email = 'Email is required.'
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.'
  if (!phone) errors.phone = 'Phone number is required.'

  if (Object.keys(errors).length) return { ok: false, errors }

  return {
    ok: true,
    data: {
      first_name,
      last_name,
      email,
      phone,
      current_job_title: trimText(fields.current_job_title).slice(0, 160),
      current_company: trimText(fields.current_company).slice(0, 160),
      location: trimText(fields.location).slice(0, 160),
      years_experience: trimText(fields.years_experience).slice(0, 80),
      notice_period: trimText(fields.notice_period).slice(0, 120),
      cover_letter: trimText(fields.cover_letter).slice(0, 8000),
    },
  }
}

/**
 * @param {string} status
 */
export function isJobApplicationStatus(status) {
  return JOB_APPLICATION_STATUSES.includes(status)
}

/**
 * @param {string} status
 */
export function labelJobApplicationStatus(status) {
  const map = {
    new: 'New',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    rejected: 'Rejected',
    hired: 'Hired',
  }
  return map[status] || status
}
