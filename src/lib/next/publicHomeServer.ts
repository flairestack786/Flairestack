import { cache } from 'react'
import {
  buildNextSerializableHomePage,
  FALLBACK_NEXT_HOME,
} from '@/lib/next/buildNextPublicHomePage'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import { normalizeServiceSlug } from '@/lib/serviceSlug'
import {
  getHomeTestimonialsShared,
  type PublicTestimonial,
} from '@/lib/next/publicTestimonialsServer'
import { buildVisualsForService } from '@/data/serviceVisuals'
import {
  resolveServiceCardDescription,
  resolveServiceShowcaseCopy,
} from '@/data/serviceCardCopy'
import { resolveLegacyAssetKey } from '@/lib/serviceCatalogAssets'
import { resolvePublicAssetUrl } from '@/lib/next/publicMediaUrl'
import { readShowcaseItemsFromConfig } from '@/lib/homeServicesShowcase'

const HOME_SLUG = 'home'
const PUBLIC_SEO_SELECT =
  'meta_title, meta_description, page_description, canonical_url, robots, og_title, og_description, og_type, og_image_id, twitter_card, twitter_title, twitter_description, twitter_image_id, structured_data, focus_keyword, related_keywords, extensions'

export type SerializableHomePage = ReturnType<typeof buildNextSerializableHomePage>

export type HomeServiceCard = {
  id: string
  slug: string
  title: string
  shortDescription: string
  imageUrl: string | null
  imageAlt: string
  accent: string
  ctaLabel: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
  highlights: string[]
}

/** Home testimonial shape used by HomePageView (subset of shared PublicTestimonial). */
export type HomeTestimonial = Pick<
  PublicTestimonial,
  'id' | 'quote' | 'author' | 'role' | 'initials' | 'photoUrl'
>

export const getPublicHomePage = cache(async (): Promise<SerializableHomePage> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', HOME_SLUG)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw error
    if (!page) return FALLBACK_NEXT_HOME

    const [sectionsResult, seoResult, slidesResult] = await Promise.all([
      supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', page.id)
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('seo_metadata')
        .select(PUBLIC_SEO_SELECT)
        .eq('page_id', page.id)
        .maybeSingle(),
      supabase
        .from('home_hero_slides')
        .select('*')
        .eq('is_enabled', true)
        .order('sort_order', { ascending: true }),
    ])

    if (sectionsResult.error) throw sectionsResult.error
    if (seoResult.error) throw seoResult.error
    // Slides table may not exist until migration is applied — fall back to legacy hero.
    const heroSlideRows = slidesResult.error
      ? null
      : ((slidesResult.data ?? []) as Record<string, unknown>[])

    return buildNextSerializableHomePage(
      page as Record<string, unknown>,
      (sectionsResult.data ?? []) as Record<string, unknown>[],
      (seoResult.data as Record<string, unknown> | null) ?? null,
      heroSlideRows
    )
  } catch {
    return FALLBACK_NEXT_HOME
  }
})

function cardFromCatalogRow(row: Record<string, unknown>): HomeServiceCard | null {
  const slug = normalizeServiceSlug(row.slug)
  if (!slug) return null
  const title = String(row.title ?? '').trim() || 'Service'
  const assetKey =
    resolveLegacyAssetKey({
      legacy_asset_key: row.legacy_asset_key,
      slug,
      title,
    }) ?? slug
  const visuals = assetKey ? buildVisualsForService(assetKey, title) : null
  const showcase = resolveServiceShowcaseCopy(slug, title)
  return {
    id: String(row.id ?? slug),
    slug,
    title,
    shortDescription: resolveServiceCardDescription(
      slug,
      String(row.short_description ?? ''),
      title
    ),
    imageUrl: visuals?.hero?.src ?? null,
    imageAlt: visuals?.hero?.alt ?? title,
    accent: showcase.accent,
    ctaLabel: showcase.ctaLabel,
    secondaryCtaLabel: 'Talk to us',
    secondaryCtaUrl: '/#contact',
    highlights: showcase.highlights,
  }
}

async function listPublishedCatalogCards(): Promise<HomeServiceCard[]> {
  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, title, short_description, sort_order, legacy_asset_key')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? [])
    .map((row) => cardFromCatalogRow(row as Record<string, unknown>))
    .filter((row): row is HomeServiceCard => Boolean(row))
}

/**
 * Homepage services rows — CMS `page_sections.services.config.showcase_items`
 * when present; otherwise all published catalog services.
 */
export const getHomeServiceCards = cache(async (): Promise<HomeServiceCard[]> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', HOME_SLUG)
      .eq('status', 'published')
      .maybeSingle()

    if (pageError) throw pageError

    let showcaseConfig: unknown = null
    if (page?.id) {
      const { data: section, error: sectionError } = await supabase
        .from('page_sections')
        .select('config')
        .eq('page_id', page.id)
        .eq('section_key', 'services')
        .maybeSingle()

      if (sectionError) throw sectionError
      showcaseConfig = section?.config ?? null
    }

    const cmsItems = readShowcaseItemsFromConfig(showcaseConfig)
    if (cmsItems) {
      const catalog = await listPublishedCatalogCards()
      const catalogBySlug = new Map(catalog.map((item) => [item.slug, item]))

      return cmsItems
        .filter((item) => item.enabled)
        .map((item, index) => {
          const linked = item.service_slug ? catalogBySlug.get(item.service_slug) : null
          const title = item.title || linked?.title || 'Service'
          const slug = item.service_slug || linked?.slug || ''
          const customImage = resolvePublicAssetUrl(item.image_path)
          const catalogImage =
            linked?.imageUrl ??
            (item.service_slug
              ? buildVisualsForService(item.service_slug, title)?.hero?.src ?? null
              : null)

          return {
            id: item.id || `cms-${index + 1}`,
            slug,
            title,
            shortDescription:
              item.description ||
              linked?.shortDescription ||
              resolveServiceCardDescription(slug, '', title),
            imageUrl: customImage || catalogImage,
            imageAlt: item.image_alt || linked?.imageAlt || title,
            accent: item.accent,
            ctaLabel: item.cta_label,
            secondaryCtaLabel: item.secondary_cta_label,
            secondaryCtaUrl: item.secondary_cta_url,
            highlights: item.highlights,
          } satisfies HomeServiceCard
        })
        .filter((item) => Boolean(item.title))
    }

    return listPublishedCatalogCards()
  } catch {
    return []
  }
})

export const getHomeTestimonials = cache(async (): Promise<HomeTestimonial[]> => {
  const rows = await getHomeTestimonialsShared()
  return rows.map(({ id, quote, author, role, initials, photoUrl }) => ({
    id,
    quote,
    author,
    role,
    initials,
    photoUrl,
  }))
})
