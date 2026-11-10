'use client'

import { estimateReadingTimeMinutes } from '@/lib/blogReadingTime'
import { assertValidContentSlug, canonicalizeContentSlug, publicBlogPath } from '@/lib/contentSlug'
import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

async function revalidatePublicBlogPaths(slug?: string | null) {
  try {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return

    const paths = ['/blog', '/sitemap.xml']
    const articlePath = publicBlogPath(slug)
    if (articlePath) paths.push(articlePath)

    await fetch('/api/cms/revalidate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths }),
    })
  } catch {
    // Non-fatal: ISR fallback still refreshes within revalidate window.
  }
}

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

  // #region agent log
  fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'A',location:'blogsBrowser.ts:setBlogPostStatus:entry',message:'CMS publish/unpublish requested',data:{id,requestedStatus:status,payload},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const { data, error } = await supabase
    .from('blog_posts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  // #region agent log
  fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'A',location:'blogsBrowser.ts:setBlogPostStatus:result',message:'CMS publish/unpublish result',data:{id,requestedStatus:status,ok:!error&&!!data,errorCode:error?.code??null,errorMessage:error?.message??null,returnedStatus:data?String((data as{status?:unknown}).status??''):null,returnedPublishedAt:data?(data as{published_at?:unknown}).published_at??null:null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error) throw error
  if (!data) throw new Error('Blog post not found or you do not have permission to update it.')

  await revalidatePublicBlogPaths(String((data as { slug?: unknown }).slug ?? ''))
  return data
}

export async function deleteBlogPost(id: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}
