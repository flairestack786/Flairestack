import { MEDIA_BUCKET } from '@/lib/mediaFormat'

/**
 * Resolve a public URL for a file in the `site-media` bucket.
 * Uses only NEXT_PUBLIC / public Supabase URL — no service role.
 */
export function getPublicMediaUrl(path: string | null | undefined): string | null {
  const trimmed = String(path ?? '').trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  if (!base) return null

  const normalized = trimmed.replace(/^\/+/, '')
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/${normalized}`
}
