const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/
const SLUG_MAX_LENGTH = 50

/**
 * Build a URL-friendly storage filename from the original upload name.
 * Format: {slugified-stem}-{8-char-uuid}{extension}
 * @param {string} originalFilename
 * @returns {string}
 */
export function slugifyFilename(originalFilename) {
  const extension = getExtension(originalFilename)
  const stem = getFilenameStem(originalFilename)

  let slug = stem
    .toLowerCase()
    .trim()
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) {
    slug = 'file'
  }

  if (slug.length > SLUG_MAX_LENGTH) {
    slug = slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, '')
  }

  const uniqueSuffix = crypto.randomUUID().slice(0, 8)
  return `${slug}-${uniqueSuffix}${extension}`
}

/**
 * @param {string} path
 * @returns {string}
 */
export function getPathFolder(path) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index + 1)
}

/**
 * @param {string} path
 * @returns {string}
 */
export function getPathExtension(path) {
  const basename = path.split('/').pop() ?? path
  const lastDot = basename.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return basename.slice(lastDot)
}

/**
 * @param {string} filename
 * @returns {string}
 */
export function getFilenameStem(filename) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return filename
  return filename.slice(0, lastDot)
}

/**
 * @param {string} stem
 * @returns {string | null}
 */
export function validateFilenameStem(stem) {
  const trimmed = stem.trim()
  if (!trimmed) return 'Filename cannot be empty.'
  if (INVALID_FILENAME_CHARS.test(trimmed)) {
    return 'Filename contains invalid characters (/ \\ : * ? " < > |).'
  }
  return null
}

/**
 * @param {string} currentPath
 * @param {string} newStem
 * @returns {string}
 */
export function buildRenamedStoragePath(currentPath, newStem) {
  const folder = getPathFolder(currentPath)
  const extension = getPathExtension(currentPath)
  return `${folder}${newStem.trim()}${extension}`
}

/**
 * @param {string} filename
 * @returns {string}
 */
function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return filename.slice(lastDot).toLowerCase()
}

export const MEDIA_BUCKET = 'site-media'
