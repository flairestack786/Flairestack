'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import { getPublicUrl } from '@/lib/next/mediaBrowser'
import { stampLegacyAssetKey } from '@/lib/serviceCatalogAssets'
import {
  buildDefaultSectionsForSlug,
  buildDefaultSeoForSlug,
  SERVICE_SECTION_KEYS,
} from '@/lib/serviceDefaults'
import { assertValidServiceSlug } from '@/lib/serviceSlug'
import { SERVICE_MEDIA_SLOTS } from '@/lib/serviceMediaSlots'
import { MEDIA_BUCKET } from '@/lib/mediaFormat'

export { SERVICE_MEDIA_SLOTS }

const SECTION_WRITABLE_FIELDS = [
  'eyebrow',
  'title',
  'intro',
  'body',
  'cta_label',
  'cta_url',
  'secondary_cta_label',
  'secondary_cta_url',
  'use_global_template',
  'global_template_key',
  'config',
  'is_enabled',
] as const

const NULLABLE_TEXT_FIELDS = new Set([
  'eyebrow',
  'title',
  'intro',
  'body',
  'cta_label',
  'cta_url',
  'secondary_cta_label',
  'secondary_cta_url',
  'global_template_key',
])

const SERVICE_WRITABLE_FIELDS = [
  'slug',
  'title',
  'short_description',
  'description',
  'icon_name',
  'sort_order',
  'status',
  'published_at',
] as const

const SEO_REQUIRED_DEFAULTS = Object.freeze({
  robots: 'index,follow',
  og_type: 'website',
  twitter_card: 'summary_large_image',
  status: 'draft',
})

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}

function guessMimeType(filename: string) {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot <= 0) return 'application/octet-stream'
  const extension = filename.slice(lastDot).toLowerCase()
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

function sanitizeSectionPayload(section: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    SECTION_WRITABLE_FIELDS.filter((key) => section[key] !== undefined).map((key) => {
      if (key === 'is_enabled') {
        return [key, Boolean(section[key])]
      }
      if (NULLABLE_TEXT_FIELDS.has(key)) {
        const value = section[key]
        return [key, value === '' || value == null ? null : value]
      }
      return [key, section[key]]
    })
  )
}

function sanitizeServicePayload(service: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    SERVICE_WRITABLE_FIELDS.filter((key) => service[key] !== undefined).map((key) => {
      const value = service[key]
      if (key === 'published_at') {
        return [key, value || null]
      }
      if (typeof value === 'string' && key !== 'status') {
        return [key, value === '' ? null : value]
      }
      return [key, value]
    })
  )
}

function throwServiceMutationError(error: unknown): never {
  const code =
    error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : ''
  if (code === '23505') {
    throw new Error('That slug is already used by another service.')
  }
  if (code === '23514') {
    throw new Error('Slug must be lowercase letters, numbers, and hyphens (e.g. web-development).')
  }
  throw error
}

/**
 * Resolve or create a media_assets row for a storage path (mirrors Vite mediaAssets.js).
 */
