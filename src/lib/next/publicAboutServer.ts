import { cache } from 'react'
import {
  buildNextSerializableAboutPage,
  FALLBACK_NEXT_ABOUT,
  type SerializableAboutPage,
} from '@/lib/next/buildNextPublicAboutPage'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'

const ABOUT_SLUG = 'about'
const PUBLIC_SEO_SELECT =
  'meta_title, meta_description, page_description, canonical_url, robots, og_title, og_description, og_type, og_image_id, twitter_card, twitter_title, twitter_description, twitter_image_id, structured_data, focus_keyword, related_keywords, extensions'

/**
 * Published About page for public `/about`.
 * Missing/unpublished CMS page → fallback content (Vite parity — not notFound).
 */
export const getPublicAboutPage = cache(async (): Promise<SerializableAboutPage> => {
  try {
    const supabase = getSupabasePublicServer()
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', ABOUT_SLUG)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw error
    if (!page) return FALLBACK_NEXT_ABOUT

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

    return buildNextSerializableAboutPage(
      page as Record<string, unknown>,
      (sectionsResult.data ?? []) as Record<string, unknown>[],
      (seoResult.data as Record<string, unknown> | null) ?? null
    )
  } catch {
    return FALLBACK_NEXT_ABOUT
  }
})

export type { SerializableAboutPage }
