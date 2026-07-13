import { supabase } from './supabase'

const BUCKET = 'site-media'

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
 * Extract a lowercase extension from a filename (includes the leading dot).
 * @param {string} filename
 * @returns {string}
 */
function getExtension(filename) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return filename.slice(lastDot).toLowerCase()
}

/**
 * Upload a file to the site-media bucket with a unique name.
 * @param {File} file
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
export async function uploadFile(file) {
  if (!file) {
    throw new Error('uploadFile requires a File object.')
  }

  const path = slugifyFilename(file.name)

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    metadata: {
      originalFilename: file.name,
    },
  })

  if (error) {
    throw error
  }

  return {
    path,
    publicUrl: getPublicUrl(path),
  }
}

/**
 * List all files in the root of the site-media bucket, newest first.
 * @returns {Promise<import('@supabase/storage-js').FileObject[]>}
 */
export async function listFiles() {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * Delete a file from the site-media bucket.
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
  if (!path) {
    throw new Error('deleteFile requires a storage path.')
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) {
    throw error
  }
}

/**
 * Rename (move) a file within the site-media bucket.
 * @param {string} oldPath
 * @param {string} newPath
 * @param {{ originalFilename?: string }} [options]
 * @returns {Promise<void>}
 */
export async function renameFile(oldPath, newPath, options = {}) {
  if (!oldPath || !newPath) {
    throw new Error('renameFile requires both oldPath and newPath.')
  }

  const { error } = await supabase.storage.from(BUCKET).move(oldPath, newPath)

  if (error) {
    throw error
  }

  const { originalFilename } = options
  if (!originalFilename) return

  const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(newPath)
  if (downloadError) {
    throw downloadError
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(newPath, data, {
    upsert: true,
    cacheControl: '3600',
    metadata: { originalFilename },
  })

  if (uploadError) {
    throw uploadError
  }
}

/**
 * Resolve the public URL for a file in the site-media bucket.
 * @param {string} path
 * @returns {string}
 */
export function getPublicUrl(path) {
  if (!path) {
    throw new Error('getPublicUrl requires a storage path.')
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
