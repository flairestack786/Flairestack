import { ensureMediaAssetForPath } from './mediaAssets'
import { supabase } from './supabase'
import {
  buildDefaultSectionsForSlug,
  buildDefaultSeoForSlug,
  SERVICE_SECTION_KEYS,
} from './serviceDefaults'

/** Columns writable from the admin Service section editor. */
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
]

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
]

const SEO_WRITABLE_FIELDS = [
  'meta_title',
  'meta_description',
  'canonical_url',
  'robots',
  'og_title',
  'og_description',
  'og_type',
  'twitter_card',
  'twitter_title',
  'twitter_description',
  'status',
  'published_at',
]

const SEO_REQUIRED_DEFAULTS = Object.freeze({
  robots: 'index,follow',
  og_type: 'website',
  twitter_card: 'summary_large_image',
  status: 'draft',
})

/** All image slots from service_media_slot enum. */
export const SERVICE_MEDIA_SLOTS = [
  { slot: 'hero', label: 'Hero — primary' },
  { slot: 'overview', label: 'Hero — overview' },
  { slot: 'banner', label: 'Hero — banner' },
  { slot: 'features', label: 'Capabilities' },
  { slot: 'tech', label: 'Tech stack' },
  { slot: 'process', label: 'Process' },
  { slot: 'benefits', label: 'Benefits' },
  { slot: 'cta', label: 'CTA' },
  { slot: 'framework1', label: 'Framework row 1' },
  { slot: 'framework2', label: 'Framework row 2' },
  { slot: 'framework3', label: 'Framework row 3' },
  { slot: 'framework4', label: 'Framework row 4' },
  { slot: 'framework5', label: 'Framework row 5' },
  { slot: 'client_benefits', label: 'Testimonials background' },
  { slot: 'implementation_approach', label: 'Implementation approach' },
  { slot: 'business_outcomes', label: 'Final CTA background' },
]

/**
 * @param {Record<string, unknown>} section
 * @returns {Record<string, unknown>}
 */
