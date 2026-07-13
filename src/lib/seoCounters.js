/** Character-counter bands + SEO checklist helpers. */

export const FIELD_LIMITS = Object.freeze({
  meta_title: { min: 30, max: 60, idealMin: 50, idealMax: 60 },
  meta_description: { min: 120, max: 160, idealMin: 140, idealMax: 160 },
  og_title: { min: 30, max: 70, idealMin: 40, idealMax: 60 },
  og_description: { min: 80, max: 200, idealMin: 110, idealMax: 160 },
  twitter_title: { min: 30, max: 70, idealMin: 40, idealMax: 60 },
  twitter_description: { min: 80, max: 200, idealMin: 110, idealMax: 160 },
  page_description: { min: 40, max: 500, idealMin: 80, idealMax: 280 },
})

/**
 * @param {number} length
 * @param {{ min: number, max: number, idealMin: number, idealMax: number }} limits
 * @returns {'excellent' | 'needs-improvement' | 'poor' | 'empty'}
 */
export function getLengthBand(length, limits) {
  if (!length) return 'empty'
  if (length < limits.min || length > limits.max) return 'poor'
  if (length >= limits.idealMin && length <= limits.idealMax) return 'excellent'
  return 'needs-improvement'
}

/**
 * @param {string} value
 * @param {keyof typeof FIELD_LIMITS} field
 */
export function getFieldCounter(value, field) {
  const limits = FIELD_LIMITS[field]
  const length = String(value ?? '').length
  return {
    length,
    max: limits.max,
    min: limits.min,
    band: getLengthBand(length, limits),
    label: `${length}/${limits.max}`,
  }
}

/**
 * @param {Record<string, unknown>} resolvedSeo
 * @param {Record<string, boolean>} [inherited]
 */
export function buildSeoChecklist(resolvedSeo, inherited = {}) {
  const items = [
    {
      id: 'meta_title',
      label: 'Meta Title',
      done: Boolean(String(resolvedSeo.meta_title ?? '').trim()),
      inherited: Boolean(inherited.meta_title),
    },
    {
      id: 'meta_description',
      label: 'Meta Description',
      done: Boolean(String(resolvedSeo.meta_description ?? '').trim()),
      inherited: Boolean(inherited.meta_description),
    },
    {
      id: 'canonical_url',
      label: 'Canonical URL',
      done: Boolean(String(resolvedSeo.canonical_url ?? '').trim()),
      inherited: Boolean(inherited.canonical_url),
    },
    {
      id: 'og_image',
      label: 'Open Graph Image',
      done: Boolean(
        String(resolvedSeo.og_image_path ?? resolvedSeo.og_image_id ?? '').trim()
      ),
      inherited: Boolean(inherited.og_image_path),
    },
    {
      id: 'twitter_image',
      label: 'Twitter Image',
      done: Boolean(
        String(resolvedSeo.twitter_image_path ?? resolvedSeo.twitter_image_id ?? '').trim()
      ),
      inherited: Boolean(inherited.twitter_image_path),
    },
    {
      id: 'focus_keyword',
      label: 'Focus Keyword',
      done: Boolean(String(resolvedSeo.focus_keyword ?? '').trim()),
      inherited: false,
    },
    {
      id: 'jsonld',
      label: 'JSON-LD',
      done: Boolean(
        String(resolvedSeo.structured_data_text ?? '').trim() ||
          (resolvedSeo.structured_data &&
            typeof resolvedSeo.structured_data === 'object' &&
            Object.keys(/** @type {object} */ (resolvedSeo.structured_data)).length > 0)
      ),
      inherited: false,
    },
    {
      id: 'robots',
      label: 'Robots',
      done: Boolean(String(resolvedSeo.robots ?? '').trim()),
      inherited: Boolean(inherited.robots),
    },
    {
      id: 'google_preview',
      label: 'Google Preview',
      done: Boolean(
        String(resolvedSeo.meta_title ?? '').trim() &&
          String(resolvedSeo.meta_description ?? '').trim()
      ),
      inherited: false,
    },
    {
      id: 'social_preview',
      label: 'Social Preview',
      done: Boolean(
        String(resolvedSeo.og_title || resolvedSeo.meta_title || '').trim() &&
          String(resolvedSeo.og_image_path || resolvedSeo.twitter_image_path || '').trim()
      ),
      inherited: false,
    },
  ]

  const completed = items.filter((item) => item.done).length
  const missing = items.filter((item) => !item.done)
  const percent = Math.round((completed / items.length) * 100)

  return { items, completed, total: items.length, missing, percent }
}
