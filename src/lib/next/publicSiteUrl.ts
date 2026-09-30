import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'

/** Production public origin used when CMS / env bases are missing or invalid. */
export const DEFAULT_PUBLIC_SITE_ORIGIN = 'https://flairestack.com'

function asTrimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * True for loopback / placeholder hosts that must not become public canonicals.
 */
function isNonPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local')
  )
}

/**
 * Normalize a candidate origin to `https://host` (no path, no trailing slash).
 * Returns null when empty, unparseable, or non-public (localhost).
 */
export function normalizePublicOrigin(value: unknown): string | null {
  const raw = asTrimmed(value)
  if (!raw) return null

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const url = new URL(withProtocol)
    if (!url.hostname || isNonPublicHostname(url.hostname)) return null
    const protocol = url.protocol === 'http:' ? 'http:' : 'https:'
    return `${protocol}//${url.host}`
  } catch {
    return null
  }
}

/**
 * Resolve the absolute public site origin.
 * Prefer CMS `canonical_base_url`, then `NEXT_PUBLIC_SITE_URL`, then `SITE_URL`,
 * then `https://flairestack.com`.
 */
export function resolvePublicSiteOrigin(
  settings?: Pick<PublicSiteSettings, 'canonical_base_url'> | null
): string {
  const candidates = [
    settings?.canonical_base_url,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    DEFAULT_PUBLIC_SITE_ORIGIN,
  ]

  for (const candidate of candidates) {
    const origin = normalizePublicOrigin(candidate)
    if (origin) return origin
  }

  return DEFAULT_PUBLIC_SITE_ORIGIN
}

/**
 * Build an absolute canonical URL for a public route path.
 * Home (`/` or empty) → `https://flairestack.com/`
 * Other routes → `https://flairestack.com/about` (no trailing slash).
 */
export function buildAbsoluteCanonical(origin: string, routePath: string): string {
  const base = normalizePublicOrigin(origin) || DEFAULT_PUBLIC_SITE_ORIGIN
  let path = asTrimmed(routePath) || '/'
  if (!path.startsWith('/')) path = `/${path}`

  // Strip query/hash if a full-ish path was passed.
  path = path.split('?')[0].split('#')[0] || '/'

  if (path === '/') return `${base}/`

  const normalized = path.replace(/\/+$/, '') || '/'
  return `${base}${normalized}`
}

/**
 * Prefer a page-level CMS canonical when it is an absolute public URL
 * whose path matches this route (or any non-root path).
 * Root-only CMS canonicals are ignored on non-home routes so `/about`
 * does not inherit `https://flairestack.com/`.
 * Otherwise build from the site origin + route path.
 */
export function resolvePublicCanonicalUrl(options: {
  settings?: Pick<PublicSiteSettings, 'canonical_base_url'> | null
  routePath: string
  cmsCanonicalUrl?: string | null
}): string {
  const origin = resolvePublicSiteOrigin(options.settings)
  const routeCanonical = buildAbsoluteCanonical(origin, options.routePath)
  const cms = asTrimmed(options.cmsCanonicalUrl)
  const routeIsHome = buildAbsoluteCanonical(origin, options.routePath) === `${origin}/`

  if (cms) {
    if (/^https?:\/\//i.test(cms)) {
      try {
        const url = new URL(cms)
        if (!isNonPublicHostname(url.hostname)) {
          const path = url.pathname || '/'
          const isCmsHome = path === '/' || path === ''
          if (isCmsHome && !routeIsHome) {
            return routeCanonical
          }
          if (isCmsHome) {
            return `${url.protocol}//${url.host}/`
          }
          return `${url.protocol}//${url.host}${path.replace(/\/+$/, '')}${url.search || ''}`
        }
      } catch {
        /* fall through to route-based canonical */
      }
    } else if (cms.startsWith('/')) {
      const isCmsHome = cms === '/' || cms === ''
      if (isCmsHome && !routeIsHome) {
        return routeCanonical
      }
      return buildAbsoluteCanonical(origin, cms)
    }
  }

  return routeCanonical
}
