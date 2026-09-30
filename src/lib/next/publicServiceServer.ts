import { cache } from 'react'
import {
  resolvePublicServicePage,
} from '@/lib/buildPublicServicePageCore'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import { buildPublishedServiceLookup, buildPublishedServicesList } from '@/lib/serviceUrlFlow'
import { normalizeServiceSlug } from '@/lib/serviceSlug'
import { companyStats as FALLBACK_COMPANY_STATS } from '@/data/companyStats'
import {
  getServiceTestimonialsShared,
  type PublicTestimonial,
} from '@/lib/next/publicTestimonialsServer'

const PUBLIC_SEO_SELECT =
  'meta_title, meta_description, page_description, canonical_url, robots, og_title, og_description, og_type, og_image_id, twitter_card, twitter_title, twitter_description, twitter_image_id, structured_data, focus_keyword, related_keywords, extensions'

const HOME_SLUG = 'home'

function resolvePublicUrl(path: string): string {
  const url = getPublicMediaUrl(path)
  if (!url) {
    throw new Error('resolvePublicUrl requires a storage path.')
  }
  return url
}

export type PublicServiceListItem = {
  id: string
  slug: string
  title: string
  shortDescription: string
  description: string
  icon: string
  sortOrder: number
}

export type ServiceTestimonialItem = PublicTestimonial

export type CompanyStatItem = {
  value: number
  suffix: string
  label: string
}

/**
 * Published services for the public `/services` listing — same filters/order as Vite.
 */
export const getPublishedServicesList = cache(async (): Promise<PublicServiceListItem[]> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data, error } = await supabase
      .from('services')
      .select('id, slug, title, short_description, description, icon_name, sort_order, status')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    if (error) throw error

    const mapped = (data ?? []).map((row) => ({
      id: String(row.id ?? ''),
      slug: normalizeServiceSlug(row.slug),
      title: String(row.title ?? '').trim(),
      shortDescription: String(row.short_description ?? '').trim(),
      description: String(row.description ?? '').trim(),
      icon: String(row.icon_name ?? 'Layers').trim() || 'Layers',
      sortOrder: Number(row.sort_order ?? 0),
    }))

    return buildPublishedServicesList(mapped) as PublicServiceListItem[]
  } catch {
    return []
  }
})

async function fetchPublishedServiceRaw(slug: string) {
  const lookup = buildPublishedServiceLookup(slug)
  if (!lookup.filters.slug) {
    return null
  }

  const supabase = getSupabasePublicServer()
  const { data: serviceRow, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', lookup.filters.slug)
    .eq('status', lookup.filters.status)
    .maybeSingle()

  if (error) throw error
  if (!serviceRow) return null

  const service = serviceRow as unknown as Record<string, unknown>
  const serviceId = String(service.id ?? '')

  const [sectionsResult, mediaResult, seoResult] = await Promise.all([
    supabase.from('service_sections').select('*').eq('service_id', serviceId),
    supabase
      .from('service_media')
      .select('slot, alt_override, media_assets(storage_path, public_url, alt_text)')
      .eq('service_id', serviceId),
    supabase
      .from('seo_metadata')
      .select(PUBLIC_SEO_SELECT)
      .eq('entity_type', 'service')
      .eq('service_id', serviceId)
      .maybeSingle(),
  ])

  if (sectionsResult.error) throw sectionsResult.error
  if (mediaResult.error) throw mediaResult.error
  if (seoResult.error) throw seoResult.error

  return {
    service,
    sections: (sectionsResult.data ?? []) as Record<string, unknown>[],
    media: (mediaResult.data ?? []) as Record<string, unknown>[],
    seo: (seoResult.data as Record<string, unknown> | null) ?? null,
  }
}

/**
 * Published service detail by slug. Returns null for missing/unpublished.
 */
export const getPublicServicePage = cache(async (slug: string) => {
  const normalized = normalizeServiceSlug(slug)
  if (!normalized) return null

  try {
    const raw = await fetchPublishedServiceRaw(normalized)
    if (!raw) return null
    return resolvePublicServicePage(raw, normalized, resolvePublicUrl)
  } catch {
    return null
  }
})

/**
 * Published testimonials shaped for the service page slider.
 */
export const getServicePageTestimonials = cache(async (): Promise<ServiceTestimonialItem[]> => {
  return getServiceTestimonialsShared()
})

/**
 * Home CMS stats for service page metrics band (same source as Vite CompanyStats).
 */
export const getServicePageCompanyStats = cache(async (): Promise<CompanyStatItem[]> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data: page, error } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', HOME_SLUG)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw error
    if (!page) return FALLBACK_COMPANY_STATS as CompanyStatItem[]

    const { data: section, error: sectionError } = await supabase
      .from('page_sections')
      .select('config')
      .eq('page_id', page.id)
      .eq('section_key', 'stats')
      .maybeSingle()

    if (sectionError) throw sectionError

    const config =
      section?.config && typeof section.config === 'object'
        ? (section.config as { stats?: CompanyStatItem[] })
        : null
    const stats = config?.stats

    if (Array.isArray(stats) && stats.length > 0) {
      return stats.map((stat) => ({
        value: Number(stat.value) || 0,
        suffix: String(stat.suffix ?? ''),
        label: String(stat.label ?? ''),
      }))
    }

    return FALLBACK_COMPANY_STATS as CompanyStatItem[]
  } catch {
    return FALLBACK_COMPANY_STATS as CompanyStatItem[]
  }
})
