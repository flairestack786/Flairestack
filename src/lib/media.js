import { supabase } from './supabase'
import {
  MEDIA_BUCKET,
  buildRenamedStoragePath,
  getFilenameStem,
  getPathExtension,
  getPathFolder,
  slugifyFilename,
  validateFilenameStem,
} from './mediaFormat'

export {
  MEDIA_BUCKET as BUCKET,
  buildRenamedStoragePath,
  getFilenameStem,
  getPathExtension,
  getPathFolder,
  slugifyFilename,
  validateFilenameStem,
}

const BUCKET = MEDIA_BUCKET

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
