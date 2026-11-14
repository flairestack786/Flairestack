/**
 * Server-side applicant confirmation via EmailJS REST API.
 * Never expose EMAILJS_PRIVATE_KEY to the browser.
 */

type SendResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean }

function env(name: string, fallback = '') {
  return String(process.env[name] ?? fallback).trim()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build a simple branded HTML body (also usable as EmailJS template fallback).
 */
export function buildApplicationConfirmationHtml(input: {
  firstName: string
  jobTitle: string
}) {
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
              <a href="mailto:hello@flairestack.com" style="color:#ff7a00;text-decoration:none;">hello@flairestack.com</a>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendApplicationConfirmationEmail(input: {
  toEmail: string
  firstName: string
  jobTitle: string
}): Promise<SendResult> {
  // Careers confirmation must use its own EmailJS service — never the inquiry service.
  const serviceId = env('EMAILJS_APPLICATION_SERVICE_ID')
  const templateId = env('EMAILJS_APPLICATION_TEMPLATE_ID')
  const publicKey = env('EMAILJS_PUBLIC_KEY') || env('NEXT_PUBLIC_EMAILJS_PUBLIC_KEY')
  const privateKey = env('EMAILJS_PRIVATE_KEY')

  if (!serviceId || !templateId || !publicKey) {
    return {
      ok: false,
      skipped: true,
      error:
        'Applicant confirmation email is not configured. Set EMAILJS_APPLICATION_SERVICE_ID (production: service_qbexphi), EMAILJS_APPLICATION_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY.',
    }
  }

  const subject = `Application Received — ${input.jobTitle} at FlaireStack`
  const html = buildApplicationConfirmationHtml({
    firstName: input.firstName,
    jobTitle: input.jobTitle,
  })

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: input.toEmail,
      email: input.toEmail,
      first_name: input.firstName,
      job_title: input.jobTitle,
      subject,
      message_html: html,
      reply_to: 'hello@flairestack.com',
    },
  }
  if (privateKey) payload.accessToken = privateKey

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return {
        ok: false,
        error: `EmailJS send failed (${response.status})${text ? `: ${text.slice(0, 200)}` : ''}`,
      }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Email delivery failed.',
    }
  }
}
