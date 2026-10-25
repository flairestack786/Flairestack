'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import { MEDIA_BUCKET, slugifyFilename } from '@/lib/mediaFormat'
import {
  normalizeMediaType,
  sanitizeCtaUrl,
  textOrEmpty,
} from '@/lib/heroSlides'
import {
  formatHeroUploadError,
  validateHeroMediaFile,
} from '@/lib/heroMediaUpload'

export type HeroSlideRow = {
  id: string
  admin_label: string
  media_type: 'image' | 'video'
  media_path: string | null
  poster_path: string | null
  media_alt: string | null
  eyebrow: string | null
  title: string
  title_accent: string | null
  intro: string | null
  body: string | null
  cta_primary_label: string | null
  cta_primary_url: string | null
  cta_secondary_label: string | null
  cta_secondary_url: string | null
  sort_order: number
  is_enabled: boolean
  created_at?: string
  updated_at?: string
}

const WRITABLE_FIELDS = [
  'admin_label',
  'media_type',
  'media_path',
  'poster_path',
  'media_alt',
  'eyebrow',
  'title',
  'title_accent',
  'intro',
  'body',
  'cta_primary_label',
  'cta_primary_url',
  'cta_secondary_label',
  'cta_secondary_url',
  'sort_order',
  'is_enabled',
] as const

const NULLABLE = new Set([
  'media_path',
  'poster_path',
  'media_alt',
  'eyebrow',
  'title_accent',
  'intro',
  'body',
  'cta_primary_label',
  'cta_primary_url',
  'cta_secondary_label',
  'cta_secondary_url',
])

function emptyToNull(value: unknown): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed || null
}

export function sanitizeHeroSlidePayload(
  input: Record<string, unknown>,
  options: { partial?: boolean } = {}
): Record<string, unknown> {
  const partial = Boolean(options.partial)
  const keys = partial
    ? WRITABLE_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(input, key))
    : [...WRITABLE_FIELDS]

  if (!partial || Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = textOrEmpty(input.title)
    const enabled =
      Object.prototype.hasOwnProperty.call(input, 'is_enabled')
        ? input.is_enabled !== false
        : true
    if (!title && enabled && !partial) {
      throw new Error('Slide title is required for enabled slides.')
    }
  }

  const payload: Record<string, unknown> = {}

  for (const key of keys) {
    const value = input[key]
    switch (key) {
      case 'admin_label':
        payload[key] = textOrEmpty(value, 'Untitled slide')
        break
      case 'media_type':
        payload[key] = normalizeMediaType(value)
        break
      case 'title':
        payload[key] = textOrEmpty(value, 'Untitled slide')
        break
      case 'cta_primary_url':
        payload[key] = value == null || value === '' ? null : sanitizeCtaUrl(value, '#contact')
        break
      case 'cta_secondary_url':
        payload[key] = value == null || value === '' ? null : sanitizeCtaUrl(value, '')
        break
      case 'sort_order':
        payload[key] = Math.max(0, Number(value) || 0)
        break
      case 'is_enabled':
        payload[key] = value !== false
        break
      default:
        payload[key] = NULLABLE.has(key) ? emptyToNull(value) : value
    }
  }

  return payload
}

export async function listHeroSlides(): Promise<HeroSlideRow[]> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('home_hero_slides')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as HeroSlideRow[]
}

export async function createHeroSlide(
  input: Record<string, unknown> = {}
): Promise<HeroSlideRow> {
  const supabase = getSupabaseBrowser()
  const existing = await listHeroSlides()
  const nextOrder =
    existing.reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), -1) + 1

  const payload = sanitizeHeroSlidePayload({
    admin_label: 'New slide',
    media_type: 'image',
    title: 'New headline',
    title_accent: '',
    intro: '',
    body: '',
    cta_primary_label: 'Learn more',
    cta_primary_url: '#contact',
    sort_order: nextOrder,
    is_enabled: true,
    ...input,
  })

  const { data, error } = await supabase
    .from('home_hero_slides')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as HeroSlideRow
}

export async function updateHeroSlide(
  id: string,
  input: Record<string, unknown>
): Promise<HeroSlideRow> {
  if (!id) throw new Error('updateHeroSlide requires an id.')
  const supabase = getSupabaseBrowser()
  const payload = sanitizeHeroSlidePayload(input, { partial: true })

  if (Object.keys(payload).length === 0) {
    throw new Error('updateHeroSlide requires at least one field.')
  }

  const { data, error } = await supabase
    .from('home_hero_slides')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as HeroSlideRow
}

export async function deleteHeroSlide(id: string): Promise<void> {
  if (!id) throw new Error('deleteHeroSlide requires an id.')
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('home_hero_slides').delete().eq('id', id)
  if (error) throw error
}

export async function reorderHeroSlides(orderedIds: string[]): Promise<HeroSlideRow[]> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new Error('reorderHeroSlides requires ordered ids.')
  }

  const supabase = getSupabaseBrowser()
  const updates = await Promise.all(
    orderedIds.map(async (id, index) => {
      const { data, error } = await supabase
        .from('home_hero_slides')
        .update({ sort_order: index })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as HeroSlideRow
    })
  )

  return updates.sort((a, b) => a.sort_order - b.sort_order)
}

/**
 * Upload image or video for hero slides into `site-media`.
 * Sets Storage contentType explicitly so bucket MIME checks match the file.
 */
export async function uploadHeroMedia(
  file: File
): Promise<{ path: string; publicUrl: string; mediaType: 'image' | 'video' }> {
  const validated = validateHeroMediaFile(file)
  if (!validated.ok) {
    throw new Error(validated.error)
  }

  const supabase = getSupabaseBrowser()
  const path = `hero/${slugifyFilename(file.name)}`

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: validated.contentType,
    metadata: {
      originalFilename: file.name,
      heroMedia: 'true',
      mediaKind: validated.kind,
    },
  })

  if (error) {
    throw new Error(formatHeroUploadError(error))
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl, mediaType: validated.kind }
}
