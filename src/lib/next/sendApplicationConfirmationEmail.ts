/**
 * Server-side applicant confirmation via EmailJS REST API.
 * Never expose EMAILJS_PRIVATE_KEY to the browser.
 */

import {
  CAREERS_EMAIL_FROM,
  EMAILJS_SEND_URL,
  buildApplicationConfirmationHtml,
  buildApplicationEmailJsPayload,
  isEmailJsSuccessResponse,
  resolveApplicationEmailConfig,
  sanitizeEmailJsErrorSnippet,
} from '../applicationConfirmationEmail.js'

export {
  CAREERS_EMAIL_FROM,
  EMAILJS_SEND_URL,
  buildApplicationConfirmationHtml,
  buildApplicationEmailJsPayload,
  isEmailJsSuccessResponse,
  resolveApplicationEmailConfig,
  sanitizeEmailJsErrorSnippet,
}

type SendResult =
  | { ok: true; httpStatus: number; responseBody: string }
  | { ok: false; error: string; skipped?: boolean; httpStatus?: number; responseBody?: string }

export async function sendApplicationConfirmationEmail(input: {
  toEmail: string
  firstName: string
  jobTitle: string
}): Promise<SendResult> {
  const config = resolveApplicationEmailConfig()

  if (!config.configured) {
    return {
      ok: false,
      skipped: true,
      error: `Applicant confirmation email is not configured. Missing: ${config.missing.join(', ')}.`,
    }
  }

  const payload = buildApplicationEmailJsPayload({
    serviceId: config.serviceId,
    templateId: config.templateId,
    publicKey: config.publicKey,
    privateKey: config.privateKey || undefined,
    toEmail: input.toEmail,
    firstName: input.firstName,
    jobTitle: input.jobTitle,
  })

  try {
    const response = await fetch(EMAILJS_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const text = await response.text().catch(() => '')
    const safeBody = sanitizeEmailJsErrorSnippet(text)

    if (!isEmailJsSuccessResponse(response.status, text)) {
      const hint =
        /non-browser|accessToken|private key|disabled/i.test(text) && !config.privateKey
          ? ' Hint: enable EmailJS Account → Security “Allow EmailJS API for non-browser applications” and set EMAILJS_PRIVATE_KEY.'
          : ''
      return {
        ok: false,
        httpStatus: response.status,
        responseBody: safeBody,
        error: `EmailJS send failed (${response.status})${safeBody ? `: ${safeBody}` : ''}${hint}`,
      }
    }

    return { ok: true, httpStatus: response.status, responseBody: safeBody || 'OK' }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Email delivery failed.',
    }
  }
}
