/**
 * Read an optional CMS/static image without crashing when the value is null.
 * `typeof null === 'object'` is true in JS — callers must not use that check alone.
 * @param {unknown} image
 * @param {string} [fallbackAlt]
 * @returns {{ src: string, alt: string }}
 */
export function resolveOptionalMedia(image, fallbackAlt = '') {
  if (typeof image === 'string') {
    const src = image.trim()
    return { src, alt: fallbackAlt }
  }

  if (image && typeof image === 'object') {
    const src = String(/** @type {{ src?: unknown }} */ (image).src ?? '').trim()
    const alt =
      String(/** @type {{ alt?: unknown }} */ (image).alt ?? '').trim() || fallbackAlt
    return { src, alt }
  }

  return { src: '', alt: fallbackAlt }
}
