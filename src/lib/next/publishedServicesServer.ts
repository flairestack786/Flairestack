import { cache } from 'react'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import {
  filterPublicServiceRows,
  PUBLIC_SERVICE_COLUMNS,
  PUBLIC_SERVICE_STATUS,
} from '@/lib/publicServiceVisibility'

export type PublishedServiceRow = {
  id: string
  slug: string
  title: string | null
  short_description: string | null
  description: string | null
  icon_name: string | null
  sort_order: number | null
  status: string
  legacy_asset_key: string | null
}

/**
 * Single source of published services for every public listing (home, /services, nav/footer).
 * Throws on Supabase errors; callers decide their empty-state fallback.
 */
export const getPublishedServiceRows = cache(async (): Promise<PublishedServiceRow[]> => {
  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('services')
    .select(PUBLIC_SERVICE_COLUMNS)
    .eq('status', PUBLIC_SERVICE_STATUS)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return filterPublicServiceRows((data ?? []) as unknown as PublishedServiceRow[])
})
