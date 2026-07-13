import { supabase } from './supabase'
import {
  analyzeSeo,
  buildDuplicateCounts,
  getEffectiveDescription,
  getEffectiveTitle,
  parseStructuredDataInput,
  stringifyStructuredData,
  summarizeSeoHealth,
} from './seoAnalysis'
import { fetchGlobalSeoSettings, resolveInheritedSeo } from './seoGlobals'
import {
  assertSeoPayloadConstraints,
  sanitizeSeoPayload,
  SEO_REQUIRED_TEXT_DEFAULTS,
} from './seoPayload'

export {
  assertSeoPayloadConstraints,
  normalizeRequiredSeoText,
  sanitizeSeoPayload,
  SEO_REQUIRED_TEXT_DEFAULTS,
} from './seoPayload'

/**
 * @param {Record<string, unknown> | null | undefined} seo
 * @param {Record<string, unknown>} entity
 */
export function seoToForm(seo, entity = {}) {
  const structured = seo?.structured_data ?? {}
  const extensions =
    seo?.extensions && typeof seo.extensions === 'object' && !Array.isArray(seo.extensions)
      ? /** @type {Record<string, unknown>} */ (seo.extensions)
      : {}

  return {
    id: seo?.id ? String(seo.id) : '',
    entity_type: String(seo?.entity_type || entity.entity_type || 'page'),
    page_id: seo?.page_id ? String(seo.page_id) : entity.page_id ? String(entity.page_id) : '',
    service_id: seo?.service_id
      ? String(seo.service_id)
      : entity.service_id
        ? String(entity.service_id)
        : '',
    meta_title: String(seo?.meta_title ?? ''),
    meta_description: String(seo?.meta_description ?? ''),
    canonical_url: String(seo?.canonical_url ?? ''),
    robots: String(seo?.robots ?? 'index,follow').trim() || 'index,follow',
    og_title: String(seo?.og_title ?? ''),
    og_description: String(seo?.og_description ?? ''),
    og_image_id: seo?.og_image_id ? String(seo.og_image_id) : '',
    og_image_path: String(extensions.og_image_path ?? ''),
    og_type: String(seo?.og_type ?? 'website').trim() || 'website',
    twitter_card: String(seo?.twitter_card ?? 'summary_large_image').trim() || 'summary_large_image',
    twitter_title: String(seo?.twitter_title ?? ''),
    twitter_description: String(seo?.twitter_description ?? ''),
    twitter_image_id: seo?.twitter_image_id ? String(seo.twitter_image_id) : '',
    twitter_image_path: String(extensions.twitter_image_path ?? ''),
    structured_data: structured,
    structured_data_text: stringifyStructuredData(structured),
    focus_keyword: String(seo?.focus_keyword ?? ''),
    related_keywords: Array.isArray(seo?.related_keywords)
      ? seo.related_keywords.map((item) => String(item))
      : [],
    page_description: String(seo?.page_description ?? ''),
    seo_score: seo?.seo_score == null ? null : Number(seo.seo_score),
    extensions,
    status: String(seo?.status ?? 'draft'),
    published_at: seo?.published_at ? String(seo.published_at) : '',
    label: String(entity.label || entity.title || entity.name || ''),
    route_path: String(entity.route_path || entity.path || ''),
    slug: String(entity.slug || ''),
  }
}

/**
 * @returns {Promise<{
 *   pages: Record<string, unknown>[],
 *   services: Record<string, unknown>[],
 *   seoRows: Record<string, unknown>[],
 * }>}
 */
