'use client'

import { estimateReadingTimeMinutes } from '@/lib/blogReadingTime'
import { assertValidContentSlug, canonicalizeContentSlug } from '@/lib/contentSlug'
import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

const WRITABLE_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'body_html',
  'featured_image_path',
  'author_name',
  'category',
  'tags',
  'seo_title',
  'meta_description',
  'og_image_path',
  'canonical_url',
  'is_featured',
  'reading_time_minutes',
  'published_at',
] as const

function sanitizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item ?? '').trim()).filter(Boolean))]
  }
  if (typeof value === 'string') {
    return [
      ...new Set(
        value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      ),
    ]
  }
  return []
}

function sanitizePayload(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    WRITABLE_FIELDS.filter((key) => fields[key] !== undefined).map((key) => {
      const value = fields[key]
      if (key === 'slug') {
        return [key, assertValidContentSlug(value)]
      }
      if (key === 'tags') {
        return [key, sanitizeTags(value)]
      }
      if (key === 'is_featured') {
        return [key, Boolean(value)]
      }
      if (key === 'reading_time_minutes') {
        const minutes = Number(value)
        return [key, Number.isFinite(minutes) ? Math.min(120, Math.max(1, Math.round(minutes))) : 1]
      }
      if (key === 'published_at') {
        return [key, value || null]
      }
      if (
        typeof value === 'string' &&
        (key === 'featured_image_path' ||
          key === 'og_image_path' ||
          key === 'seo_title' ||
          key === 'meta_description' ||
          key === 'canonical_url')
      ) {
        return [key, value.trim() === '' ? null : value.trim()]
      }
      if (typeof value === 'string') {
        return [key, value.trim()]
      }
      return [key, value]
    })
  )
}

function uniqueSlugCandidate(base: string, suffix = 0) {
  const root = canonicalizeContentSlug(base) || 'post'
  return suffix > 0 ? `${root}-${suffix}` : root
}

export async function listBlogPosts(): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, author_name, category, status, is_featured, published_at, updated_at, reading_time_minutes, featured_image_path'
    )
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getBlogPost(id: string): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createBlogPost(
  input: Partial<Record<string, unknown>> = {}
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const title = String(input.title ?? 'Untitled article').trim() || 'Untitled article'
  let slug = canonicalizeContentSlug(input.slug ?? title) || 'untitled-article'

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = uniqueSlugCandidate(slug, attempt)
    const payload = {
      ...sanitizePayload({
        title,
        slug: candidate,
        excerpt: input.excerpt ?? '',
        body_html: input.body_html ?? '',
        featured_image_path: input.featured_image_path ?? null,
        author_name: input.author_name ?? '',
        category: input.category ?? '',
        tags: input.tags ?? [],
        seo_title: input.seo_title ?? null,
        meta_description: input.meta_description ?? null,
        og_image_path: input.og_image_path ?? null,
        canonical_url: input.canonical_url ?? null,
        is_featured: Boolean(input.is_featured),
        reading_time_minutes: estimateReadingTimeMinutes(String(input.body_html ?? '')),
      }),
      status: 'draft',
      published_at: null,
    }

    const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
    if (!error) return data
    if (!String(error.message ?? '').toLowerCase().includes('duplicate')) throw error
    slug = candidate
  }

  throw new Error('Could not allocate a unique blog slug. Try a different title.')
}

export async function updateBlogPost(
  id: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const payload = sanitizePayload(fields)
  delete payload.status
  delete payload.published_at

  if (typeof payload.body_html === 'string') {
    payload.reading_time_minutes = estimateReadingTimeMinutes(payload.body_html)
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Blog post not found or you do not have permission to update it.')
  return data
}

export async function setBlogPostStatus(
  id: string,
  status: 'draft' | 'published'
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const payload =
    status === 'published'
      ? { status, published_at: new Date().toISOString() }
      : { status: 'draft', published_at: null }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Blog post not found or you do not have permission to update it.')
  return data
}

export async function deleteBlogPost(id: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}
