import { normalizeServiceSlug, publicServicePath } from './serviceSlug.js'

/** The only `services.status` value that may render on public pages. */
export const PUBLIC_SERVICE_STATUS = 'published'

/** Columns needed by every public service consumer (home, /services, nav/footer). */
export const PUBLIC_SERVICE_COLUMNS =
  'id, slug, title, short_description, description, icon_name, sort_order, status, legacy_asset_key'

/**
 * @param {unknown} row
 * @returns {boolean}
 */
export function isPublicServiceRow(row) {
  if (!row || typeof row !== 'object') return false
  const source = /** @type {Record<string, unknown>} */ (row)
  return source.status === PUBLIC_SERVICE_STATUS && Boolean(normalizeServiceSlug(source.slug))
}

/**
 * Keeps published rows only, ordered by `sort_order` (stable for ties).
 * The SQL query already filters by status; this guards every consumer against
 * a query that forgets the filter.
 *
 * @template {Record<string, unknown>} T
 * @param {T[] | null | undefined} rows
 * @returns {T[]}
 */
export function filterPublicServiceRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isPublicServiceRow(row))
    .sort((a, b) => {
      const diff = Number(a.row.sort_order ?? 0) - Number(b.row.sort_order ?? 0)
      return diff !== 0 ? diff : a.index - b.index
    })
    .map(({ row }) => row)
}

/**
 * Homepage CMS showcase items that may render publicly.
 * - Disabled items are dropped.
 * - Items linked to a service (`service_slug`) render only while that service is published.
 * - Items without a linked service are homepage-authored cards and are kept.
 *
 * @template {{ enabled?: boolean, service_slug?: string }} T
 * @param {T[] | null | undefined} items
 * @param {Iterable<string>} publishedSlugs
 * @returns {T[]}
 */
export function filterVisibleShowcaseItems(items, publishedSlugs) {
  if (!Array.isArray(items)) return []
  const published = new Set(
    Array.from(publishedSlugs, (slug) => normalizeServiceSlug(slug)).filter(Boolean)
  )
  return items.filter((item) => {
    if (!item || item.enabled === false) return false
    const linkedSlug = normalizeServiceSlug(item.service_slug)
    if (!linkedSlug) return true
    return published.has(linkedSlug)
  })
}

/**
 * Public routes whose rendered output depends on a service's publication state.
 *
 * @param {...unknown} slugs Current and/or previous slugs of the changed service.
 * @returns {string[]}
 */
export function serviceRevalidationPaths(...slugs) {
  const paths = new Set(['/', '/services', '/sitemap.xml'])
  for (const slug of slugs) {
    const path = publicServicePath(slug)
    if (path) paths.add(path)
  }
  return Array.from(paths)
}
