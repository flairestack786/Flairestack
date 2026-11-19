export const INQUIRY_SUBMIT_ENDPOINT = '/api/inquiry/submit'

const GENERIC_ERROR = 'Unable to save your inquiry right now. Please try again in a moment.'

/**
 * Browser half of the inquiry flow:
 * POST to the server (Turnstile + persistence) → only then one customer confirmation.
 * A confirmation failure never turns a saved inquiry into a reported failure.
 *
 * @param {{
 *   values: { fullName: string, email: string, company: string, phone: string, service: string, message: string },
 *   turnstileToken: string,
 *   fetchImpl?: typeof fetch,
 *   sendConfirmation: () => Promise<boolean>,
 * }} input
 * @returns {Promise<
 *   | { ok: true, duplicate: boolean, emailStatus: 'sent' | 'failed' | 'not_sent' }
 *   | { ok: false, error: string, code: string | null, fieldErrors: Record<string, string> | null }
 * >}
 */
export async function submitInquiry({ values, turnstileToken, fetchImpl, sendConfirmation }) {
  const doFetch = fetchImpl ?? fetch

  let response
  try {
    response = await doFetch(INQUIRY_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, turnstileToken }),
    })
  } catch {
    return {
      ok: false,
      error: 'Unable to reach the server. Please check your connection and try again.',
      code: 'network_error',
      fieldErrors: null,
    }
  }

  /** @type {{ ok?: unknown, duplicate?: unknown, error?: unknown, code?: unknown, fieldErrors?: unknown }} */
  let payload = {}
  try {
    payload = (await response.json()) ?? {}
  } catch {
    payload = {}
  }

  if (!response.ok || payload.ok !== true) {
    return {
      ok: false,
      error: typeof payload.error === 'string' && payload.error ? payload.error : GENERIC_ERROR,
      code: typeof payload.code === 'string' ? payload.code : null,
      fieldErrors:
        payload.fieldErrors && typeof payload.fieldErrors === 'object'
          ? /** @type {Record<string, string>} */ (payload.fieldErrors)
          : null,
    }
  }

  // A duplicate means the original submission already triggered its confirmation.
  if (payload.duplicate === true) {
    return { ok: true, duplicate: true, emailStatus: 'not_sent' }
  }

  let emailStatus = /** @type {'sent' | 'failed'} */ ('failed')
  try {
    emailStatus = (await sendConfirmation()) ? 'sent' : 'failed'
  } catch {
    emailStatus = 'failed'
  }
  return { ok: true, duplicate: false, emailStatus }
}