function sanitizeSectionPayload(section) {
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

/**
 * @param {Record<string, unknown>} service
 * @returns {Record<string, unknown>}
 */
function sanitizeServicePayload(service) {
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

/**
 * @param {Record<string, unknown>} seo
 * @param {{ isUpdate?: boolean }} [options]
 * @returns {Record<string, unknown>}
 */
function sanitizeSeoPayload(seo, options = {}) {
  const isUpdate = Boolean(options.isUpdate)
  /** @type {Record<string, unknown>} */
  const payload = {}

  for (const key of SEO_WRITABLE_FIELDS) {
    if (seo[key] === undefined) continue
    const value = seo[key]

    if (key === 'published_at') {
      payload[key] = value || null
      continue
    }

    if (key in SEO_REQUIRED_DEFAULTS) {
      const trimmed =
        typeof value === 'string'
          ? value.trim()
          : value == null
            ? ''
            : String(value).trim()
      if (trimmed) {
        payload[key] = trimmed
      } else if (!isUpdate) {
        payload[key] = SEO_REQUIRED_DEFAULTS[key]
      }
      // Update + empty → omit so the existing NOT NULL DB value is preserved.
      continue
    }

    payload[key] = value === '' || value == null ? null : value
  }

  if (!isUpdate) {
    for (const [key, fallback] of Object.entries(SEO_REQUIRED_DEFAULTS)) {
      if (payload[key] == null || payload[key] === '') {
        payload[key] = fallback
      }
    }
  }

  for (const key of Object.keys(SEO_REQUIRED_DEFAULTS)) {
    if (key in payload && (payload[key] == null || payload[key] === '')) {
      throw new Error(
        `SEO save blocked: "${key}" cannot be null or empty (would violate NOT NULL).`
      )
    }
  }

  return payload
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listServices() {
  const { data, error, status, statusText } = await supabase
    .from('services')
    .select('id, slug, title, short_description, status, sort_order, published_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  // RLS denials often return HTTP 200 with data=[] and error=null (no exception).
  if (import.meta.env.DEV) {
    console.debug('[listServices]', {
      status,
      statusText,
      error,
      count: Array.isArray(data) ? data.length : null,
      data,
    })
  }

  if (error) {
    throw error
  }

  return data ?? []
}

/**
 * @param {string} serviceId
 * @returns {Promise<{ service: Record<string, unknown>, sections: Record<string, unknown>[], media: Record<string, unknown>[], seo: Record<string, unknown> | null }>}
 */
export async function getServiceWithContent(serviceId) {
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

/**
 * @param {{ slug: string, title: string, short_description: string, description: string, icon_name?: string, sort_order?: number }} input
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createService(input) {
  const slug = input.slug.trim().toLowerCase()
  const title = input.title.trim()

  if (!slug || !title) {
    throw new Error('Slug and title are required.')
  }

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
    })
    .select()
    .single()

  if (error) {
    throw error
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

/**
 * @param {string} label
 * @param {{ data: unknown, error: unknown, status?: number, statusText?: string, count?: number | null }} result
 * @param {Record<string, unknown>} [meta]
 */
function logMutationResult(label, result, meta = {}) {
  if (!import.meta.env.DEV) return

  const { data, error, status, statusText, count } = result
  console.debug(`[${label}]`, {
    ...meta,
    status,
    statusText,
    count,
    error,
    rowCount: Array.isArray(data) ? data.length : data == null ? 0 : 1,
    data,
  })
}

/**
 * @param {string} serviceId
 * @param {Record<string, unknown>} fields
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateService(serviceId, fields) {
  const payload = sanitizeServicePayload(fields)

  const result = await supabase
    .from('services')
    .update(payload)
    .eq('id', serviceId)
    .select()
    .single()

  logMutationResult('updateService', result, { serviceId, payloadKeys: Object.keys(payload) })

  if (result.error) {
    throw result.error
  }

  return result.data
}

/**
 * @param {string} serviceId
 * @returns {Promise<void>}
 */
export async function deleteService(serviceId) {
  const { error } = await supabase.from('services').delete().eq('id', serviceId)

  if (error) {
    throw error
  }
}

/**
 * @param {string} serviceId
 * @param {'draft' | 'published'} status
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setServiceStatus(serviceId, status) {
  if (status !== 'draft' && status !== 'published') {
    throw new Error(`Invalid service status "${status}". Expected "draft" or "published".`)
  }

  const published_at = status === 'published' ? new Date().toISOString() : null

  console.log('[setServiceStatus] request', {
    serviceId,
    currentTargetStatus: status,
    published_at,
  })

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

  console.log('[setServiceStatus] response', {
    serviceId,
    targetStatus: status,
    status: result.status,
    statusText: result.statusText,
    error: result.error,
    rowCount,
    data: result.data,
  })

  logMutationResult('setServiceStatus', result, {
    serviceId,
    requestedStatus: status,
    published_at,
  })

  if (result.error) {
    throw result.error
  }

  if (!result.data || rowCount !== 1) {
    throw new Error(
      'Status update affected 0 rows (check RLS UPDATE/SELECT policies for services).'
    )
  }

  return result.data
}

/**
 * @param {Record<string, unknown>[]} sections
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function saveServiceSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error('saveServiceSections requires at least one section.')
  }

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

      logMutationResult('saveServiceSections', result, {
        sectionId: section.id,
        sectionKey: section.section_key,
        payloadKeys: Object.keys(payload),
      })

      if (result.error) {
        throw result.error
      }

      return result.data
    })
  )

  return results
}

/**
 * @param {string} serviceId
 * @param {Array<{ slot: string, media_id?: string | null, storage_path?: string, alt_override?: string }>} slots
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function saveServiceMedia(serviceId, slots) {
  const existing = await supabase
    .from('service_media')
    .select('id, slot')
    .eq('service_id', serviceId)

  if (existing.error) {
    throw existing.error
  }

  const existingBySlot = Object.fromEntries((existing.data ?? []).map((row) => [row.slot, row]))

  const results = []

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
          alt_override: altOverride === '' ? null : altOverride ?? null,
        })
        .eq('id', existingRow.id)
        .select('*, media_assets(id, storage_path, public_url, filename, alt_text)')
        .single()

      logMutationResult('saveServiceMedia.update', result, {
        serviceId,
        slot,
        mediaRowId: existingRow.id,
      })

      if (result.error) throw result.error
      results.push(result.data)
    } else {
      const result = await supabase
        .from('service_media')
        .insert({
          service_id: serviceId,
          slot,
          media_id: asset.id,
          alt_override: altOverride === '' ? null : altOverride ?? null,
        })
        .select('*, media_assets(id, storage_path, public_url, filename, alt_text)')
        .single()

      logMutationResult('saveServiceMedia.insert', result, { serviceId, slot })

      if (result.error) throw result.error
      results.push(result.data)
    }
  }

  return results
}

/**
 * @param {string} serviceId
 * @param {Record<string, unknown>} seo
 * @returns {Promise<Record<string, unknown>>}
 */
export async function saveServiceSeo(serviceId, seo) {
  const isUpdate = Boolean(seo.id)
  const payload = sanitizeSeoPayload(seo, { isUpdate })

  if (isUpdate) {
    const result = await supabase
      .from('seo_metadata')
      .update(payload)
      .eq('id', seo.id)
      .select()
      .single()

    logMutationResult('saveServiceSeo.update', result, {
      serviceId,
      seoId: seo.id,
      payloadKeys: Object.keys(payload),
    })

    if (result.error) throw result.error
    return result.data
  }

  const insertPayload = {
    entity_type: 'service',
    service_id: serviceId,
    og_type: SEO_REQUIRED_DEFAULTS.og_type,
    robots: SEO_REQUIRED_DEFAULTS.robots,
    twitter_card: SEO_REQUIRED_DEFAULTS.twitter_card,
    ...payload,
  }

  const result = await supabase
    .from('seo_metadata')
    .insert(insertPayload)
    .select()
    .single()

  logMutationResult('saveServiceSeo.insert', result, { serviceId })

  if (result.error) throw result.error
  return result.data
}
