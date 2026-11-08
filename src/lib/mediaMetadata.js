/**
 * Shared formatters and caches for admin media library metadata.
 * Sources: Storage FileObject name/path, metadata.mimetype, metadata.size, created_at.
 */

/** @type {Map<string, { width: number, height: number }>} */
const dimensionCache = new Map()

const FORMAT_BY_EXTENSION = Object.freeze({
  '.png': 'PNG',
  '.jpg': 'JPG',
  '.jpeg': 'JPG',
  '.webp': 'WEBP',
  '.svg': 'SVG',
  '.gif': 'GIF',
  '.avif': 'AVIF',
  '.mp4': 'MP4',
  '.webm': 'WEBM',
  '.mov': 'MOV',
  '.avi': 'AVI',
})

const FORMAT_BY_MIME = Object.freeze({
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/webp': 'WEBP',
  'image/svg+xml': 'SVG',
  'image/gif': 'GIF',
  'image/avif': 'AVIF',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  'video/quicktime': 'MOV',
  'video/x-msvideo': 'AVI',
  'video/avi': 'AVI',
})

const VIDEO_FORMATS = new Set(['MP4', 'WEBM', 'MOV', 'AVI'])
const IMAGE_FORMATS = new Set(['PNG', 'JPG', 'WEBP', 'GIF', 'AVIF'])

/**
 * @param {string} pathOrFilename
 * @returns {string}
 */
function getExtension(pathOrFilename) {
  const basename = String(pathOrFilename ?? '').split('/').pop() ?? ''
  const lastDot = basename.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return basename.slice(lastDot).toLowerCase()
}

/**
 * @param {number} value
 * @param {string} unit
 * @returns {string}
 */
function formatSizeUnit(value, unit) {
  const text =
    value >= 100 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '')
  return `${text} ${unit}`
}

/**
 * @param {number | null | undefined} bytes
 * @returns {string | null}
 */
export function formatMediaFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return null
  const size = Number(bytes)
  if (size < 0) return null
  if (size < 1024) return `${Math.round(size)} B`
  if (size < 1024 * 1024) return formatSizeUnit(size / 1024, 'KB')
  if (size < 1024 * 1024 * 1024) return formatSizeUnit(size / (1024 * 1024), 'MB')
  return formatSizeUnit(size / (1024 * 1024 * 1024), 'GB')
}

/**
 * Format an original upload timestamp. Returns null when missing/invalid.
 * Callers must pass Storage `created_at` — never `updated_at`.
 * @param {string | undefined | null} value
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
 * Resolve display format from extension, with MIME as fallback.
 * @param {string} pathOrFilename
 * @param {string | null | undefined} [mimeType]
 * @returns {string | null}
 */
export function getMediaFileFormat(pathOrFilename, mimeType) {
  const extension = getExtension(pathOrFilename)
  if (extension && FORMAT_BY_EXTENSION[extension]) {
    return FORMAT_BY_EXTENSION[extension]
  }

  const mime = String(mimeType ?? '')
    .trim()
    .toLowerCase()
  if (mime && FORMAT_BY_MIME[mime]) {
    return FORMAT_BY_MIME[mime]
  }

  if (extension) {
    return extension.slice(1).toUpperCase()
  }

  if (mime.startsWith('image/')) {
    const subtype = mime.slice('image/'.length).split('+')[0]
    return subtype ? subtype.toUpperCase() : null
  }
  if (mime.startsWith('video/')) {
    const subtype = mime.slice('video/'.length).split('+')[0]
    return subtype ? subtype.toUpperCase() : null
  }

  return null
}

/**
 * @deprecated Prefer getMediaFileFormat. Kept for existing call sites.
 * @param {string} pathOrFilename
 * @returns {string | null}
 */
export function getMediaImageType(pathOrFilename) {
  return getMediaFileFormat(pathOrFilename)
}

/**
 * @param {import('@supabase/storage-js').FileObject | { metadata?: Record<string, unknown> } | null | undefined} file
 * @returns {string | null}
 */
export function resolveStorageMimeType(file) {
  const metadata = file?.metadata ?? {}
  const raw =
    metadata.mimetype ??
    metadata.contentType ??
    metadata.content_type ??
    metadata.type
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed || null
}

/**
 * @param {import('@supabase/storage-js').FileObject | { metadata?: Record<string, unknown> } | null | undefined} file
 * @returns {number | null}
 */
export function resolveStorageFileSize(file) {
  const metadata = file?.metadata ?? {}
  const raw = metadata.size ?? metadata.contentLength ?? metadata.content_length
  if (raw == null || raw === '') return null
  const size = Number(raw)
  return Number.isFinite(size) ? size : null
}

/**
 * Original upload timestamp from Storage. Do not fall back to updated_at.
 * @param {import('@supabase/storage-js').FileObject | { created_at?: string } | null | undefined} file
 * @returns {string | null}
 */
export function resolveStorageCreatedAt(file) {
  const value = file?.created_at
  if (typeof value !== 'string' || !value.trim()) return null
  return value
}

/**
 * @param {import('@supabase/storage-js').FileObject | { name?: string, metadata?: Record<string, unknown> } | null | undefined} file
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
 * Coarse kind for compact library filters.
 * @param {string} pathOrFilename
 * @param {string | null | undefined} [mimeType]
 * @returns {'image' | 'video' | 'svg' | 'other'}
 */
export function getMediaKind(pathOrFilename, mimeType) {
  const format = getMediaFileFormat(pathOrFilename, mimeType)
  const mime = String(mimeType ?? '')
    .trim()
    .toLowerCase()

  if (format === 'SVG' || mime === 'image/svg+xml') return 'svg'
  if ((format && VIDEO_FORMATS.has(format)) || mime.startsWith('video/')) return 'video'
  if ((format && IMAGE_FORMATS.has(format)) || mime.startsWith('image/')) return 'image'
  return 'other'
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
