import type { MetadataRoute } from 'next'
import { getPublicSitemapEntries } from '@/lib/next/publicSitemapServer'

/** Match public page ISR so CMS publish/updates refresh sitemap without manual edits. */
export const revalidate = 60

/**
 * Dynamic XML sitemap at `/sitemap.xml`.
 * Throws when Supabase reads fail so crawlers do not receive a silently incomplete map.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getPublicSitemapEntries()
}
