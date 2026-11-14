/**
 * Public inquiry / contact form EmailJS configuration.
 * Completely independent of Careers application confirmation email.
 *
 * Flow: save lead → send exactly one customer confirmation via the inquiry
 * template (template_5jo1wed). Team reviews inquiries in CMS — no separate
 * business notification email.
 *
 * EmailJS template recipient field: {{email}} (visitor address).
 * From / Reply-To mailbox: hello@flairestack.com
 */

/** Expected production EmailJS SMTP service for inquiries. */
export const INQUIRY_EMAILJS_SERVICE_ID = 'service_mqjkoth'

/** Inquiry SMTP From / Reply-To mailbox (EmailJS service + template). */
export const INQUIRY_FROM_EMAIL = 'hello@flairestack.com'

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [envSource]
 */
export function resolveInquiryEmailConfig(envSource = process.env) {
  const read = (name) => String(envSource[name] ?? '').trim()

  // Inquiry uses browser NEXT_PUBLIC_* (with legacy VITE_* fallback). Never Careers APPLICATION_*.
  const serviceId = read('NEXT_PUBLIC_EMAILJS_SERVICE_ID') || read('VITE_EMAILJS_SERVICE_ID')
  const templateId = read('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID') || read('VITE_EMAILJS_TEMPLATE_ID')
  const publicKey = read('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY') || read('VITE_EMAILJS_PUBLIC_KEY')

  /** @type {string[]} */
  const missing = []
  if (!serviceId) missing.push('NEXT_PUBLIC_EMAILJS_SERVICE_ID')
  if (!templateId) missing.push('NEXT_PUBLIC_EMAILJS_TEMPLATE_ID')
  if (!publicKey) missing.push('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY')

  return {
    serviceId,
    templateId,
    publicKey,
    fromEmail: INQUIRY_FROM_EMAIL,
    missing,
    configured: missing.length === 0,
    usesExpectedService: serviceId === INQUIRY_EMAILJS_SERVICE_ID,
    // Explicitly unused — isolation from Careers / removed dual-template flow.
    careersServiceIdIgnored: read('EMAILJS_APPLICATION_SERVICE_ID'),
    careersTemplateIdIgnored: read('EMAILJS_APPLICATION_TEMPLATE_ID'),
    confirmationTemplateIdIgnored: read('NEXT_PUBLIC_EMAILJS_CONFIRMATION_TEMPLATE_ID'),
  }
}

/**
 * Exactly one customer confirmation email.
 * Template To Email uses {{email}} → visitor address.
 *
 * @param {{
 *   fullName: string,
 *   email: string,
 *   company?: string,
 *   phone?: string,
 *   service?: string,
 *   message: string,
 *   turnstileToken?: string,
 * }} input
 */
export function buildInquiryEmailJsTemplateParams(input) {
  const customerEmail = String(input.email || '').trim().toLowerCase()
  return {
    name: String(input.fullName || '').trim(),
    // Recipient for EmailJS template field {{email}}
    email: customerEmail,
    company: String(input.company || '').trim(),
    phone: String(input.phone || '').trim(),
    service: String(input.service || '').trim(),
    message: String(input.message || '').trim(),
    // Kept for templates that still reference {{to_email}} — must be the customer.
    to_email: customerEmail,
    reply_to: INQUIRY_FROM_EMAIL,
    from_name: 'FlaireStack',
    from_email: INQUIRY_FROM_EMAIL,
    turnstile_token: String(input.turnstileToken || ''),
    submitted_at: new Date().toISOString(),
  }
}

/**
 * Plan the single confirmation send (no business notification).
 * @param {ReturnType<typeof resolveInquiryEmailConfig>} config
 * @param {{ email: string }} input
 */
export function planInquiryEmailSends(config, input) {
  const customerEmail = String(input.email || '').trim().toLowerCase()
  if (!config.configured || !customerEmail) {
    return {
      customer: null,
      business: null,
      skippedReason: !config.configured ? 'email_not_configured' : 'missing_customer_email',
    }
  }
  return {
    business: null,
    customer: {
      serviceId: config.serviceId,
      templateId: config.templateId,
      toEmail: customerEmail,
      fromEmail: INQUIRY_FROM_EMAIL,
      replyTo: INQUIRY_FROM_EMAIL,
    },
    skippedReason: null,
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
