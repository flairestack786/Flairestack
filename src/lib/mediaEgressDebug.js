/**
 * Lightweight opt-in diagnostics for Supabase Storage media requests.
 *
 * Enable with NEXT_PUBLIC_MEDIA_EGRESS_DEBUG=1 (or in development).
 * Logs URL, kind, page hint, and duplicate counts — never tokens or user PII.
 *
 * Application code cannot measure CDN cached-vs-uncached egress; use the
 * Supabase Dashboard → Reports → Storage for actual bandwidth.
 */

const STATE_KEY = '__flaireMediaEgressDebug'

/**
 * @returns {boolean}
 */
export function isMediaEgressDebugEnabled() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MEDIA_EGRESS_DEBUG === '1') {
    return true
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return process.env?.NEXT_PUBLIC_MEDIA_EGRESS_DEBUG !== '0'
  }
  return false
}

/**
 * @returns {{
 *   startedAt: number,
 *   events: Array<Record<string, unknown>>,
 *   byUrl: Map<string, number>,
 * }}
 */
function getState() {
  if (typeof globalThis === 'undefined') {
    return { startedAt: Date.now(), events: [], byUrl: new Map() }
  }
  const root = /** @type {Record<string, unknown>} */ (globalThis)
  if (!root[STATE_KEY]) {
    root[STATE_KEY] = {
      startedAt: Date.now(),
      events: [],
      byUrl: new Map(),
    }
  }
  return /** @type {{ startedAt: number, events: Array<Record<string, unknown>>, byUrl: Map<string, number> }} */ (
    root[STATE_KEY]
  )
}

/**
 * Record a media network intent (video source attach, image warm, etc.).
 *
 * @param {{
 *   url?: string | null,
 *   kind?: string,
 *   component?: string,
 *   page?: string,
 *   note?: string,
 *   bytesHint?: number | null,
 * }} input
 */
export function recordMediaEgressEvent(input = {}) {
  if (!isMediaEgressDebugEnabled()) return
  if (typeof window === 'undefined') return

  const url = String(input.url ?? '').trim()
  if (!url) return

  const state = getState()
  const count = (state.byUrl.get(url) || 0) + 1
  state.byUrl.set(url, count)

  const event = {
    t: new Date().toISOString(),
    url,
    kind: input.kind || 'unknown',
    component: input.component || 'unknown',
    page: input.page || (typeof window !== 'undefined' ? window.location.pathname : ''),
    note: input.note || '',
    bytesHint: input.bytesHint ?? null,
    duplicateCount: count,
  }
  state.events.push(event)
  if (state.events.length > 200) state.events.shift()

  // eslint-disable-next-line no-console
  console.info('[media-egress]', event)
}

/**
 * Summarize recorded events (also exposed on window for manual inspection).
 * @returns {Record<string, unknown> | null}
 */
export function getMediaEgressSummary() {
  if (!isMediaEgressDebugEnabled()) return null
  const state = getState()
  const duplicates = [...state.byUrl.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([url, count]) => ({ url, count }))

  return {
    startedAt: new Date(state.startedAt).toISOString(),
    eventCount: state.events.length,
    uniqueUrls: state.byUrl.size,
    duplicates,
    recent: state.events.slice(-20),
    note:
      'Byte totals and CDN cached vs uncached egress must be read from the Supabase dashboard.',
  }
}

if (typeof window !== 'undefined' && isMediaEgressDebugEnabled()) {
  // @ts-expect-error debug helper on window
  window.__flaireMediaEgressSummary = getMediaEgressSummary
}
