import { verifyTurnstileToken } from '../../server/verifyTurnstile.js'

/**
 * Vercel Serverless Function — POST /api/turnstile/verify
 * Mirrors Express route in server/index.mjs for production SPA deploys.
 * TURNSTILE_SECRET_KEY must be set in the Vercel project environment (server-only).
 *
 * @param {import('http').IncomingMessage & { method?: string, body?: { token?: unknown } }} req
 * @param {import('http').ServerResponse & { status: (code: number) => any, json: (body: unknown) => any, setHeader: Function }} res
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
    })
  }

  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Turnstile secret key is not configured on the server.',
    })
  }

  const token = req.body?.token

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Token is required.',
    })
  }

  try {
    const result = await verifyTurnstileToken(token, secret)
    return res.status(result.success ? 200 : 403).json(result)
  } catch {
    return res.status(500).json({
      success: false,
      error: 'Turnstile verification failed.',
    })
  }
}
