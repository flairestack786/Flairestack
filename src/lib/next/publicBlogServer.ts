import { cache } from 'react'
import { isPubliclyVisibleBlogPost } from '@/lib/blogPublicVisibility'
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
      'id, title, slug, excerpt, author_name, category, tags, reading_time_minutes, published_at, is_featured, featured_image_path, status'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    // #region agent log
    const __dbgErr = {sessionId:'e489f1',runId:'post-fix',hypothesisId:'B',location:'publicBlogServer.ts:listPublishedBlogPosts:error',message:'Public blog list query error',data:{errorCode:error?.code??null,errorMessage:error?.message??null,missingRelation:isMissingRelationError(error)},timestamp:Date.now()}
    fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify(__dbgErr)}).catch(()=>{});
    try { const { appendFileSync } = await import('fs'); appendFileSync('c:\\\\Users\\\\m_sal\\\\FlaireStack\\\\.cursor\\\\debug-e489f1.log', JSON.stringify(__dbgErr) + '\n') } catch {}
    // #endregion
    if (isMissingRelationError(error)) return []
    throw error
  }

  const now = new Date()
  const visible = (data ?? []).filter((row) =>
    isPubliclyVisibleBlogPost(row as Record<string, unknown>, now)
  )

  // #region agent log
  const __dbgOk = {sessionId:'e489f1',runId:'post-fix',hypothesisId:'B',location:'publicBlogServer.ts:listPublishedBlogPosts',message:'Public blog list query result',data:{queriedCount:(data??[]).length,visibleCount:visible.length,errorCode:null,sample:visible.slice(0,3).map((row)=>({id:(row as{id?:unknown}).id,slug:(row as{slug?:unknown}).slug,status:(row as{status?:unknown}).status,published_at:(row as{published_at?:unknown}).published_at}))},timestamp:Date.now()}
  fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify(__dbgOk)}).catch(()=>{});
  try { const { appendFileSync } = await import('fs'); appendFileSync('c:\\\\Users\\\\m_sal\\\\FlaireStack\\\\.cursor\\\\debug-e489f1.log', JSON.stringify(__dbgOk) + '\n') } catch {}
  // #endregion

  return visible.map((row) => mapCard(row as Record<string, unknown>))
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
  if (!isPubliclyVisibleBlogPost(data as Record<string, unknown>)) return null

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
