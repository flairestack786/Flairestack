import type { Metadata } from 'next'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'

const DEFAULT_FAVICON = '/favicon.png?v=2'

/**
 * Global Metadata API values from `site_settings` (defaults only).
 * Page-specific generateMetadata in later phases can override.
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
  const canonicalBase = settings.canonical_base_url.replace(/\/$/, '')

  const robotsRaw = settings.default_robots.toLowerCase()
  const index = !robotsRaw.includes('noindex')
  const follow = !robotsRaw.includes('nofollow')

  const metadata: Metadata = {
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
      ...(canonicalBase ? { url: canonicalBase } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(twitterImage ? { images: [twitterImage] } : {}),
    },
    ...(canonicalBase
      ? {
          metadataBase: (() => {
            try {
              return new URL(canonicalBase)
            } catch {
              return undefined
            }
          })(),
          alternates: { canonical: '/' },
        }
      : {}),
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
