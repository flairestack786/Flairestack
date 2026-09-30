import { supabase } from './supabase'
import {
  analyzeSeo,
  buildDuplicateCounts,
  getEffectiveDescription,
  getEffectiveTitle,
  parseStructuredDataInput,
  summarizeSeoHealth,
} from './seoAnalysis'
import { fetchGlobalSeoSettings } from './seoGlobals'
import { seoToForm, buildSeoEntities } from './seoCore'
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

export { seoToForm, buildSeoEntities }

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
    // Source of truth for SEO module: seo_metadata.page_description.
    // Mirror onto pages.excerpt so page-content queries can show the same public excerpt
    // without joining seo_metadata. Meta description remains a separate field.
    await supabase
      .from('pages')
      .update({ excerpt: payload.page_description })
      .eq('id', entityId)
  }

  return { seo: seoRow, analysis }
}
