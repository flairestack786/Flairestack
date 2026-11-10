import { cache } from 'react'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import { getSupabasePublicServer } from '@/lib/next/supabasePublicServer'
import { sanitizeCmsHtml } from '@/lib/sanitizeCmsHtml'
import { canonicalizeContentSlug } from '@/lib/contentSlug'

export type PublicBlogCard = {
  id: string
  title: string
  slug: string
  excerpt: string
  authorName: string
  category: string
  tags: string[]
  readingTimeMinutes: number
  publishedAt: string | null
  isFeatured: boolean
  featuredImageUrl: string | null
  featuredImageAlt: string
}

export type PublicBlogArticle = PublicBlogCard & {
  bodyHtml: string
  seoTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  canonicalUrl: string | null
  updatedAt: string | null
}

function mapCard(row: Record<string, unknown>): PublicBlogCard {
  const title = String(row.title ?? '')
  const path = typeof row.featured_image_path === 'string' ? row.featured_image_path : ''
  return {
    id: String(row.id),
    title,
    slug: String(row.slug ?? ''),
    excerpt: String(row.excerpt ?? ''),
    authorName: String(row.author_name ?? ''),
    category: String(row.category ?? ''),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    readingTimeMinutes: Number(row.reading_time_minutes) || 1,
    publishedAt: row.published_at ? String(row.published_at) : null,
    isFeatured: Boolean(row.is_featured),
    featuredImageUrl: path ? getPublicMediaUrl(path) : null,
    featuredImageAlt: title ? `${title} featured image` : 'Blog featured image',
  }
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  if (error.code === 'PGRST205' || error.code === '42P01') return true
  return /could not find the table|relation .* does not exist/i.test(String(error.message ?? ''))
}

export const listPublishedBlogPosts = cache(async function listPublishedBlogPosts(): Promise<
  PublicBlogCard[]
> {
  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, author_name, category, tags, reading_time_minutes, published_at, is_featured, featured_image_path'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }
  return (data ?? []).map((row) => mapCard(row as Record<string, unknown>))
})

export const getPublishedBlogPostBySlug = cache(async function getPublishedBlogPostBySlug(
  slugInput: string
): Promise<PublicBlogArticle | null> {
  const slug = canonicalizeContentSlug(slugInput)
  if (!slug) return null

  const supabase = getSupabasePublicServer()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }
  if (!data) return null

  const card = mapCard(data as Record<string, unknown>)
  const ogPath = typeof data.og_image_path === 'string' ? data.og_image_path : ''
  return {
    ...card,
    bodyHtml: sanitizeCmsHtml(String(data.body_html ?? '')),
    seoTitle: data.seo_title ? String(data.seo_title) : null,
    metaDescription: data.meta_description ? String(data.meta_description) : null,
    ogImageUrl: ogPath ? getPublicMediaUrl(ogPath) : card.featuredImageUrl,
    canonicalUrl: data.canonical_url ? String(data.canonical_url) : null,
    updatedAt: data.updated_at ? String(data.updated_at) : null,
  }
})

export async function getRelatedBlogPosts(
  article: PublicBlogArticle,
  limit = 3
): Promise<PublicBlogCard[]> {
  const all = await listPublishedBlogPosts()
  const sameCategory = all.filter(
    (post) => post.id !== article.id && post.category && post.category === article.category
  )
  const others = all.filter((post) => post.id !== article.id && !sameCategory.includes(post))
  return [...sameCategory, ...others].slice(0, limit)
}
