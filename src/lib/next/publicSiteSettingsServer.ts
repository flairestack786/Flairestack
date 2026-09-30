import { cache } from 'react'
import {
  buildNextPublicSiteSettings,
  FALLBACK_NEXT_PUBLIC_SETTINGS,
  type PublicSiteSettings,
} from '@/lib/next/buildPublicSiteSettings'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import { normalizeServiceSlug } from '@/lib/serviceSlug'

export type PublicNavService = {
  id: string
  slug: string
  title: string
}

/**
 * Fetch singleton `site_settings` (oldest row). Safe fallbacks on failure.
 * Deduped per request via React `cache`.
 */
export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return buildNextPublicSiteSettings(data as Record<string, unknown> | null)
  } catch {
    return FALLBACK_NEXT_PUBLIC_SETTINGS
  }
})

/**
 * Published services for public nav/footer. Empty array on failure (no static catalog inject).
 */
export const getPublishedNavServices = cache(async (): Promise<PublicNavService[]> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data, error } = await supabase
      .from('services')
      .select('id, slug, title, sort_order')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return (data ?? [])
      .map((row) => ({
        id: String(row.id ?? ''),
        slug: normalizeServiceSlug(row.slug),
        title: String(row.title ?? '').trim() || 'Service',
      }))
      .filter((row) => Boolean(row.slug))
  } catch {
    return []
  }
})
