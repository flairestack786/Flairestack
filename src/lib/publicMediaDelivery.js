/**
 * Public CMS media delivery helpers.
 *
 * Prefer Supabase Storage Image Transformations so browsers download resized
 * derivatives instead of full originals (reduces Storage egress bytes).
 *
 * Transforms require Pro (or higher) with Image Transformations enabled in
 * Storage settings. Free plan does not include transforms — set
 * NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS=0 to fall back to originals.
 *
 * Next.js `next/image` alone does not reduce Supabase egress on cache miss:
 * the optimizer still downloads the original from Storage first.
 *
 * Widths are snapped to MEDIA_TRANSFORM_WIDTHS so srcset cannot mint unbounded
 * unique transform variants (transform quota / cache efficiency).
 */

import { MEDIA_BUCKET } from './mediaFormat.js'

const OBJECT_PUBLIC_MARKER = `/storage/v1/object/public/${MEDIA_BUCKET}/`
const RENDER_PUBLIC_MARKER = `/storage/v1/render/image/public/${MEDIA_BUCKET}/`

/** Controlled transform widths only — keep this list short and shared. */
export const MEDIA_TRANSFORM_WIDTHS = Object.freeze([
  64, 96, 128, 160, 240, 320, 480, 640, 720, 960, 1080, 1280, 1440, 1600, 1920,
])

const NON_TRANSFORM_EXT = new Set([
  '.svg', // keep vectors as vectors; transform rasterizes poorly for logos/icons
  '.mp4',
  '.webm',
  '.mov',
  '.avi',
  '.gif', // animated GIFs often break or balloon when transformed
  '.ico',
])

/**
 * @returns {boolean}
 */
export function areSupabaseImageTransformsEnabled() {
  const raw =
    typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS : undefined
  if (raw == null || raw === '') return true
  return raw !== '0' && String(raw).toLowerCase() !== 'false'
}

/**
 * Snap a requested CSS pixel width onto the controlled allowlist.
 * Prefers the smallest allowlisted width that is >= request (ceil), else max.
 * @param {number} width
 * @returns {number}
 */
export function snapTransformWidth(width) {
  const n = Math.round(Number(width))
  if (!Number.isFinite(n) || n <= 0) return MEDIA_TRANSFORM_WIDTHS[MEDIA_TRANSFORM_WIDTHS.length - 1]
  for (const candidate of MEDIA_TRANSFORM_WIDTHS) {
    if (candidate >= n) return candidate
  }
  return MEDIA_TRANSFORM_WIDTHS[MEDIA_TRANSFORM_WIDTHS.length - 1]
}

/**
 * @param {string | null | undefined} urlOrPath
 * @returns {boolean}
 */
export function isSupabaseSiteMediaUrl(urlOrPath) {
  const value = String(urlOrPath ?? '').trim()
  if (!value) return false
  if (value.includes(OBJECT_PUBLIC_MARKER) || value.includes(RENDER_PUBLIC_MARKER)) return true
  // Storage path without host (CMS path field)
  if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) {
    return !value.includes('://')
  }
  return false
}

/**
 * @param {string} pathOnly
 * @returns {string}
 */
function extensionOf(pathOnly) {
  const match = pathOnly.toLowerCase().match(/\.[a-z0-9]+$/i)
  return match ? match[0] : ''
}

/**
 * @param {string | null | undefined} urlOrPath
 * @returns {boolean}
 */
