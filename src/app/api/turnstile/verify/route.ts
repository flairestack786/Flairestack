import { NextResponse } from 'next/server'
import { verifyTurnstileToken } from '../../../../../server/verifyTurnstile.js'

export const runtime = 'nodejs'

/**
 * Next App Router parity for Express/Vercel `POST /api/turnstile/verify`.
 * TURNSTILE_SECRET_KEY stays server-only — never expose to the browser.
 */
export async function POST(request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    return NextResponse.json(
      {
        success: false,
        error: 'Turnstile secret key is not configured on the server.',
      },
      { status: 500 }
    )
  }

  let body: Record<string, unknown> = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>
    }
  } catch {
    body = {}
  }

  const token = body.token

  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      {
        success: false,
        error: 'Token is required.',
      },
      { status: 400 }
    )
  }

  try {
    const result = await verifyTurnstileToken(token, secret)
    return NextResponse.json(result, { status: result.success ? 200 : 403 })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Turnstile verification failed.',
      },
      { status: 500 }
    )
  }
}
