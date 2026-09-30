import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'
import {
  DEFAULT_PUBLIC_SITE_ORIGIN,
  resolvePublicSiteOrigin,
} from '@/lib/next/publicSiteUrl'

/**
 * Site-wide Organization + WebSite JSON-LD for the public layout.
 * Uses site settings fields only — does not invent unrelated business data.
 * Stable @id values use the production domain as required for schema continuity.
 */
export function buildSiteWideJsonLd(settings: PublicSiteSettings): Record<string, unknown> {
  const origin = resolvePublicSiteOrigin(settings)
  const siteUrl = `${origin}/`
  const name = settings.company_name || settings.website_name || 'FlaireStack'
  const websiteName = settings.website_name || name

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${DEFAULT_PUBLIC_SITE_ORIGIN}/#organization`,
    name,
    url: siteUrl,
  }

  if (settings.description) {
    organization.description = settings.description
  }
  if (settings.logo_url) {
    organization.logo = settings.logo_url
  }
  if (settings.email) {
    organization.email = settings.email
  }
  if (settings.phone) {
    organization.telephone = settings.phone
  }

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': `${DEFAULT_PUBLIC_SITE_ORIGIN}/#website`,
    name: websiteName,
    url: siteUrl,
    publisher: { '@id': `${DEFAULT_PUBLIC_SITE_ORIGIN}/#organization` },
  }

  if (settings.description) {
    website.description = settings.description
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  }
}
