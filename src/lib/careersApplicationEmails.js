/**
 * Post-save email orchestration for a job application.
 *
 * The application is already persisted when this runs. Nothing here may throw or
 * undo that: each send is isolated, recorded best-effort, and sent exactly once.
 * Order: applicant confirmation → (EmailJS 1 req/s spacing) → one hiring-team
 * notification. A failed confirmation never suppresses the notification.
 */

import { EMAILJS_MIN_SEND_INTERVAL_MS } from './applicationConfirmationEmail.js'

/**
 * @typedef {{ ok: true, httpStatus?: number } | { ok: false, skipped?: boolean, error: string, httpStatus?: number }} SendOutcome
 */

/** @param {() => Promise<SendOutcome>} send @returns {Promise<SendOutcome>} */
async function attempt(send) {
  try {
    return await send()
  } catch {
    return { ok: false, error: 'Email delivery failed.' }
  }
}

/**
 * @param {{
 *   sendConfirmation: () => Promise<SendOutcome>,
 *   sendNotification: () => Promise<SendOutcome>,
 *   recordConfirmation?: (result: SendOutcome) => Promise<void>,
 *   recordNotification?: (result: SendOutcome) => Promise<void>,
 *   delay?: (ms: number) => Promise<void>,
 *   intervalMs?: number,
 *   log?: (message: string) => void,
 * }} deps
 */
export async function runApplicationEmails(deps) {
  const log = deps.log ?? (() => {})
  const delay = deps.delay ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
  const intervalMs = deps.intervalMs ?? EMAILJS_MIN_SEND_INTERVAL_MS

  const describe = (label, result) => {
    if (result.ok) return
    const status = result.httpStatus != null ? `http=${result.httpStatus}` : 'http=n/a'
    log(`${label} ${result.skipped ? 'skipped' : 'failed'} ${status}`)
  }

  const confirmation = await attempt(deps.sendConfirmation)
  describe('confirmation email', confirmation)
  try {
    await deps.recordConfirmation?.(confirmation)
  } catch {
    log('confirmation status update failed')
  }

  // EmailJS REST API: 1 request per second. Skipped sends made no request.
  if (!(confirmation.ok === false && confirmation.skipped)) {
    try {
      await delay(intervalMs)
    } catch {
      // ignore
    }
  }

  const notification = await attempt(deps.sendNotification)
  describe('hiring notification', notification)
  try {
    await deps.recordNotification?.(notification)
  } catch {
    log('hiring notification status update failed')
  }

  return { confirmation, notification }
}

/**
 * Column values for `job_applications.hiring_notification_*`.
 * @param {SendOutcome} result
 */
export function hiringNotificationColumns(result) {
  if (result.ok) return { hiring_notification_status: 'sent', hiring_notification_error: '' }
  return {
    hiring_notification_status: result.skipped ? 'skipped' : 'failed',
    hiring_notification_error: String(result.error || '').slice(0, 500),
  }
}
