import type { Metadata } from 'next'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'
import { seoToForm } from '@/lib/seoCore'
import { resolveInheritedSeo } from '@/lib/seoInheritance'

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * Build Next Metadata from a CMS seo_metadata row + site settings (same inheritance as Vite).
 */
export function buildPublicPageMetadata(options: {
  seoRow: Record<string, unknown> | null | undefined
  settings: PublicSiteSettings
  pageTitle: string
  routePath: string
  entityType?: 'page' | 'service'
  fallbackTitle?: string
  fallbackDescription?: string
}): Metadata {
  const {
    seoRow,
    settings,
    pageTitle,
    routePath,
    entityType = 'page',
    fallbackTitle = '',
    fallbackDescription = '',
  } = options

  const globals = {
    default_meta_title: settings.default_meta_title,
    default_meta_description: settings.default_meta_description,
    default_og_image: settings.default_og_image,
    default_twitter_image: settings.default_twitter_image,
    canonical_base_url: settings.canonical_base_url,
    default_robots: settings.default_robots,
    website_name: settings.website_name,
    company_name: settings.company_name,
  }

  const form = seoToForm(seoRow, {
    label: pageTitle,
    route_path: routePath,
    entity_type: entityType,
  })

  const { resolved: resolvedRaw } = resolveInheritedSeo(form, globals, {
    pageTitle,
    routePath,
    entityType,
  })
  const resolved = resolvedRaw as Record<string, unknown>

  const title =
    asString(resolved.meta_title) ||
    asString(fallbackTitle) ||
    asString(settings.default_meta_title) ||
    settings.website_name

  const description =
    asString(resolved.meta_description) ||
    asString(fallbackDescription) ||
    asString(settings.default_meta_description) ||
    settings.description

  const ogImagePath = asString(resolved.og_image_path) || settings.default_og_image
  const twitterImagePath =
    asString(resolved.twitter_image_path) || settings.default_twitter_image || ogImagePath
  const ogImage = ogImagePath ? getPublicMediaUrl(ogImagePath) : null
  const twitterImage = twitterImagePath ? getPublicMediaUrl(twitterImagePath) : ogImage

  const canonical = asString(resolved.canonical_url)
  const robotsRaw = (asString(resolved.robots) || settings.default_robots || 'index,follow').toLowerCase()
  const index = !robotsRaw.includes('noindex')
  const follow = !robotsRaw.includes('nofollow')

  const ogTitle = asString(resolved.og_title) || title
  const ogDescription = asString(resolved.og_description) || description
  const twitterTitle = asString(resolved.twitter_title) || ogTitle
  const twitterDescription = asString(resolved.twitter_description) || ogDescription
  const ogType = asString(resolved.og_type) || 'website'
  const twitterCard = asString(resolved.twitter_card) || 'summary_large_image'

  return {
    title: { absolute: title },
    description,
    robots: { index, follow },
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: ogType as 'website' | 'article',
      siteName: settings.website_name,
      title: ogTitle,
      description: ogDescription,
      ...(canonical ? { url: canonical } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: twitterCard as 'summary_large_image' | 'summary',
      title: twitterTitle,
      description: twitterDescription,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
  }
}

/**
 * Resolve public JSON-LD (Vite `buildPublicDocumentSeo` parity).
 * Prefer page/service `seo_metadata.structured_data`; otherwise use CMS
 * Organization + Website JSON-LD from site_settings. Does not invent values.
 */
export function resolvePublicJsonLd(
  seoRow: Record<string, unknown> | null | undefined,
  settings?: Pick<PublicSiteSettings, 'organization_jsonld' | 'website_jsonld'> | null
): unknown | null {
  const pageData = getSeoStructuredData(seoRow)
  if (pageData) return pageData

  const parts: Record<string, unknown>[] = []
  if (settings?.organization_jsonld) parts.push(settings.organization_jsonld)
  if (settings?.website_jsonld) parts.push(settings.website_jsonld)
  if (parts.length === 0) return null
  if (parts.length === 1) return parts[0]
  return parts
}

/**
 * Extract JSON-LD from seo row (page-specific) for script injection.
 * Does not invent schema — only passes through CMS structured_data when present.
 */
export function getSeoStructuredData(
  seoRow: Record<string, unknown> | null | undefined
): unknown | null {
  const data = seoRow?.structured_data
  if (!data || typeof data !== 'object') return null
  if (Array.isArray(data) && data.length === 0) return null
  if (!Array.isArray(data) && Object.keys(data as object).length === 0) return null
  return data
}
