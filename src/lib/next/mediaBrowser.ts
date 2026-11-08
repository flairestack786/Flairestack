'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import {
  MEDIA_BUCKET,
  MEDIA_CACHE_CONTROL,
  buildRenamedStoragePath,
  getPathExtension,
  slugifyFilename,
} from '@/lib/mediaFormat'

/**
 * Next.js Media Library data layer — same `site-media` bucket as Vite.
 * Uses authenticated anon browser client; Storage/RLS enforce access.
 * No service-role credentials.
 */

export async function uploadFile(file: File) {
  if (!file) {
    throw new Error('uploadFile requires a File object.')
  }

  const supabase = getSupabaseBrowser()
  const path = slugifyFilename(file.name)

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: MEDIA_CACHE_CONTROL,
    upsert: false,
    metadata: {
      originalFilename: file.name,
    },
  })

  if (error) throw error

  return {
    path,
    publicUrl: getPublicUrl(path),
  }
}

export async function listFiles() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) throw error
  return data ?? []
}

export async function deleteFile(path: string) {
  if (!path) {
    throw new Error('deleteFile requires a storage path.')
  }

  const supabase = getSupabaseBrowser()
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path])
  if (error) throw error
}

/**
 * Rename a Media Library item's display name only.
 *
 * Intentionally does NOT move/rename the Storage object key. CMS pages store
 * those paths (hero media_path, section image_path, logos, etc.), and moving
 * the object would break the public site until every reference was rewritten.
 * The library UI shows `metadata.originalFilename` when present.
 *
 * `newPath` is accepted for API compatibility with the shared MediaGrid but
 * is ignored — the storage key stays `path`.
 */
export async function renameFile(
  path: string,
  _newPath: string,
  options: { originalFilename?: string } = {}
) {
  if (!path) {
    throw new Error('renameFile requires a storage path.')
  }

  const { originalFilename } = options
  if (!originalFilename || !String(originalFilename).trim()) {
    throw new Error('renameFile requires a new display filename.')
  }

  const supabase = getSupabaseBrowser()
  const nextName = String(originalFilename).trim()

  const { data, error: downloadError } = await supabase.storage.from(MEDIA_BUCKET).download(path)
  if (downloadError) throw downloadError

  const contentType =
    data && typeof data.type === 'string' && data.type.trim() ? data.type : undefined

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, data, {
    upsert: true,
    cacheControl: MEDIA_CACHE_CONTROL,
    ...(contentType ? { contentType } : {}),
    metadata: { originalFilename: nextName },
  })

  if (uploadError) throw uploadError
}

export function getPublicUrl(path: string) {
  if (!path) {
    throw new Error('getPublicUrl requires a storage path.')
  }

  const supabase = getSupabaseBrowser()
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** API object for shared MediaGrid / MediaUploader on Next. */
export const nextMediaApi = {
  listFiles,
  uploadFile,
  deleteFile,
  renameFile,
  getPublicUrl,
  buildRenamedStoragePath,
  getPathExtension,
}

export { buildRenamedStoragePath, getPathExtension }
