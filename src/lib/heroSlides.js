/**
 * Shared homepage hero slideshow helpers (Vite + Next + tests).
 * Normalizes CMS rows, filters/orders enabled slides, and builds a safe
 * fallback from the legacy page_sections.hero payload.
 */

/** @typedef {'image' | 'video'} HeroMediaType */

/**
 * @typedef {object} PublicHeroSlide
 * @property {string} id
 * @property {HeroMediaType} mediaType
 * @property {string | null} mediaUrl
 * @property {string | null} posterUrl
 * @property {string} mediaAlt
 * @property {string} eyebrow
 * @property {string} title
 * @property {string} titleAccent
 * @property {string} intro
 * @property {string} body
 * @property {string} ctaLabel
 * @property {string} ctaUrl
 * @property {string} ctaSecondaryLabel
 * @property {string} ctaSecondaryUrl
 */

/** Auto-advance interval — long enough to read each slide comfortably. */
export const HERO_SLIDE_INTERVAL_MS = 10000

/** Background video playback rate (muted inline hero media). */
export const HERO_VIDEO_PLAYBACK_RATE = 0.75

export const FALLBACK_HERO_SLIDE_CONTENT = Object.freeze({
  title: 'Building intelligent',
  titleAccent: 'digital experiences',
  intro: 'for the future.',
  body:
    'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.',
  ctaLabel: 'Book Consultation',
  ctaUrl: '#contact',
})

/**
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function textOrEmpty(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

/**
 * Allow in-page anchors, relative paths, and http(s) destinations only.
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function sanitizeCtaUrl(value, fallback = '#contact') {
  const raw = String(value ?? '').trim()
  if (!raw) return fallback
  if (raw.startsWith('#')) return raw
  if (raw.startsWith('/')) return raw
  if (/^https?:\/\//i.test(raw)) return raw
  return fallback
}

/**
 * @param {unknown} value
 * @returns {HeroMediaType}
 */
export function normalizeMediaType(value) {
  return String(value ?? '').trim().toLowerCase() === 'video' ? 'video' : 'image'
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @param {(path: string) => string | null} resolveUrl
 * @returns {PublicHeroSlide | null}
 */
export function normalizeHeroSlideRow(row, resolveUrl) {
  if (!row || typeof row !== 'object') return null

  const id = textOrEmpty(row.id)
  if (!id) return null

  const mediaType = normalizeMediaType(row.media_type)
  const mediaPath = textOrEmpty(row.media_path)
  const posterPath = textOrEmpty(row.poster_path)
  // Title is required for enabled slides in the DB; keep a safe non-empty string
  // for disabled/draft rows. Do NOT fill optional fields from FALLBACK — that
  // made every incomplete slide look identical to the homepage default copy.
  const title = textOrEmpty(row.title, 'Untitled slide')

  const mediaUrl = mediaPath && typeof resolveUrl === 'function' ? resolveUrl(mediaPath) : null
  const posterUrl = posterPath && typeof resolveUrl === 'function' ? resolveUrl(posterPath) : null

  const primaryCtaLabel = textOrEmpty(row.cta_primary_label)
  const primaryCtaUrlRaw = textOrEmpty(row.cta_primary_url)

  return {
    id,
    mediaType,
    mediaUrl: mediaUrl || null,
    posterUrl: posterUrl || null,
    mediaAlt: textOrEmpty(row.media_alt),
    eyebrow: textOrEmpty(row.eyebrow),
    title,
    titleAccent: textOrEmpty(row.title_accent),
    intro: textOrEmpty(row.intro),
    body: textOrEmpty(row.body),
    ctaLabel: primaryCtaLabel,
    ctaUrl: primaryCtaLabel && primaryCtaUrlRaw ? sanitizeCtaUrl(primaryCtaUrlRaw, '') : '',
    ctaSecondaryLabel: textOrEmpty(row.cta_secondary_label),
    ctaSecondaryUrl: row.cta_secondary_url
      ? sanitizeCtaUrl(row.cta_secondary_url, '')
      : '',
  }
}

/**
 * @param {Record<string, unknown>[] | null | undefined} rows
 * @param {(path: string) => string | null} resolveUrl
 * @param {{ includeDisabled?: boolean }} [options]
 * @returns {PublicHeroSlide[]}
 */
export function buildPublicHeroSlides(rows, resolveUrl, options = {}) {
  const includeDisabled = Boolean(options.includeDisabled)
  const list = Array.isArray(rows) ? [...rows] : []

  list.sort((a, b) => {
    const orderA = Number(a?.sort_order) || 0
    const orderB = Number(b?.sort_order) || 0
    if (orderA !== orderB) return orderA - orderB
    return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
  })

  return list
    .filter((row) => includeDisabled || row?.is_enabled !== false)
    .map((row) => normalizeHeroSlideRow(row, resolveUrl))
    .filter(Boolean)
}

/**
 * Build a single-slide fallback from legacy hero section / static defaults.
 * @param {{
 *   title?: string,
 *   titleAccent?: string,
 *   intro?: string,
 *   body?: string,
 *   ctaLabel?: string,
 *   ctaUrl?: string,
 *   backgroundImageUrl?: string | null,
 *   useBundledBackground?: boolean,
 * } | null | undefined} legacyHero
 * @returns {PublicHeroSlide[]}
 */
export function buildFallbackHeroSlides(legacyHero) {
  const hero = legacyHero ?? {}
  return [
    {
      id: 'fallback-hero',
      mediaType: 'image',
      mediaUrl: hero.backgroundImageUrl || null,
      posterUrl: null,
      mediaAlt: '',
      eyebrow: '',
      title: textOrEmpty(hero.title, FALLBACK_HERO_SLIDE_CONTENT.title),
      titleAccent: textOrEmpty(hero.titleAccent, FALLBACK_HERO_SLIDE_CONTENT.titleAccent),
      intro: textOrEmpty(hero.intro, FALLBACK_HERO_SLIDE_CONTENT.intro),
      body: textOrEmpty(hero.body, FALLBACK_HERO_SLIDE_CONTENT.body),
      ctaLabel: textOrEmpty(hero.ctaLabel, FALLBACK_HERO_SLIDE_CONTENT.ctaLabel),
      ctaUrl: sanitizeCtaUrl(hero.ctaUrl, FALLBACK_HERO_SLIDE_CONTENT.ctaUrl),
      ctaSecondaryLabel: '',
      ctaSecondaryUrl: '',
      // Internal flag consumed by the renderer for bundled asset fallback
      useBundledBackground: hero.useBundledBackground !== false && !hero.backgroundImageUrl,
    },
  ]
}

/**
 * Prefer CMS slides; fall back to legacy hero content when empty or failed.
 * @param {Record<string, unknown>[] | null | undefined} rows
 * @param {(path: string) => string | null} resolveUrl
 * @param {Parameters<typeof buildFallbackHeroSlides>[0]} legacyHero
 * @returns {PublicHeroSlide[]}
 */
export function resolvePublicHeroSlides(rows, resolveUrl, legacyHero) {
  try {
    const slides = buildPublicHeroSlides(rows, resolveUrl)
    if (slides.length > 0) return slides
  } catch {
    // fall through
  }
  return buildFallbackHeroSlides(legacyHero)
}
