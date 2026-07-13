import { getPublicUrl } from './media'
import { supabase } from './supabase'

const BUCKET = 'site-media'

const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}

/**
 * @param {string} filename
 * @returns {string}
 */
function guessMimeType(filename) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return 'application/octet-stream'
  const extension = filename.slice(lastDot).toLowerCase()
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

/**
 * Resolve or create a media_assets row for a storage path (service_media FK).
 * @param {string} path
 * @param {{ alt_text?: string }} [options]
 * @returns {Promise<{ id: string, storage_path: string, public_url: string | null }>}
 */
export async function ensureMediaAssetForPath(path, options = {}) {
  const normalized = path?.trim()
  if (!normalized) {
    throw new Error('ensureMediaAssetForPath requires a storage path.')
  }

  const { data: existing, error: lookupError } = await supabase
    .from('media_assets')
    .select('id, storage_path, public_url')
    .eq('storage_bucket', BUCKET)
    .eq('storage_path', normalized)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (existing) {
    return existing
  }

  const filename = normalized.split('/').pop() ?? normalized
  const publicUrl = getPublicUrl(normalized)

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      storage_bucket: BUCKET,
      storage_path: normalized,
      public_url: publicUrl,
      filename,
      mime_type: guessMimeType(filename),
      category: 'service',
      alt_text: options.alt_text ?? '',
    })
    .select('id, storage_path, public_url')
    .single()

  if (error) {
    throw error
  }

  return data
}
