import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { verifyTurnstileToken } from '../../../../../server/verifyTurnstile.js'
import { INQUIRY_MAX_BODY_BYTES, processInquirySubmission } from '@/lib/inquirySubmission'
import { getSupabaseServiceRole } from '@/lib/next/supabaseServiceRole'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const first = forwarded.split(',')[0]?.trim()
  return first || request.headers.get('x-real-ip') || ''
}

/** Keyed hash so stored values cannot be reversed by enumerating the IPv4 space. */
function hashIp(ip: string, key: string) {
  if (!ip || !key) return null
  return createHmac('sha256', key).update(ip).digest('hex').slice(0, 32)
}

/**
 * Public inquiry submission. The only path that creates contact-form leads:
 * Turnstile is verified with Cloudflare before the service-role insert.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, error: 'Unsupported content type.', code: 'unsupported_media_type' }, 415)
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > INQUIRY_MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Request is too large.', code: 'payload_too_large' }, 413)
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return json({ ok: false, error: 'Invalid request body.', code: 'invalid_body' }, 400)
  }
  if (Buffer.byteLength(raw, 'utf8') > INQUIRY_MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Request is too large.', code: 'payload_too_large' }, 413)
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, error: 'Invalid request body.', code: 'invalid_body' }, 400)
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || ''
  const ip = clientIp(request)

  try {
    const result = await processInquirySubmission(
      { body, ip, ipHash: hashIp(ip, process.env.INQUIRY_IP_HASH_SECRET || turnstileSecret) },
      {
        turnstileSecret,
        verifyTurnstile: verifyTurnstileToken,
        async countRecentByIpHash(ipHash, sinceIso) {
          const { count, error } = await getSupabaseServiceRole()
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('metadata->>ip_hash', ipHash)
            .gte('created_at', sinceIso)
          if (error) throw error
          return count ?? 0
        },
        async findRecentDuplicate(email, message, sinceIso) {
          const { data, error } = await getSupabaseServiceRole()
            .from('leads')
            .select('id')
            .eq('email', email)
            .eq('message', message)
            .gte('created_at', sinceIso)
            .limit(1)
          if (error) throw error
          return Array.isArray(data) && data.length > 0
        },
        async insertLead(row) {
          const { error } = await getSupabaseServiceRole().from('leads').insert(row)
          if (error) throw error
        },
        log: (message) => console.error(`[inquiry/submit] ${message}`),
      }
    )
    return json(result.body, result.status)
  } catch {
    console.error('[inquiry/submit] unexpected failure')
    return json(
      { ok: false, error: 'Something went wrong. Please try again.', code: 'internal_error' },
      500
    )
  }
}
