'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import { getPublicUrl } from '@/lib/next/mediaBrowser'
import {
  analyzeSeo,
  buildDuplicateCounts,
  getEffectiveDescription,
  getEffectiveTitle,
  parseStructuredDataInput,
  summarizeSeoHealth,
} from '@/lib/seoAnalysis'
import { seoToForm, buildSeoEntities } from '@/lib/seoCore'
import {
  assertSeoPayloadConstraints,
  sanitizeSeoPayload,
  SEO_REQUIRED_TEXT_DEFAULTS,
} from '@/lib/seoPayload'
import {
  globalSeoToForm,
  globalSeoFormToPayload,
  resolveInheritedSeo,
} from '@/lib/seoInheritance'

export { seoToForm, buildSeoEntities, resolveInheritedSeo }

type SeoEntityRow = {
  key: string
  entity_type: string
  entity_id: string
  form: Record<string, unknown>
  effectiveForm?: Record<string, unknown>
  inherited: Record<string, unknown>
  analysis?: unknown
  label?: string
  [key: string]: unknown
}

const SITE_SETTINGS_TABLE = 'site_settings'
const IMMUTABLE_SITE_FIELDS = new Set(['id', 'created_at', 'updated_at'])

async function getSiteSettingsBrowser(): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error('Site settings row is missing. Configure settings in Vite CMS first.')
  }
  return data
}

