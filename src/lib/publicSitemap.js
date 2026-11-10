/**
 * Pure helpers for the public XML sitemap.
 * Keeps URL assembly testable without Next.js or Supabase.
 */

import { canonicalizeContentSlug, publicBlogPath, publicCareerPath } from './contentSlug.js'
import { canonicalizeServiceSlug, publicServicePath } from './serviceSlug.js'

/** Canonical production origin for sitemap / robots (never www). */
export const SITEMAP_SITE_ORIGIN = 'https://flairestack.com'

/**
 * Hard-coded App Router marketing routes that always exist publicly.
 * CMS `pages.route_path` values must match these to contribute lastModified.
 */
export const SITEMAP_STATIC_ROUTES = Object.freeze([
  Object.freeze({ path: '/', changeFrequency: 'weekly', priority: 1 }),
  Object.freeze({ path: '/about', changeFrequency: 'monthly', priority: 0.8 }),
  Object.freeze({ path: '/services', changeFrequency: 'weekly', priority: 0.9 }),
  Object.freeze({ path: '/blog', changeFrequency: 'weekly', priority: 0.8 }),
  Object.freeze({ path: '/careers', changeFrequency: 'weekly', priority: 0.7 }),
])

/** CMS page route_paths that map to real Next.js public pages. */
export const INDEXABLE_CMS_PAGE_PATHS = Object.freeze(
  new Set(['/', '/about', '/blog', '/careers'])
)

/**
 * Absolute sitemap URL. Home keeps a trailing slash; other paths do not.
 * @param {string} origin
 * @param {string} routePath
 * @returns {string}
 */
export function buildSitemapAbsoluteUrl(origin, routePath) {
  const base = String(origin || SITEMAP_SITE_ORIGIN).replace(/\/+$/, '') || SITEMAP_SITE_ORIGIN
  const path = normalizeSitemapPath(routePath) || '/'
  if (path === '/') return `${base}/`
  return `${base}${path}`
}

/**
 * @param {unknown} robots
 * @returns {boolean}
 */
export function isRobotsIndexable(robots) {
  const raw = String(robots ?? 'index,follow').trim().toLowerCase()
  if (!raw) return true
  return !raw.includes('noindex')
}

/**
 * Normalize a CMS route_path to the sitemap path form (no trailing slash except `/`).
 * @param {unknown} routePath
 * @returns {string | null}
 */
export function normalizeSitemapPath(routePath) {
  let path = String(routePath ?? '').trim()
  if (!path) return null
  if (!path.startsWith('/')) path = `/${path}`
  path = path.split('?')[0].split('#')[0] || '/'
  if (path !== '/' && path.endsWith('/')) {
    path = path.replace(/\/+$/, '') || '/'
  }
  return path || null
}

/**
 * @param {unknown} value
 * @returns {Date | undefined}
 */
export function parseSitemapLastModified(value) {
  if (value == null || value === '') return undefined
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Prefer updated_at when present; otherwise published_at. Never invent dates.
 * @param {{ updated_at?: unknown, published_at?: unknown } | null | undefined} row
 * @returns {Date | undefined}
 */
export function resolveSitemapLastModified(row) {
  if (!row || typeof row !== 'object') return undefined
  return (
    parseSitemapLastModified(row.updated_at) ||
    parseSitemapLastModified(row.published_at) ||
    undefined
  )
}

/**
 * Build MetadataRoute.Sitemap-compatible entries for FlaireStack public pages.
 *
 * @param {{
 *   origin?: string,
 *   cmsPages?: Array<{
 *     route_path?: unknown,
 *     updated_at?: unknown,
 *     published_at?: unknown,
 *     robots?: unknown,
 *   }>,
 *   services?: Array<{
 *     slug?: unknown,
 *     updated_at?: unknown,
 *     published_at?: unknown,
 *     robots?: unknown,
 *   }>,
 *   blogPosts?: Array<{
 *     slug?: unknown,
 *     updated_at?: unknown,
 *     published_at?: unknown,
 *     robots?: unknown,
 *   }>,
 *   jobPostings?: Array<{
 *     slug?: unknown,
 *     updated_at?: unknown,
 *     published_at?: unknown,
 *     robots?: unknown,
 *   }>,
 * }} [input]
 * @returns {Array<{
 *   url: string,
 *   lastModified?: Date,
 *   changeFrequency: 'weekly' | 'monthly',
 *   priority: number,
 * }>}
 */
export function buildPublicSitemapEntries(input = {}) {
  const origin = String(input.origin ?? '').trim() || SITEMAP_SITE_ORIGIN

  /** @type {Map<string, { url: string, lastModified?: Date, changeFrequency: 'weekly' | 'monthly', priority: number }>} */
  const byPath = new Map()

  for (const route of SITEMAP_STATIC_ROUTES) {
    byPath.set(route.path, {
      url: buildSitemapAbsoluteUrl(origin, route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  }

  for (const page of input.cmsPages ?? []) {
    const path = normalizeSitemapPath(page?.route_path)
    if (!path || !INDEXABLE_CMS_PAGE_PATHS.has(path)) continue
    if (!isRobotsIndexable(page?.robots)) {
      byPath.delete(path)
      continue
    }

    const existing = byPath.get(path)
    if (!existing) continue

    const lastModified = resolveSitemapLastModified(page)
    byPath.set(path, {
      ...existing,
      ...(lastModified ? { lastModified } : {}),
    })
  }

  for (const service of input.services ?? []) {
    if (!isRobotsIndexable(service?.robots)) continue
    const slug = canonicalizeServiceSlug(service?.slug)
    const path = publicServicePath(slug)
    if (!path) continue

    const lastModified = resolveSitemapLastModified(service)
    byPath.set(path, {
      url: buildSitemapAbsoluteUrl(origin, path),
      changeFrequency: 'weekly',
      priority: 0.7,
      ...(lastModified ? { lastModified } : {}),
    })
  }

  for (const post of input.blogPosts ?? []) {
    if (!isRobotsIndexable(post?.robots)) continue
    const slug = canonicalizeContentSlug(post?.slug)
    const path = publicBlogPath(slug)
    if (!path) continue
    const lastModified = resolveSitemapLastModified(post)
    byPath.set(path, {
      url: buildSitemapAbsoluteUrl(origin, path),
      changeFrequency: 'weekly',
      priority: 0.65,
      ...(lastModified ? { lastModified } : {}),
    })
  }

  for (const job of input.jobPostings ?? []) {
    if (!isRobotsIndexable(job?.robots)) continue
    const slug = canonicalizeContentSlug(job?.slug)
    const path = publicCareerPath(slug)
    if (!path) continue
    const lastModified = resolveSitemapLastModified(job)
    byPath.set(path, {
      url: buildSitemapAbsoluteUrl(origin, path),
      changeFrequency: 'weekly',
      priority: 0.6,
      ...(lastModified ? { lastModified } : {}),
    })
  }

  const staticPaths = SITEMAP_STATIC_ROUTES.map((route) => route.path)
  const staticEntries = staticPaths.map((path) => byPath.get(path)).filter(Boolean)
  const dynamicEntries = [...byPath.entries()]
    .filter(([path]) => !staticPaths.includes(path))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, entry]) => entry)

  return [...staticEntries, ...dynamicEntries]
}
