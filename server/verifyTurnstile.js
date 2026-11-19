/**
 * Verify a Cloudflare Turnstile token server-side.
 * The secret key must never be exposed to the browser.
 *
 * @param {string} token
 * @param {string} secret
 * @param {string} [remoteip] Optional visitor IP forwarded to Siteverify.
 */
export async function verifyTurnstileToken(token, secret, remoteip) {
  const params = new URLSearchParams()
  params.append('secret', secret)
  params.append('response', token)
  if (remoteip) params.append('remoteip', remoteip)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const result = await response.json()

  if (!response.ok) {
    return {
      success: false,
      'error-codes': result['error-codes'] ?? ['internal-error'],
    }
  }

  return result
}