async function saveSiteSettingsBrowser(
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseBrowser()
  const current = await getSiteSettingsBrowser()
  const payload = Object.fromEntries(
    Object.entries(data).filter(([key]) => !IMMUTABLE_SITE_FIELDS.has(key))
  )

  if (Object.keys(payload).length === 0) {
    throw new Error('saveSiteSettings requires at least one field to update.')
  }

  const { data: updated, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .update(payload)
    .eq('id', current.id)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function fetchGlobalSeoSettings() {
  const settings = await getSiteSettingsBrowser()
  return { settings, form: globalSeoToForm(settings) }
}

export async function saveGlobalSeoSettings(form: Record<string, string>) {
  const payload = globalSeoFormToPayload(form)
  const updated = await saveSiteSettingsBrowser(payload)
  return { settings: updated, form: globalSeoToForm(updated) }
}

export function mediaPathToUrl(
  path: string | null | undefined,
  resolvePublicUrl: (path: string) => string = getPublicUrl
) {
  const value = typeof path === 'string' ? path.trim() : path == null ? '' : String(path).trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  try {
    return resolvePublicUrl(value)
  } catch {
    return ''
  }
}

export async function fetchSeoCatalog() {
  const supabase = getSupabaseBrowser()
  const [pagesResult, servicesResult, seoResult] = await Promise.all([
    supabase
      .from('pages')
      .select('id, slug, title, route_path, status, updated_at')
      .order('title', { ascending: true }),
    supabase
      .from('services')
      .select('id, slug, title, status, updated_at')
      .order('title', { ascending: true }),
    supabase.from('seo_metadata').select('*'),
  ])

  if (pagesResult.error) throw pagesResult.error
  if (servicesResult.error) throw servicesResult.error
  if (seoResult.error) throw seoResult.error

  return {
    pages: pagesResult.data ?? [],
    services: servicesResult.data ?? [],
    seoRows: seoResult.data ?? [],
  }
}

export async function fetchSeoDashboard() {
  const [catalog, { settings }] = await Promise.all([
    fetchSeoCatalog(),
    fetchGlobalSeoSettings(),
  ])
  const entities = buildSeoEntities(catalog, settings)
  return {
    entities,
    health: summarizeSeoHealth(entities),
    globals: settings,
  }
}

export async function fetchSeoEntity(entityType: 'page' | 'service', entityId: string) {
  const supabase = getSupabaseBrowser()

  if (entityType === 'page') {
    const { data: page, error } = await supabase
      .from('pages')
      .select('id, slug, title, route_path, status, updated_at')
      .eq('id', entityId)
      .single()
    if (error) throw error

    const { data: seo, error: seoError } = await supabase
      .from('seo_metadata')
      .select('*')
      .eq('page_id', entityId)
      .maybeSingle()
    if (seoError) throw seoError

    const [{ settings }, catalog] = await Promise.all([
      fetchGlobalSeoSettings(),
      fetchSeoCatalog(),
    ])
    const entities = buildSeoEntities(catalog, settings) as SeoEntityRow[]
    const current = entities.find((row) => row.key === `page:${entityId}`)

    return {
      entity_type: 'page' as const,
      entity_id: entityId,
      label: String(page.title ?? ''),
      slug: String(page.slug ?? ''),
      route_path: String(page.route_path ?? ''),
      status: String(page.status ?? 'draft'),
      form:
        current?.form ??
        seoToForm(seo, {
          entity_type: 'page',
          page_id: entityId,
          label: page.title,
          route_path: page.route_path,
          slug: page.slug,
        }),
      inherited: current?.inherited ?? {},
      analysis: current?.analysis,
      peers: entities,
      globals: settings,
    }
  }

  const { data: service, error } = await supabase
    .from('services')
    .select('id, slug, title, status, updated_at')
    .eq('id', entityId)
    .single()
  if (error) throw error

  const { data: seo, error: seoError } = await supabase
    .from('seo_metadata')
    .select('*')
    .eq('service_id', entityId)
    .maybeSingle()
  if (seoError) throw seoError

  const [{ settings }, catalog] = await Promise.all([
    fetchGlobalSeoSettings(),
    fetchSeoCatalog(),
  ])
  const entities = buildSeoEntities(catalog, settings) as SeoEntityRow[]
  const current = entities.find((row) => row.key === `service:${entityId}`)

  return {
    entity_type: 'service' as const,
    entity_id: entityId,
    label: String(service.title ?? ''),
    slug: String(service.slug ?? ''),
    route_path: `/services/${service.slug ?? ''}`,
    status: String(service.status ?? 'draft'),
    form:
      current?.form ??
      seoToForm(seo, {
        entity_type: 'service',
        service_id: entityId,
        label: service.title,
        route_path: `/services/${service.slug ?? ''}`,
        slug: service.slug,
      }),
    inherited: current?.inherited ?? {},
    analysis: current?.analysis,
    peers: entities,
    globals: settings,
  }
}

export async function saveSeoEntity(
  entityType: 'page' | 'service',
  entityId: string,
  form: Record<string, unknown>
) {
  const supabase = getSupabaseBrowser()
  const parsed = parseStructuredDataInput(String(form.structured_data_text ?? ''))
  if (!parsed.ok) {
    throw new Error(parsed.error || 'Invalid JSON-LD.')
  }

  const peers = (buildSeoEntities(await fetchSeoCatalog()) as SeoEntityRow[]).filter(
    (row) => !(row.entity_type === entityType && row.entity_id === entityId)
  )
  const draftForm = {
    ...form,
    structured_data: parsed.value,
  }
  const titleCounts = buildDuplicateCounts(
    [...peers.map((p) => p.form), draftForm],
    (row) => getEffectiveTitle(row)
  )
  const descCounts = buildDuplicateCounts(
    [...peers.map((p) => p.form), draftForm],
    (row) => getEffectiveDescription(row)
  )
  const analysis = analyzeSeo(draftForm, {
    duplicates: {
      titles: titleCounts,
      descriptions: descCounts,
      selfTitle: getEffectiveTitle(draftForm),
      selfDescription: getEffectiveDescription(draftForm),
    },
  })

  const isUpdate = Boolean(form.id)
  const payload = sanitizeSeoPayload(
    {
      ...draftForm,
      structured_data: parsed.value,
      seo_score: analysis.score,
      extensions: {
        ...(typeof form.extensions === 'object' && form.extensions && !Array.isArray(form.extensions)
          ? (form.extensions as Record<string, unknown>)
          : {}),
        last_analyzed_at: new Date().toISOString(),
        issue_codes: analysis.issues
          .filter((issue) => issue.severity !== 'success')
          .map((issue) => issue.code),
      },
    },
    { isUpdate }
  )

  let seoRow
  if (isUpdate) {
    const { data, error } = await supabase
      .from('seo_metadata')
      .update(payload)
      .eq('id', String(form.id))
      .select()
      .single()
    if (error) throw error
    seoRow = data
  } else {
    const insertPayload =
      entityType === 'page'
        ? {
            entity_type: 'page',
            page_id: entityId,
            og_type: SEO_REQUIRED_TEXT_DEFAULTS.og_type,
            robots: SEO_REQUIRED_TEXT_DEFAULTS.robots,
            twitter_card: SEO_REQUIRED_TEXT_DEFAULTS.twitter_card,
            ...payload,
          }
        : {
            entity_type: 'service',
            service_id: entityId,
            og_type: SEO_REQUIRED_TEXT_DEFAULTS.og_type,
            robots: SEO_REQUIRED_TEXT_DEFAULTS.robots,
            twitter_card: SEO_REQUIRED_TEXT_DEFAULTS.twitter_card,
            ...payload,
          }

    assertSeoPayloadConstraints(insertPayload, 'insert')

    const { data, error } = await supabase
      .from('seo_metadata')
      .insert(insertPayload)
      .select()
      .single()
    if (error) throw error
    seoRow = data
  }

  if (entityType === 'page' && payload.page_description !== undefined) {
    await supabase
      .from('pages')
      .update({ excerpt: payload.page_description })
      .eq('id', entityId)
  }

  return { seo: seoRow, analysis }
}
