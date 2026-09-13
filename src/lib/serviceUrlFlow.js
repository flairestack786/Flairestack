import { SERVICE_CATALOG_ASSET_KEYS } from './serviceCatalogAssets.js'
import { assertValidServiceSlug, normalizeServiceSlug } from './serviceSlug.js'

/**
 * Immutable bundled-asset keys (original catalog folders).
 * Not live public slugs — a CMS rename must not change these.
 */
export const STATIC_SERVICE_SLUGS = SERVICE_CATALOG_ASSET_KEYS

/**
 * Live public links are CMS published rows only. An empty result means
 * "no published services", not "use the static catalog slugs".
 * @param {Array<{ slug?: string, title?: string }> | null | undefined} rows
 */
export function buildPublishedServicesList(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }
  return rows.filter((service) => service.slug && service.title)
}

/**
 * Exact PostgREST filters used by `fetchPublishedService`.
 * @param {unknown} slug
 */
export function buildPublishedServiceLookup(slug) {
  return {
    table: 'services',
    select: '*',
    filters: {
      slug: normalizeServiceSlug(slug),
      status: 'published',
    },
  }
}

/**
 * CMS save always matches the row by id. Slug is only a payload field.
 * @param {string} serviceId
 * @param {Record<string, unknown>} fields
 */
export function buildCmsServiceUpdate(serviceId, fields) {
  const payload = { ...fields }
  if ('slug' in payload) {
    payload.slug = assertValidServiceSlug(payload.slug)
  }
  return {
    table: 'services',
    match: { id: serviceId },
    payload,
  }
}

/**
 * Hard-refresh path: empty cache + public lookup + optional static fallback.
 * A CMS hit is enough; a missing services.js entry must not block render.
 * @param {{
 *   fetchedRow: { id: string, slug: string, status: string } | null,
 *   urlSlug: string,
 *   staticCatalog?: Iterable<string>,
 * }} input
 */
export function resolveHardRefreshPublicService({
  fetchedRow,
  urlSlug,
  staticCatalog = STATIC_SERVICE_SLUGS,
}) {
  const lookup = buildPublishedServiceLookup(urlSlug)
  const staticFallback = [...staticCatalog].find((slug) => slug === lookup.filters.slug) ?? null

  if (!fetchedRow) {
    return {
      lookup,
      staticFallback,
      render: null,
    }
  }

  if (
    fetchedRow.slug !== lookup.filters.slug ||
    fetchedRow.status !== lookup.filters.status
  ) {
    return { lookup, staticFallback, render: null }
  }

  return {
    lookup,
    staticFallback,
    render: {
      serviceId: fetchedRow.id,
      slug: fetchedRow.slug,
      usedStaticFallback: Boolean(staticFallback),
    },
  }
}
