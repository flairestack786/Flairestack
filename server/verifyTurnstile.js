/**
 * Verify a Cloudflare Turnstile token server-side.
 * The secret key must never be exposed to the browser.
 */
export async function verifyTurnstileToken(token, secret) {
  const params = new URLSearchParams()
  params.append('secret', secret)
  params.append('response', token)

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