async function ensureMediaAssetForPath(
  path: string,
  options: { alt_text?: string } = {}
): Promise<{ id: string; storage_path: string; public_url: string | null }> {
  const normalized = path?.trim()
  if (!normalized) {
    throw new Error('ensureMediaAssetForPath requires a storage path.')
  }

  const supabase = getSupabaseBrowser()

  const { data: existing, error: lookupError } = await supabase
    .from('media_assets')
    .select('id, storage_path, public_url')
    .eq('storage_bucket', MEDIA_BUCKET)
    .eq('storage_path', normalized)
    .maybeSingle()

  if (lookupError) {
    throw lookupError
  }

  if (existing) {
    return existing
  }

  const filename = normalized.split('/').pop() ?? normalized
  const publicUrl = getPublicUrl(normalized)

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      storage_bucket: MEDIA_BUCKET,
      storage_path: normalized,
      public_url: publicUrl,
      filename,
      mime_type: guessMimeType(filename),
      category: 'service',
      alt_text: options.alt_text ?? '',
    })
    .select('id, storage_path, public_url')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function listServices(): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, title, short_description, status, sort_order, published_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getServiceWithContent(serviceId: string): Promise<{
  service: Record<string, unknown>
  sections: Record<string, unknown>[]
  media: Record<string, unknown>[]
  seo: Record<string, unknown> | null
}> {
  const supabase = getSupabaseBrowser()

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (error) {
    throw error
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('service_sections')
    .select('*')
    .eq('service_id', serviceId)
    .order('section_key', { ascending: true })

  if (sectionsError) {
    throw sectionsError
  }

  const { data: media, error: mediaError } = await supabase
    .from('service_media')
    .select('*, media_assets(id, storage_path, public_url, filename, alt_text)')
    .eq('service_id', serviceId)
    .order('sort_order', { ascending: true })

  if (mediaError) {
    throw mediaError
  }

  const { data: seo, error: seoError } = await supabase
    .from('seo_metadata')
    .select('*')
    .eq('entity_type', 'service')
    .eq('service_id', serviceId)
    .maybeSingle()

  if (seoError) {
    throw seoError
  }

  return {
    service,
    sections: sections ?? [],
    media: media ?? [],
    seo: seo ?? null,
  }
}

export async function createService(input: {
  slug: string
  title: string
  short_description: string
  description: string
  icon_name?: string
  sort_order?: number
}): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const slug = assertValidServiceSlug(input.slug)
  const title = input.title.trim()

  if (!title) {
    throw new Error('Slug and title are required.')
  }

  const legacyAssetKey = stampLegacyAssetKey(null, { slug, title })

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      slug,
      title,
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      icon_name: input.icon_name?.trim() || null,
      sort_order: input.sort_order ?? 0,
      status: 'draft',
      ...(legacyAssetKey ? { legacy_asset_key: legacyAssetKey } : {}),
    })
    .select()
    .single()

  if (error) {
    throwServiceMutationError(error)
  }

  const defaultSections = buildDefaultSectionsForSlug(slug)
  const sectionRows = SERVICE_SECTION_KEYS.map((sectionKey) => ({
    service_id: service.id,
    ...defaultSections[sectionKey],
    section_key: sectionKey,
  }))

  const { error: sectionsError } = await supabase.from('service_sections').insert(sectionRows)

  if (sectionsError) {
    throw sectionsError
  }

  const defaultSeo = buildDefaultSeoForSlug(slug, title)
  const { error: seoError } = await supabase.from('seo_metadata').insert({
    entity_type: 'service',
    service_id: service.id,
    meta_title: defaultSeo.meta_title,
    meta_description: defaultSeo.meta_description,
    og_type: SEO_REQUIRED_DEFAULTS.og_type,
    robots: SEO_REQUIRED_DEFAULTS.robots,
    twitter_card: SEO_REQUIRED_DEFAULTS.twitter_card,
    status: 'draft',
  })

  if (seoError) {
    throw seoError
  }

  return service
}

export function prepareServiceUpdate(serviceId: string, fields: Record<string, unknown>) {
  const payload = sanitizeServicePayload(fields)

  if ('slug' in payload) {
    payload.slug = assertValidServiceSlug(payload.slug)
  }

  return {
    table: 'services',
    match: { id: serviceId },
    payload,
  }
}

export async function updateService(
  serviceId: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const { payload } = prepareServiceUpdate(serviceId, fields)
  delete payload.legacy_asset_key

  const existingResult = await supabase
    .from('services')
    .select('legacy_asset_key, slug, title')
    .eq('id', serviceId)
    .maybeSingle()

  if (!existingResult.error && existingResult.data) {
    const currentKey = String(existingResult.data.legacy_asset_key ?? '').trim()
    if (!currentKey) {
      const nextKey = stampLegacyAssetKey(existingResult.data, payload)
      if (nextKey) {
        payload.legacy_asset_key = nextKey
      }
    }
  }

  const result = await supabase
    .from('services')
    .update(payload)
    .eq('id', serviceId)
    .select()
    .single()

  if (result.error) {
    throwServiceMutationError(result.error)
  }

  return result.data as Record<string, unknown>
}

