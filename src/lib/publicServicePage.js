import { getPublicUrl } from './media'
import { buildPublishedServiceLookup } from './serviceUrlFlow'
import { supabase } from './supabase'
import { PUBLIC_SEO_SELECT } from './publicSeo'
import {
  buildFallbackPublicService as buildFallbackCore,
  buildPublicServicePage as buildCore,
  resolvePublicServicePage as resolveCore,
} from './buildPublicServicePageCore'

export { buildPublishedServiceLookup } from './serviceUrlFlow'

/**
 * @param {string} slug
 */
export function buildFallbackPublicService(slug) {
  return buildFallbackCore(slug, getPublicUrl)
}

/**
 * @param {{ service?: Record<string, unknown> | null, sections?: Record<string, unknown>[], media?: Record<string, unknown>[], seo?: Record<string, unknown> | null } | null} raw
 * @param {string} urlSlug
 */
export function resolvePublicServicePage(raw, urlSlug) {
  return resolveCore(raw, urlSlug, getPublicUrl)
}

/**
 * @param {Record<string, unknown> | null} serviceRow
 * @param {Record<string, unknown>[]} sectionRows
 * @param {Record<string, unknown>[]} mediaRows
 * @param {Record<string, unknown> | null} seoRow
 * @param {unknown} fallbackService
 */
export function buildPublicServicePage(serviceRow, sectionRows, mediaRows, seoRow, fallbackService) {
  return buildCore(serviceRow, sectionRows, mediaRows, seoRow, fallbackService, getPublicUrl)
}

/**
 * @param {string} slug
 * @returns {Promise<{ service: Record<string, unknown>, sections: Record<string, unknown>[], media: Record<string, unknown>[], seo: Record<string, unknown> | null } | null>}
 */
export async function fetchPublishedService(slug) {
  const lookup = buildPublishedServiceLookup(slug)
  if (!lookup.filters.slug) {
    return null
  }

  const { data: service, error } = await supabase
    .from(lookup.table)
    .select(lookup.select)
    .eq('slug', lookup.filters.slug)
    .eq('status', lookup.filters.status)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!service) {
    return null
  }

  const [sectionsResult, mediaResult, seoResult] = await Promise.all([
    supabase
      .from('service_sections')
      .select('*')
      .eq('service_id', service.id),
    supabase
      .from('service_media')
      .select('slot, alt_override, media_assets(storage_path, public_url, alt_text)')
      .eq('service_id', service.id),
    supabase
      .from('seo_metadata')
      .select(PUBLIC_SEO_SELECT)
      .eq('entity_type', 'service')
      .eq('service_id', service.id)
      .maybeSingle(),
  ])

  if (sectionsResult.error) {
    throw sectionsResult.error
  }
  if (mediaResult.error) {
    throw mediaResult.error
  }
  if (seoResult.error) {
    throw seoResult.error
  }

  return {
    service,
    sections: sectionsResult.data ?? [],
    media: mediaResult.data ?? [],
    seo: seoResult.data ?? null,
  }
}
