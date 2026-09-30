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

const HOME_SLUG = 'home'
const PUBLIC_SEO_SELECT =
  'meta_title, meta_description, page_description, canonical_url, robots, og_title, og_description, og_type, og_image_id, twitter_card, twitter_title, twitter_description, twitter_image_id, structured_data, focus_keyword, related_keywords, extensions'

export type SerializableHomePage = ReturnType<typeof buildNextSerializableHomePage>

export type HomeServiceCard = {
  id: string
  slug: string
  title: string
  shortDescription: string
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

    const [sectionsResult, seoResult] = await Promise.all([
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
    ])

    if (sectionsResult.error) throw sectionsResult.error
    if (seoResult.error) throw seoResult.error

    return buildNextSerializableHomePage(
      page as Record<string, unknown>,
      (sectionsResult.data ?? []) as Record<string, unknown>[],
      (seoResult.data as Record<string, unknown> | null) ?? null
    )
  } catch {
    return FALLBACK_NEXT_HOME
  }
})

export const getHomeServiceCards = cache(async (): Promise<HomeServiceCard[]> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data, error } = await supabase
      .from('services')
      .select('id, slug, title, short_description, sort_order')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return (data ?? [])
      .map((row) => ({
        id: String(row.id ?? ''),
        slug: normalizeServiceSlug(row.slug),
        title: String(row.title ?? '').trim() || 'Service',
        shortDescription: String(row.short_description ?? '').trim(),
      }))
      .filter((row) => Boolean(row.slug))
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
