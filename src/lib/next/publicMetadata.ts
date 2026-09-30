import type { Metadata } from 'next'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'
import {
  buildAbsoluteCanonical,
  resolvePublicSiteOrigin,
} from '@/lib/next/publicSiteUrl'

const DEFAULT_FAVICON = '/favicon.png?v=2'

/**
 * Global Metadata API values from `site_settings` (defaults only).
 * Page-specific generateMetadata overrides title/description per route.
 * Canonical / og:url for pages are injected via PublicCanonicalTags.
 */
export function buildGlobalPublicMetadata(settings: PublicSiteSettings): Metadata {
  const siteName = settings.website_name || settings.company_name
  const title =
    settings.default_meta_title.trim() ||
    `${siteName} | AI-First Software Development Studio`
  const description = settings.default_meta_description || settings.description

  const ogImagePath = settings.default_og_image || settings.default_twitter_image
  const ogImage = ogImagePath ? getPublicMediaUrl(ogImagePath) : null
  const twitterImagePath = settings.default_twitter_image || settings.default_og_image
  const twitterImage = twitterImagePath ? getPublicMediaUrl(twitterImagePath) : ogImage

  const favicon = settings.favicon_url || DEFAULT_FAVICON
  const origin = resolvePublicSiteOrigin(settings)

  const robotsRaw = (settings.default_robots || 'index,follow').toLowerCase()
  const index = !robotsRaw.includes('noindex')
  const follow = !robotsRaw.includes('nofollow')

  const metadata: Metadata = {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    robots: {
      index,
      follow,
    },
    icons: {
      icon: favicon,
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
    verification: {
      ...(settings.gsc_verification
        ? { google: settings.gsc_verification }
        : {}),
      ...(settings.bing_verification
        ? { other: { 'msvalidate.01': settings.bing_verification } }
        : {}),
    },
  }

  return metadata
}

/** Home absolute canonical for layout-level fallback tags when needed. */
export function getGlobalHomeCanonical(settings: PublicSiteSettings): string {
  return buildAbsoluteCanonical(resolvePublicSiteOrigin(settings), '/')
}