export function canTransformPublicMedia(urlOrPath) {
  if (!areSupabaseImageTransformsEnabled()) return false
  const value = String(urlOrPath ?? '').trim()
  if (!value) return false
  if (value.startsWith('/') && !value.includes('/storage/v1/')) return false
  if (!isSupabaseSiteMediaUrl(value) && /^https?:\/\//i.test(value)) return false

  const pathOnly = value.split('?')[0].split('#')[0]
  const ext = extensionOf(pathOnly)
  if (ext && NON_TRANSFORM_EXT.has(ext)) return false
  return true
}

/**
 * Normalize a CMS path or public object URL into a transformable public object URL.
 * @param {string} urlOrPath
 * @param {(path: string) => string | null} [resolveObjectUrl]
 * @returns {string | null}
 */
export function toPublicObjectMediaUrl(urlOrPath, resolveObjectUrl) {
  const value = String(urlOrPath ?? '').trim()
  if (!value) return null

  if (value.includes(RENDER_PUBLIC_MARKER)) {
    return value.replace(RENDER_PUBLIC_MARKER, OBJECT_PUBLIC_MARKER).split('?')[0]
  }

  if (/^https?:\/\//i.test(value)) {
    return value.split('?')[0]
  }

  if (value.startsWith('/')) {
    return value
  }

  if (typeof resolveObjectUrl === 'function') {
    return resolveObjectUrl(value)
  }

  return null
}

/**
 * Build a Supabase render/image URL for a public object URL or return the original.
 *
 * @param {string | null | undefined} urlOrPath
 * @param {{
 *   width?: number,
 *   quality?: number,
 *   resize?: 'cover' | 'contain' | 'fill',
 *   resolveObjectUrl?: (path: string) => string | null,
 * }} [options]
 * @returns {string | null}
 */
export function buildTransformedMediaUrl(urlOrPath, options = {}) {
  const {
    width = 1280,
    quality = 75,
    resize = 'contain',
    resolveObjectUrl,
  } = options

  const original = toPublicObjectMediaUrl(urlOrPath, resolveObjectUrl) || String(urlOrPath ?? '').trim()
  if (!original) return null
  if (!canTransformPublicMedia(original)) return original

  if (!original.includes(OBJECT_PUBLIC_MARKER) && !original.includes(RENDER_PUBLIC_MARKER)) {
    // Relative site asset or unresolved path — leave unchanged.
    if (original.startsWith('/') || !/^https?:\/\//i.test(original)) return original
  }

  let renderBase = original
  if (original.includes(OBJECT_PUBLIC_MARKER)) {
    renderBase = original.replace(OBJECT_PUBLIC_MARKER, RENDER_PUBLIC_MARKER)
  } else if (!original.includes(RENDER_PUBLIC_MARKER)) {
    return original
  }

  try {
    const url = new URL(renderBase.split('?')[0])
    const safeWidth = snapTransformWidth(width)
    const safeQuality = Math.min(100, Math.max(20, Math.round(Number(quality) || 75)))
    url.searchParams.set('width', String(safeWidth))
    url.searchParams.set('quality', String(safeQuality))
    url.searchParams.set('resize', resize)

    // PNG may include alpha; keep origin format so transparency is not flattened
    // when a client would otherwise receive JPEG.
    const ext = extensionOf(url.pathname)
    if (ext === '.png') {
      url.searchParams.set('format', 'origin')
    }

    return url.toString()
  } catch {
    return original
  }
}

/**
 * @param {string | null | undefined} urlOrPath
 * @param {{
 *   widths?: number[],
 *   quality?: number,
 *   resize?: 'cover' | 'contain' | 'fill',
 *   resolveObjectUrl?: (path: string) => string | null,
 * }} [options]
 * @returns {{ src: string, srcSet: string | undefined, sizesHint: boolean }}
 */
export function buildResponsiveMediaSource(urlOrPath, options = {}) {
  const widths = (options.widths || [640, 960, 1280])
    .map((w) => snapTransformWidth(w))
    .filter((w) => w > 0)
    .sort((a, b) => a - b)

  const uniqueWidths = [...new Set(widths)]
  const primaryWidth = uniqueWidths[uniqueWidths.length - 1] || 1280
  const src = buildTransformedMediaUrl(urlOrPath, {
    width: primaryWidth,
    quality: options.quality,
    resize: options.resize,
    resolveObjectUrl: options.resolveObjectUrl,
  })

  if (!src) {
    return { src: '', srcSet: undefined, sizesHint: false }
  }

  if (!canTransformPublicMedia(urlOrPath) || uniqueWidths.length <= 1) {
    return { src, srcSet: undefined, sizesHint: false }
  }

  const srcSet = uniqueWidths
    .map((width) => {
      const entry = buildTransformedMediaUrl(urlOrPath, {
        width,
        quality: options.quality,
        resize: options.resize,
        resolveObjectUrl: options.resolveObjectUrl,
      })
      return entry ? `${entry} ${width}w` : null
    })
    .filter(Boolean)
    .join(', ')

  return { src, srcSet: srcSet || undefined, sizesHint: Boolean(srcSet) }
}

/**
 * Common public layout presets.
 * `sizes` must match real CSS layout slots so mobile does not fetch desktop derivatives.
 */
export const MEDIA_SIZE_PRESETS = Object.freeze({
  // .testimonial-avatar is 52×52 CSS px
  avatar: Object.freeze({
    widths: [64, 96, 128],
    sizes: '52px',
    quality: 70,
  }),
  // .site-logo-image height 32–36, max-width 180–200
  logo: Object.freeze({
    widths: [160, 240, 320],
    sizes: '(max-width: 768px) 140px, 180px',
    quality: 75,
  }),
  // Home/service feature cards: full-bleed mobile, ~half row on tablet, ~560–640 desktop
  card: Object.freeze({
    widths: [480, 640, 960, 1280],
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px',
    quality: 75,
  }),
  // Home process story media: stacked full width under ~900px, half pane after
  process: Object.freeze({
    widths: [480, 720, 1080, 1440],
    sizes: '(max-width: 900px) 100vw, 50vw',
    quality: 75,
  }),
  // Full-bleed heroes / banners; include 640 so phones are not forced to 960+
  hero: Object.freeze({
    widths: [640, 960, 1440, 1920],
    sizes: '100vw',
    quality: 72,
  }),
  banner: Object.freeze({
    widths: [640, 960, 1440, 1920],
    sizes: '100vw',
    quality: 72,
  }),
  // About founder photos: full width on mobile, constrained card on desktop
  portrait: Object.freeze({
    widths: [480, 720, 960],
    sizes: '(max-width: 767px) 100vw, 420px',
    quality: 75,
  }),
})

/**
 * Spreadable img attrs for motion.img / raw <img> when CmsOptimizedImage is awkward.
 * Pure / deterministic for a given src+preset (safe across React rerenders).
 * @param {string | null | undefined} urlOrPath
 * @param {keyof typeof MEDIA_SIZE_PRESETS | string} [presetName]
 * @param {(path: string) => string | null} [resolveObjectUrl]
 * @returns {{ src: string, srcSet?: string, sizes?: string }}
 */
export function cmsResponsiveImgProps(urlOrPath, presetName = 'card', resolveObjectUrl) {
  const preset = MEDIA_SIZE_PRESETS[presetName] || MEDIA_SIZE_PRESETS.card
  const source = buildResponsiveMediaSource(urlOrPath, {
    widths: preset.widths,
    quality: preset.quality,
    resize: 'contain',
    resolveObjectUrl,
  })
  if (!source.src) return { src: '' }
  if (!source.srcSet) return { src: source.src }
  return { src: source.src, srcSet: source.srcSet, sizes: preset.sizes }
}
