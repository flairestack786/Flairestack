/**
 * Shared hero slideshow media validation (admin upload + tests).
 * Does not talk to Storage — callers pass contentType into supabase.storage.upload.
 */

export const HERO_MAX_VIDEO_BYTES = 80 * 1024 * 1024
export const HERO_MAX_IMAGE_BYTES = 15 * 1024 * 1024

export const HERO_IMAGE_MIME = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
])

export const HERO_VIDEO_MIME = Object.freeze(['video/mp4', 'video/webm', 'video/quicktime'])

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])

/**
 * @param {string} filename
 * @returns {string}
 */
export function getLowerExtension(filename) {
  const name = String(filename ?? '')
  const idx = name.lastIndexOf('.')
  if (idx < 0) return ''
  return name.slice(idx).toLowerCase()
}

/**
 * Infer a Storage content type when the browser leaves File.type empty.
 * @param {string} filename
 * @param {string} [declaredType]
 * @returns {string}
 */
export function resolveHeroMediaContentType(filename, declaredType = '') {
  const declared = String(declaredType ?? '').trim().toLowerCase()
  if (declared && (declared.startsWith('image/') || declared.startsWith('video/'))) {
    return declared === 'image/jpg' ? 'image/jpeg' : declared
  }

  switch (getLowerExtension(filename)) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.avif':
      return 'image/avif'
    case '.svg':
      return 'image/svg+xml'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.mov':
      return 'video/quicktime'
    default:
      return declared || 'application/octet-stream'
  }
}

/**
 * @param {string} contentType
 * @param {string} filename
 * @returns {'image' | 'video' | null}
 */
export function classifyHeroMedia(contentType, filename) {
  const type = String(contentType ?? '').toLowerCase()
  const ext = getLowerExtension(filename)

  if (HERO_VIDEO_MIME.includes(type) || VIDEO_EXT.has(ext)) return 'video'
  if (HERO_IMAGE_MIME.includes(type) || type.startsWith('image/') || IMAGE_EXT.has(ext)) {
    return 'image'
  }
  return null
}

/**
 * @param {{ name?: string, type?: string, size?: number } | null | undefined} file
 * @returns {{
 *   ok: true,
 *   kind: 'image' | 'video',
 *   contentType: string,
 * } | {
 *   ok: false,
 *   error: string,
 * }}
 */
export function validateHeroMediaFile(file) {
  if (!file || typeof file !== 'object') {
    return { ok: false, error: 'Choose an image or video file to upload.' }
  }

  const name = String(file.name ?? 'upload')
  const contentType = resolveHeroMediaContentType(name, file.type)
  const kind = classifyHeroMedia(contentType, name)

  if (!kind) {
    return {
      ok: false,
      error:
        'Unsupported file type. Use JPEG, PNG, WebP, GIF, or AVIF images; or MP4 / WebM videos.',
    }
  }

  const size = Number(file.size) || 0
  if (kind === 'video' && size > HERO_MAX_VIDEO_BYTES) {
    return {
      ok: false,
      error: 'Video must be 80 MB or smaller. Compress the file before uploading.',
    }
  }
  if (kind === 'image' && size > HERO_MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: 'Image must be 15 MB or smaller.',
    }
  }

  if (kind === 'video' && !HERO_VIDEO_MIME.includes(contentType) && !VIDEO_EXT.has(getLowerExtension(name))) {
    return {
      ok: false,
      error: 'Unsupported video format. Use MP4 (video/mp4) or WebM (video/webm).',
    }
  }

  return { ok: true, kind, contentType }
}

/**
 * Map Supabase Storage / client errors into actionable CMS messages.
 * @param {unknown} err
 * @returns {string}
 */
export function formatHeroUploadError(err) {
  const message = String(
    err && typeof err === 'object' && 'message' in err
      ? /** @type {{ message?: unknown }} */ (err).message
      : err ?? ''
  ).trim()

  const lower = message.toLowerCase()
  if (lower.includes('mime type') && lower.includes('not supported')) {
    return (
      'This Storage bucket does not allow that media type yet. ' +
      'Apply migration 20261025150000_site_media_allow_hero_video.sql ' +
      '(adds video/mp4 and video/webm to site-media), then retry.'
    )
  }
  if (lower.includes('payload too large') || lower.includes('maximum allowed size')) {
    return 'File exceeds the Storage size limit. Use a smaller file (videos ≤ 80 MB).'
  }
  if (lower.includes('row-level security') || lower.includes('unauthorized') || lower.includes('403')) {
    return 'Upload was blocked by Storage permissions. Sign in as an authorized CMS user and retry.'
  }
  return message || 'Upload failed.'
}

/**
 * Pick a <source type="…"> for a video URL/path.
 * @param {string | null | undefined} mediaUrl
 * @returns {string}
 */
export function videoSourceTypeFromUrl(mediaUrl) {
  const value = String(mediaUrl ?? '').toLowerCase()
  if (value.includes('.webm')) return 'video/webm'
  if (value.includes('.mov')) return 'video/quicktime'
  return 'video/mp4'
}
