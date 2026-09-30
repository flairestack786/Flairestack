'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import {
  MEDIA_BUCKET,
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
    cacheControl: '3600',
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

export async function renameFile(
  oldPath: string,
  newPath: string,
  options: { originalFilename?: string } = {}
) {
  if (!oldPath || !newPath) {
    throw new Error('renameFile requires both oldPath and newPath.')
  }

  const supabase = getSupabaseBrowser()
  const { error } = await supabase.storage.from(MEDIA_BUCKET).move(oldPath, newPath)
  if (error) throw error

  const { originalFilename } = options
  if (!originalFilename) return

  const { data, error: downloadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .download(newPath)
  if (downloadError) throw downloadError

  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(newPath, data, {
    upsert: true,
    cacheControl: '3600',
    metadata: { originalFilename },
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
