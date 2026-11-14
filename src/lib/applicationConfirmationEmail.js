/**
 * Pure Careers confirmation email helpers (safe for Node tests).
 * Network send lives in src/lib/next/sendApplicationConfirmationEmail.ts.
 */

export const CAREERS_EMAIL_FROM = 'careers@flairestack.com'
export const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send'

/**
 * @param {string} text
 * @param {number} [max]
 */
export function sanitizeEmailJsErrorSnippet(text, max = 400) {
  return String(text || '')
    .replace(/accessToken["']?\s*[:=]\s*["'][^"']+/gi, 'accessToken=[redacted]')
    .replace(/private[_-]?key["']?\s*[:=]\s*["'][^"']+/gi, 'private_key=[redacted]')
    .replace(/user_id["']?\s*[:=]\s*["'][^"']+/gi, 'user_id=[redacted]')
    .slice(0, max)
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [envSource]
 */
export function resolveApplicationEmailConfig(envSource = process.env) {
  const read = (name) => String(envSource[name] ?? '').trim()
  const serviceId = read('EMAILJS_APPLICATION_SERVICE_ID')
  const templateId = read('EMAILJS_APPLICATION_TEMPLATE_ID')
  const publicKey = read('EMAILJS_PUBLIC_KEY') || read('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY')
  const privateKey = read('EMAILJS_PRIVATE_KEY')

  /** @type {string[]} */
  const missing = []
  if (!serviceId) missing.push('EMAILJS_APPLICATION_SERVICE_ID')
  if (!templateId) missing.push('EMAILJS_APPLICATION_TEMPLATE_ID')
  if (!publicKey) missing.push('EMAILJS_PUBLIC_KEY')

  return {
    serviceId,
    templateId,
    publicKey,
    privateKey,
    missing,
    configured: missing.length === 0,
  }
}

/**
 * @param {{ firstName: string, jobTitle: string }} input
 */
export function buildApplicationConfirmationHtml(input) {
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const firstName = escapeHtml(input.firstName || 'there')
  const jobTitle = escapeHtml(input.jobTitle || 'the open role')
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#121212;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
            <tr><td style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#ff7a00;font-weight:700;">FlaireStack</td></tr>
            <tr><td style="padding-top:18px;font-size:22px;font-weight:700;color:#ffffff;">Application received</td></tr>
            <tr><td style="padding-top:14px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.78);">
              Hello ${firstName},<br/><br/>
              Thank you for applying to the <strong style="color:#fff;">${jobTitle}</strong> position at FlaireStack.<br/><br/>
              We have successfully received your application and resume. Our team will review your application and contact you if your qualifications and experience align with the position.<br/><br/>
              We appreciate your interest in joining FlaireStack.
            </td></tr>
            <tr><td style="padding-top:22px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);">
              Best regards,<br/>
              FlaireStack Hiring Team<br/>
              <a href="mailto:${CAREERS_EMAIL_FROM}" style="color:#ff7a00;text-decoration:none;">${CAREERS_EMAIL_FROM}</a>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * @param {{
 *   serviceId: string,
 *   templateId: string,
 *   publicKey: string,
 *   privateKey?: string,
 *   toEmail: string,
 *   firstName: string,
 *   jobTitle: string,
 * }} input
 */
export function buildApplicationEmailJsPayload(input) {
  const subject = `Application Received — ${input.jobTitle} at FlaireStack`
  const html = buildApplicationConfirmationHtml({
    firstName: input.firstName,
    jobTitle: input.jobTitle,
  })

  /** @type {Record<string, unknown>} */
  const payload = {
    service_id: input.serviceId,
    template_id: input.templateId,
    user_id: input.publicKey,
    template_params: {
      to_email: input.toEmail,
      email: input.toEmail,
      first_name: input.firstName,
      job_title: input.jobTitle,
      subject,
      message_html: html,
      reply_to: CAREERS_EMAIL_FROM,
      from_email: CAREERS_EMAIL_FROM,
      from_name: 'FlaireStack Hiring Team',
    },
  }
  if (input.privateKey) payload.accessToken = input.privateKey
  return payload
}

/**
 * @param {number} httpStatus
 * @param {string} bodyText
 */
export function isEmailJsSuccessResponse(httpStatus, bodyText) {
  if (httpStatus < 200 || httpStatus >= 300) return false
  const normalized = String(bodyText || '').trim().toLowerCase()
  if (!normalized) return false
  if (normalized === 'ok' || normalized === '"ok"') return true
  try {
    const parsed = JSON.parse(bodyText)
    if (parsed && (parsed.status === 200 || String(parsed.text || '').toLowerCase() === 'ok')) {
      return true
    }
  } catch {
    // ignore
  }
  return normalized.includes('ok') && !normalized.includes('error')
}
