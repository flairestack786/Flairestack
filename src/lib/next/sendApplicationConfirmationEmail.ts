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
import { buildHiringNotificationEmailJsPayload } from '../hiringNotificationEmail.js'
import type { HiringNotificationApplication } from '../hiringNotificationEmail.js'
import { resolvePublicSiteOrigin } from './publicSiteUrl'

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

/** POST one prepared payload to the EmailJS REST API and classify the response. */
async function deliverEmailJsPayload(
  payload: Record<string, unknown>,
  config: ReturnType<typeof resolveApplicationEmailConfig>
): Promise<SendResult> {
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

  return deliverEmailJsPayload(payload, config)
}

/**
 * One hiring-team notification to careers@flairestack.com using the existing Careers
 * EmailJS service/template. Links to the authenticated admin page; the resume is not
 * attached and no public Storage URL is created.
 */
export async function sendHiringTeamNotificationEmail(input: {
  jobTitle: string
  application: HiringNotificationApplication
}): Promise<SendResult> {
  const config = resolveApplicationEmailConfig()

  if (!config.configured) {
    return {
      ok: false,
      skipped: true,
      error: `Hiring notification email is not configured. Missing: ${config.missing.join(', ')}.`,
    }
  }

  const payload = buildHiringNotificationEmailJsPayload({
    serviceId: config.serviceId,
    templateId: config.templateId,
    publicKey: config.publicKey,
    privateKey: config.privateKey || undefined,
    siteOrigin: resolvePublicSiteOrigin(),
    jobTitle: input.jobTitle,
    application: input.application,
  })

  return deliverEmailJsPayload(payload, config)
}