export async function deleteService(serviceId: string): Promise<void> {
  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('services').delete().eq('id', serviceId)

  if (error) {
    throw error
  }
}

export async function setServiceStatus(
  serviceId: string,
  status: 'draft' | 'published'
): Promise<Record<string, unknown>> {
  if (status !== 'draft' && status !== 'published') {
    throw new Error(`Invalid service status "${status}". Expected "draft" or "published".`)
  }

  const supabase = getSupabaseBrowser()
  const published_at = status === 'published' ? new Date().toISOString() : null

  const result = await supabase
    .from('services')
    .update({ status, published_at })
    .eq('id', serviceId)
    .select('id, slug, title, status, published_at, sort_order, updated_at')
    .single()

  const rowCount = Array.isArray(result.data)
    ? result.data.length
    : result.data == null
      ? 0
      : 1

  if (result.error) {
    throw result.error
  }

  if (!result.data || rowCount !== 1) {
    throw new Error(
      'Status update affected 0 rows (check RLS UPDATE/SELECT policies for services).'
    )
  }

  return result.data as Record<string, unknown>
}

export async function saveServiceSections(
  sections: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error('saveServiceSections requires at least one section.')
  }

  const supabase = getSupabaseBrowser()

  const results = await Promise.all(
    sections.map(async (section) => {
      if (!section?.id) {
        throw new Error('Each section must include an id.')
      }

      const payload = sanitizeSectionPayload(section)

      const result = await supabase
        .from('service_sections')
        .update(payload)
        .eq('id', section.id)
        .select()
        .single()

      if (result.error) {
        throw result.error
      }

      return result.data as Record<string, unknown>
    })
  )

  return results
}

export async function saveServiceMedia(
  serviceId: string,
  slots: Array<{
    slot: string
    media_id?: string | null
    storage_path?: string
    alt_override?: string
  }>
): Promise<Record<string, unknown>[]> {
  const supabase = getSupabaseBrowser()

  const existing = await supabase
    .from('service_media')
    .select('id, slot')
    .eq('service_id', serviceId)

  if (existing.error) {
    throw existing.error
  }

  const existingBySlot = Object.fromEntries((existing.data ?? []).map((row) => [row.slot, row]))
  const results: Record<string, unknown>[] = []

  for (const entry of slots) {
    const { slot, storage_path: path, alt_override: altOverride } = entry
    const existingRow = existingBySlot[slot]

    if (!path) {
      if (existingRow?.id) {
        const { error } = await supabase.from('service_media').delete().eq('id', existingRow.id)
        if (error) throw error
      }
      continue
    }

    const asset = await ensureMediaAssetForPath(path, { alt_text: altOverride ?? '' })

    if (existingRow?.id) {
      const result = await supabase
        .from('service_media')
        .update({
          media_id: asset.id,
          alt_override: altOverride === '' ? null : (altOverride ?? null),
        })
        .eq('id', existingRow.id)
        .select('*, media_assets(id, storage_path, public_url, filename, alt_text)')
        .single()

      if (result.error) throw result.error
      results.push(result.data as Record<string, unknown>)
    } else {
      const result = await supabase
        .from('service_media')
        .insert({
          service_id: serviceId,
          slot,
          media_id: asset.id,
          alt_override: altOverride === '' ? null : (altOverride ?? null),
        })
        .select('*, media_assets(id, storage_path, public_url, filename, alt_text)')
        .single()

      if (result.error) throw result.error
      results.push(result.data as Record<string, unknown>)
    }
  }

  return results
}
