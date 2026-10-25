/**
 * Pure helpers for homepage hero slideshow media resolution and readiness.
 * Keeps CMS media from flashing the bundled default during transitions.
 */

/**
 * @typedef {import('./heroSlides').PublicHeroSlide & { useBundledBackground?: boolean }} HeroSlideView
 */

/**
 * @typedef {'video' | 'image' | 'bundled' | 'none'} HeroVisualKind
 */

/**
 * @typedef {object} HeroSlideVisual
 * @property {HeroVisualKind} kind
 * @property {string | null} src
 * @property {string | null} [poster]
 * @property {string} [alt]
 */

/**
 * Resolve the visual layer for a slide.
 *
 * Critical: a slide with a valid CMS `mediaUrl` must NEVER resolve to the
 * bundled default while that media is still considered available. Bundled
 * assets are only for explicit legacy fallback slides or total media failure
 * (video error + no poster).
 *
 * @param {HeroSlideView | null | undefined} slide
 * @param {{
 *   videoFailed?: boolean,
 *   reducedMotion?: boolean,
 *   bundledImageSrc?: string | null,
 * }} [options]
 * @returns {HeroSlideVisual}
 */
export function resolveHeroSlideVisual(slide, options = {}) {
  const videoFailed = Boolean(options.videoFailed)
  const reducedMotion = Boolean(options.reducedMotion)
  const bundledImageSrc = options.bundledImageSrc || null

  if (!slide || typeof slide !== 'object') {
    return { kind: 'none', src: null }
  }

  const mediaUrl = typeof slide.mediaUrl === 'string' && slide.mediaUrl.trim() ? slide.mediaUrl : null
  const posterUrl =
    typeof slide.posterUrl === 'string' && slide.posterUrl.trim() ? slide.posterUrl : null
  const mediaType = slide.mediaType === 'video' ? 'video' : 'image'

  if (mediaType === 'image' && mediaUrl) {
    return { kind: 'image', src: mediaUrl, alt: String(slide.mediaAlt || '') }
  }

  if (mediaType === 'video' && mediaUrl) {
    // Prefer live video unless reduced-motion or the element failed.
    if (!videoFailed && !reducedMotion) {
      return { kind: 'video', src: mediaUrl, poster: posterUrl }
    }
    if (posterUrl) {
      return { kind: 'image', src: posterUrl, alt: '' }
    }
    // Failed video with no poster — last resort only.
    if (bundledImageSrc) {
      return { kind: 'bundled', src: bundledImageSrc, alt: '' }
    }
    return { kind: 'none', src: null }
  }

  // Explicit legacy fallback slide (no CMS media path).
  if (slide.useBundledBackground && bundledImageSrc) {
    return { kind: 'bundled', src: bundledImageSrc, alt: '' }
  }

  if (posterUrl) {
    return { kind: 'image', src: posterUrl, alt: '' }
  }

  if (bundledImageSrc) {
    return { kind: 'bundled', src: bundledImageSrc, alt: '' }
  }

  return { kind: 'none', src: null }
}

/**
 * Whether the bundled default may appear for this slide in the current state.
 * Used by tests and guards — normal CMS video/image slides return false.
 *
 * @param {HeroSlideView | null | undefined} slide
 * @param {{ videoFailed?: boolean, reducedMotion?: boolean }} [options]
 * @returns {boolean}
 */
export function slideMayUseBundledFallback(slide, options = {}) {
  if (!slide) return true
  const mediaUrl = typeof slide.mediaUrl === 'string' && slide.mediaUrl.trim()
  if (!mediaUrl) return true
  if (slide.mediaType === 'video' && options.videoFailed && !slide.posterUrl) return true
  if (slide.mediaType === 'video' && options.reducedMotion && !slide.posterUrl) return true
  return false
}

/**
 * Next slide index with wrap-around.
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
export function nextSlideIndex(index, length) {
  if (!length) return 0
  return ((index % length) + length + 1) % length
}

/**
 * Whether a video element has a decodable frame ready to display.
 * @param {Pick<HTMLVideoElement, 'readyState'> | null | undefined} video
 * @returns {boolean}
 */
export function videoHasDisplayFrame(video) {
  // HAVE_CURRENT_DATA (2) or higher — enough for a first paint.
  return Boolean(video && typeof video.readyState === 'number' && video.readyState >= 2)
}

/**
 * Decide preload attribute for a video slide slot.
 * Active: auto. Next (warmup): metadata. Others: none.
 *
 * @param {{ isActive: boolean, isNext: boolean }} state
 * @returns {'auto' | 'metadata' | 'none'}
 */
export function videoPreloadForSlot({ isActive, isNext }) {
  if (isActive) return 'auto'
  if (isNext) return 'metadata'
  return 'none'
}

/**
 * Whether incoming media is ready enough to crossfade onto.
 *
 * @param {HeroSlideVisual} visual
 * @param {{
 *   videoReady?: boolean,
 *   imageReady?: boolean,
 * }} readiness
 * @returns {boolean}
 */
export function isIncomingMediaReady(visual, readiness = {}) {
  if (!visual || visual.kind === 'none') return true
  if (visual.kind === 'video') return Boolean(readiness.videoReady)
  if (visual.kind === 'image' || visual.kind === 'bundled') {
    // Images are usually cache-fast; treat missing flag as ready to avoid stalling.
    return readiness.imageReady !== false
  }
  return true
}

/**
 * Merge readiness for a slide id, ignoring stale generations.
 *
 * @param {Record<string, boolean>} current
 * @param {string} slideId
 * @param {boolean} ready
 * @param {number} eventGeneration
 * @param {number} activeGeneration
 * @returns {Record<string, boolean>}
 */
export function applyMediaReadyState(
  current,
  slideId,
  ready,
  eventGeneration,
  activeGeneration
) {
  if (eventGeneration !== activeGeneration) return current
  if (!slideId) return current
  if (current[slideId] === ready) return current
  return { ...current, [slideId]: ready }
}