export async function fetchSeoCatalog() {
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

/**
 * Merge stored form with inherited globals for scoring / previews.
 * @param {Record<string, unknown>} form
 * @param {Record<string, unknown> | null | undefined} globals
 */
function toEffectiveForm(form, globals) {
  if (!globals) return { form, inherited: /** @type {Record<string, boolean>} */ ({}) }
  const { resolved, inherited } = resolveInheritedSeo(form, globals, {
    pageTitle: String(form.label || ''),
    routePath: String(form.route_path || '/'),
    entityType: String(form.entity_type || 'page'),
  })
  return {
    form: {
      ...form,
      meta_title: resolved.meta_title,
      meta_description: resolved.meta_description,
      canonical_url: resolved.canonical_url,
      robots: resolved.robots,
      og_title: resolved.og_title,
      og_description: resolved.og_description,
      og_image_path: resolved.og_image_path,
      twitter_title: resolved.twitter_title,
      twitter_description: resolved.twitter_description,
      twitter_image_path: resolved.twitter_image_path,
      page_description: resolved.page_description,
      focus_keyword: resolved.focus_keyword,
      related_keywords: resolved.related_keywords,
    },
    inherited,
  }
}

/**
 * @param {{ pages: Record<string, unknown>[], services: Record<string, unknown>[], seoRows: Record<string, unknown>[] }} catalog
 * @param {Record<string, unknown> | null} [globals]
 */
export function buildSeoEntities(catalog, globals = null) {
  const byPage = new Map(
    (catalog.seoRows ?? [])
      .filter((row) => row.page_id)
      .map((row) => [String(row.page_id), row])
  )
  const byService = new Map(
    (catalog.seoRows ?? [])
      .filter((row) => row.service_id)
      .map((row) => [String(row.service_id), row])
  )

  /** @type {Record<string, unknown>[]} */
  const entities = []

  for (const page of catalog.pages ?? []) {
    const seo = byPage.get(String(page.id)) ?? null
    const stored = seoToForm(seo, {
      entity_type: 'page',
      page_id: page.id,
      label: page.title,
      route_path: page.route_path,
      slug: page.slug,
    })
    const { form: effective, inherited } = toEffectiveForm(stored, globals)
    entities.push({
      key: `page:${page.id}`,
      entity_type: 'page',
      entity_id: String(page.id),
      label: String(page.title ?? page.slug ?? 'Page'),
      slug: String(page.slug ?? ''),
      route_path: String(page.route_path ?? `/${page.slug ?? ''}`),
      status: String(page.status ?? 'draft'),
      updated_at: page.updated_at,
      seo,
      form: stored,
      effectiveForm: effective,
      inherited,
    })
  }

  for (const service of catalog.services ?? []) {
    const seo = byService.get(String(service.id)) ?? null
    const stored = seoToForm(seo, {
      entity_type: 'service',
      service_id: service.id,
      label: service.title,
      route_path: `/services/${service.slug ?? ''}`,
      slug: service.slug,
    })
    const { form: effective, inherited } = toEffectiveForm(stored, globals)
    entities.push({
      key: `service:${service.id}`,
      entity_type: 'service',
      entity_id: String(service.id),
      label: String(service.title ?? service.slug ?? 'Service'),
      slug: String(service.slug ?? ''),
      route_path: `/services/${service.slug ?? ''}`,
      status: String(service.status ?? 'draft'),
      updated_at: service.updated_at,
      seo,
      form: stored,
      effectiveForm: effective,
      inherited,
    })
  }

  const titleCounts = buildDuplicateCounts(entities, (row) =>
    getEffectiveTitle(row.effectiveForm ?? row.form)
  )
  const descCounts = buildDuplicateCounts(entities, (row) =>
    getEffectiveDescription(row.effectiveForm ?? row.form)
  )

  return entities.map((entity) => {
    const analysisForm = entity.effectiveForm ?? entity.form
    const analysis = analyzeSeo(analysisForm, {
      duplicates: {
        titles: titleCounts,
        descriptions: descCounts,
        selfTitle: getEffectiveTitle(analysisForm),
        selfDescription: getEffectiveDescription(analysisForm),
      },
    })
    return { ...entity, analysis }
  })
}

/**
 * @returns {Promise<{
 *   entities: ReturnType<typeof buildSeoEntities>,
 *   health: ReturnType<typeof summarizeSeoHealth>,
 * }>}
 */
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

/**
 * @param {'page' | 'service'} entityType
 * @param {string} entityId
 */
export async function fetchSeoEntity(entityType, entityId) {
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
    const entities = buildSeoEntities(catalog, settings)
    const current = entities.find((row) => row.key === `page:${entityId}`)

    return {
      entity_type: 'page',
      entity_id: entityId,
      label: String(page.title ?? ''),
      slug: String(page.slug ?? ''),
      route_path: String(page.route_path ?? ''),
      status: String(page.status ?? 'draft'),
      form: current?.form ?? seoToForm(seo, { entity_type: 'page', page_id: entityId, label: page.title, route_path: page.route_path, slug: page.slug }),
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
  const entities = buildSeoEntities(catalog, settings)
  const current = entities.find((row) => row.key === `service:${entityId}`)

  return {
    entity_type: 'service',
    entity_id: entityId,
    label: String(service.title ?? ''),
    slug: String(service.slug ?? ''),
    route_path: `/services/${service.slug ?? ''}`,
    status: String(service.status ?? 'draft'),
    form: current?.form ?? seoToForm(seo, {
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

/**
 * @param {'page' | 'service'} entityType
 * @param {string} entityId
 * @param {Record<string, unknown>} form
 */
export async function saveSeoEntity(entityType, entityId, form) {
  const parsed = parseStructuredDataInput(String(form.structured_data_text ?? ''))
  if (!parsed.ok) {
    throw new Error(parsed.error || 'Invalid JSON-LD.')
  }

  const peers = buildSeoEntities(await fetchSeoCatalog()).filter(
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
          ? form.extensions
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
