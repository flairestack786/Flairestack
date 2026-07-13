/**
 * Shared formatters and caches for admin media library metadata.
 */

/** @type {Map<string, { width: number, height: number }>} */
const dimensionCache = new Map()

const IMAGE_TYPE_BY_EXTENSION = {
  '.png': 'PNG',
  '.jpg': 'JPG',
  '.jpeg': 'JPG',
  '.webp': 'WebP',
  '.svg': 'SVG',
  '.gif': 'GIF',
}

/**
 * @param {number | null | undefined} bytes
 * @returns {string | null}
 */
export function formatMediaFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return null
  const size = Number(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * @param {string | undefined} value
 * @returns {string | null}
 */
export function formatMediaUploadDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * @param {string} pathOrFilename
 * @returns {string | null}
 */
export function getMediaImageType(pathOrFilename) {
  const basename = pathOrFilename.split('/').pop() ?? pathOrFilename
  const lastDot = basename.lastIndexOf('.')
  if (lastDot <= 0) return null
  const extension = basename.slice(lastDot).toLowerCase()
  return IMAGE_TYPE_BY_EXTENSION[extension] ?? extension.slice(1).toUpperCase()
}

/**
 * @param {import('@supabase/storage-js').FileObject} file
 * @returns {number | null}
 */
export function resolveStorageFileSize(file) {
  const metadata = file.metadata ?? {}
  const raw = metadata.size ?? metadata.contentLength ?? metadata.content_length
  return raw != null ? Number(raw) : null
}

/**
 * @param {import('@supabase/storage-js').FileObject} file
 * @returns {string}
 */
export function getMediaDisplayFilename(file) {
  const original = file?.metadata?.originalFilename
  if (typeof original === 'string' && original.trim()) {
    return original.trim()
  }
  return String(file?.name ?? '').trim()
}

/**
 * @param {string} cacheKey
 * @returns {{ width: number, height: number } | null}
 */
export function getCachedImageDimensions(cacheKey) {
  return dimensionCache.get(cacheKey) ?? null
}

/**
 * @param {string} cacheKey
 * @param {number} width
 * @param {number} height
 */
export function cacheImageDimensions(cacheKey, width, height) {
  if (!width || !height) return
  dimensionCache.set(cacheKey, { width, height })
}

/**
 * @param {number | null | undefined} width
 * @param {number | null | undefined} height
 * @returns {string | null}
 */
export function formatImageDimensions(width, height) {
  if (!width || !height) return null
  return `${width} × ${height}`
}
