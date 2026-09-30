import type { Metadata } from 'next'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'
import {
  resolvePublicCanonicalUrl,
  resolvePublicSiteOrigin,
} from '@/lib/next/publicSiteUrl'
import { seoToForm } from '@/lib/seoCore'
import { resolveInheritedSeo } from '@/lib/seoInheritance'

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

export type PublicPageMetadataResult = {
  metadata: Metadata
  /** Absolute canonical URL (always set), including home trailing slash. */
  canonical: string
}

/**
 * Build Next Metadata from a CMS seo_metadata row + site settings,
 * with a guaranteed absolute canonical (returned separately for exact head tags).
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
  return buildPublicPageMetadataWithCanonical(options).metadata
}

/**
 * Same as buildPublicPageMetadata, also returning the exact canonical string
 * for `<link rel="canonical">` / `og:url` injection (trailing slash preserved).
 */
export function buildPublicPageMetadataWithCanonical(options: {
  seoRow: Record<string, unknown> | null | undefined
  settings: PublicSiteSettings
  pageTitle: string
  routePath: string
  entityType?: 'page' | 'service'
  fallbackTitle?: string
  fallbackDescription?: string
}): PublicPageMetadataResult {
  const {
    seoRow,
    settings,
    pageTitle,
    routePath,
    entityType = 'page',
    fallbackTitle = '',
    fallbackDescription = '',
  } = options

  const origin = resolvePublicSiteOrigin(settings)

  const globals = {
    default_meta_title: settings.default_meta_title,
    default_meta_description: settings.default_meta_description,
    default_og_image: settings.default_og_image,
    default_twitter_image: settings.default_twitter_image,
    canonical_base_url: settings.canonical_base_url || origin,
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

  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath,
    cmsCanonicalUrl: asString(resolved.canonical_url),
  })

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
    canonical,
    metadata: {
      metadataBase: new URL(origin),
      title: { absolute: title },
      description,
      robots: { index, follow },
      // Canonical / og:url are emitted via PublicCanonicalTags to preserve
      // the home trailing slash that Next's Metadata serializer strips.
      openGraph: {
        type: ogType as 'website' | 'article',
        siteName: settings.website_name,
        title: ogTitle,
        description: ogDescription,
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      twitter: {
        card: twitterCard as 'summary_large_image' | 'summary',
        title: twitterTitle,
        description: twitterDescription,
        ...(twitterImage ? { images: [twitterImage] } : {}),
      },
    },
  }
}

/**
 * Page-specific JSON-LD only (`seo_metadata.structured_data`).
 * Site-wide Organization/WebSite JSON-LD lives in the public layout.
 */
export function resolvePublicJsonLd(
  seoRow: Record<string, unknown> | null | undefined,
  _settings?: Pick<PublicSiteSettings, 'organization_jsonld' | 'website_jsonld'> | null
): unknown | null {
  return getSeoStructuredData(seoRow)
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
