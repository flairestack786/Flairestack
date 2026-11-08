import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import {
  buildPublicSitemapEntries,
  INDEXABLE_CMS_PAGE_PATHS,
  normalizeSitemapPath,
  SITEMAP_SITE_ORIGIN,
} from '@/lib/publicSitemap'
import { canonicalizeServiceSlug } from '@/lib/serviceSlug'

type CmsPageRow = {
  id: string
  slug: string
  route_path: string
  updated_at: string | null
  published_at: string | null
}

type ServiceRow = {
  id: string
  slug: string
  updated_at: string | null
  published_at: string | null
}

type SeoRow = {
  page_id: string | null
  service_id: string | null
  robots: string | null
  entity_type: string | null
}

function throwQueryError(label: string, error: { message?: string } | null): never {
  const detail = error?.message ? `: ${error.message}` : ''
  throw new Error(`Sitemap ${label} query failed${detail}`)
}

/**
 * Load published CMS pages + services for the public sitemap.
 * Throws on Supabase errors so Next does not emit a misleading incomplete sitemap.
 */
export async function fetchPublicSitemapSource() {
  const supabase = getSupabasePublicServer()

  const [pagesResult, servicesResult, seoResult] = await Promise.all([
    supabase
      .from('pages')
      .select('id, slug, route_path, updated_at, published_at')
      .eq('status', 'published'),
    supabase
      .from('services')
      .select('id, slug, updated_at, published_at')
      .eq('status', 'published')
      .order('sort_order', { ascending: true }),
    supabase.from('seo_metadata').select('page_id, service_id, robots, entity_type'),
  ])

  if (pagesResult.error) throwQueryError('pages', pagesResult.error)
  if (servicesResult.error) throwQueryError('services', servicesResult.error)
  if (seoResult.error) throwQueryError('seo_metadata', seoResult.error)

  const pages = (pagesResult.data ?? []) as CmsPageRow[]
  const services = (servicesResult.data ?? []) as ServiceRow[]
  const seoRows = (seoResult.data ?? []) as SeoRow[]

  const robotsByPageId = new Map<string, string>()
  const robotsByServiceId = new Map<string, string>()

  for (const row of seoRows) {
    const robots = typeof row.robots === 'string' ? row.robots : ''
    if (row.page_id) robotsByPageId.set(String(row.page_id), robots)
    if (row.service_id) robotsByServiceId.set(String(row.service_id), robots)
  }

  const cmsPages = pages
    .map((page) => {
      const path = normalizeSitemapPath(page.route_path)
      if (!path || !INDEXABLE_CMS_PAGE_PATHS.has(path)) return null
      return {
        route_path: path,
        updated_at: page.updated_at,
        published_at: page.published_at,
        robots: robotsByPageId.get(String(page.id)) ?? 'index,follow',
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const serviceEntries = services
    .map((service) => {
      const slug = canonicalizeServiceSlug(service.slug)
      if (!slug) return null
      return {
        slug,
        updated_at: service.updated_at,
        published_at: service.published_at,
        robots: robotsByServiceId.get(String(service.id)) ?? 'index,follow',
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  return {
    cmsPages,
    services: serviceEntries,
  }
}

/**
 * Build the full public sitemap entry list for `/sitemap.xml`.
 * Always uses the non-www production origin required for crawler canonicals.
 */
export async function getPublicSitemapEntries() {
  const source = await fetchPublicSitemapSource()
  return buildPublicSitemapEntries({
    origin: SITEMAP_SITE_ORIGIN,
    cmsPages: source.cmsPages,
    services: source.services,
  })
}
