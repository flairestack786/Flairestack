/** Pure SEO write-payload helpers (no Supabase imports — safe for regression scripts). */

export const SEO_WRITABLE_FIELDS = Object.freeze([
  'meta_title',
  'meta_description',
  'canonical_url',
  'robots',
  'og_title',
  'og_description',
  'og_image_id',
  'og_type',
  'twitter_card',
  'twitter_title',
  'twitter_description',
  'twitter_image_id',
  'structured_data',
  'focus_keyword',
  'related_keywords',
  'page_description',
  'seo_score',
  'extensions',
  'status',
  'published_at',
])

/** NOT NULL columns — never send null/empty; omit on update to preserve DB value. */
export const SEO_REQUIRED_TEXT_DEFAULTS = Object.freeze({
  robots: 'index,follow',
  og_type: 'website',
  twitter_card: 'summary_large_image',
  status: 'draft',
})

/**
 * @param {unknown} value
 */
function emptyToNull(value) {
  if (typeof value !== 'string') return value ?? null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Normalize a NOT NULL text column for insert/update payloads.
 * - Has value → trimmed string
 * - Insert + empty → default
 * - Update + empty → undefined (omit field; keep existing DB value)
 * @param {unknown} value
 * @param {string} fallback
 * @param {'insert' | 'update'} mode
 * @returns {string | undefined}
 */
export function normalizeRequiredSeoText(value, fallback, mode) {
  const trimmed =
    typeof value === 'string'
      ? value.trim()
      : value == null
        ? ''
        : String(value).trim()

  if (trimmed) return trimmed
  if (mode === 'insert') return fallback
  return undefined
}

/**
 * Final guard: refuse any payload that would violate NOT NULL SEO constraints.
 * @param {Record<string, unknown>} payload
 * @param {'insert' | 'update'} mode
 */
export function assertSeoPayloadConstraints(payload, mode) {
  for (const [key, fallback] of Object.entries(SEO_REQUIRED_TEXT_DEFAULTS)) {
    if (!(key in payload)) {
      if (mode === 'insert') {
        payload[key] = fallback
      }
      continue
    }
    const value = payload[key]
    if (value == null || (typeof value === 'string' && value.trim() === '')) {
      throw new Error(
        `SEO save blocked: "${key}" cannot be null or empty (would violate NOT NULL).`
      )
    }
  }
}

/**
 * Build a Supabase-safe seo_metadata write payload.
 * @param {Record<string, unknown>} seo
 * @param {{ isUpdate?: boolean }} [options]
 */
export function sanitizeSeoPayload(seo, options = {}) {
  const mode = options.isUpdate ? 'update' : 'insert'
  /** @type {Record<string, unknown>} */
  const payload = {}

  for (const key of SEO_WRITABLE_FIELDS) {
    if (seo[key] === undefined) continue

    if (key in SEO_REQUIRED_TEXT_DEFAULTS) {
      const normalized = normalizeRequiredSeoText(
        seo[key],
        SEO_REQUIRED_TEXT_DEFAULTS[/** @type {keyof typeof SEO_REQUIRED_TEXT_DEFAULTS} */ (key)],
        mode
      )
      if (normalized !== undefined) payload[key] = normalized
      continue
    }

    if (key === 'related_keywords') {
      payload[key] = Array.isArray(seo[key])
        ? seo[key].map((item) => String(item).trim()).filter(Boolean)
        : []
      continue
    }
    if (key === 'structured_data') {
      payload[key] = seo[key] && typeof seo[key] === 'object' ? seo[key] : {}
      continue
    }
    if (key === 'extensions') {
      payload[key] =
        seo[key] && typeof seo[key] === 'object' && !Array.isArray(seo[key]) ? seo[key] : {}
      continue
    }
    if (key === 'seo_score') {
      const score = Number(seo[key])
      payload[key] = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null
      continue
    }
    if (key === 'og_image_id' || key === 'twitter_image_id') {
      payload[key] = seo[key] || null
      continue
    }
    if (typeof seo[key] === 'string') {
      payload[key] = emptyToNull(seo[key])
      continue
    }
    if (seo[key] === null) {
      payload[key] = null
      continue
    }
    payload[key] = seo[key]
  }

  assertSeoPayloadConstraints(payload, mode)
  return payload
}
