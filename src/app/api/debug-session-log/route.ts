import { NextResponse } from 'next/server'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

const LOG_PATH = path.join(process.cwd(), '.cursor', 'debug-e489f1.log')
const INGEST =
  'http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01'

/**
 * Debug-session only: persist client inquiry diagnostics to the session NDJSON log.
 * Do not log secrets or full inquiry message bodies.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const payload = {
    sessionId: 'e489f1',
    runId: typeof body.runId === 'string' ? body.runId : 'pre-fix',
    hypothesisId: typeof body.hypothesisId === 'string' ? body.hypothesisId : 'unknown',
    location: typeof body.location === 'string' ? body.location : 'unknown',
    message: typeof body.message === 'string' ? body.message : '',
    data: body.data && typeof body.data === 'object' ? body.data : {},
    timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
    source: 'same-origin-api',
  }

  try {
    await mkdir(path.dirname(LOG_PATH), { recursive: true })
    await appendFile(LOG_PATH, `${JSON.stringify(payload)}\n`, 'utf8')
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: 'write_failed',
        detail: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 }
    )
  }

  fetch(INGEST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'e489f1',
    },
    body: JSON.stringify(payload),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
