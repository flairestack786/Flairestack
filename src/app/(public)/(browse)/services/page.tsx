import type { Metadata } from 'next'
import ServicesListingView from '@/components/next/public/services/ServicesListingView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import PublicJsonLd from '@/components/next/public/PublicJsonLd'
import {
  buildPublicPageMetadataWithCanonical,
  resolvePublicJsonLd,
} from '@/lib/next/buildPublicPageMetadata'
import { getPublishedServicesList } from '@/lib/next/publicServiceServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  const title = `Services | ${settings.website_name}`
  const description =
    settings.default_meta_description ||
    'Explore FlaireStack enterprise software, design, and digital growth services.'

  return buildPublicPageMetadataWithCanonical({
    seoRow: {
      meta_title: title,
      meta_description: description,
    },
    settings,
    pageTitle: 'Services',
    routePath: '/services',
    entityType: 'page',
    fallbackTitle: title,
    fallbackDescription: description,
  }).metadata
}

/**
 * Phase 17 — public Services listing (published CMS services only).
 * Vite has no equivalent index route; Home `#services` remains the Vite entry.
 */
export default async function PublicServicesPage() {
  const [services, settings] = await Promise.all([
    getPublishedServicesList(),
    getPublicSiteSettings(),
  ])

  const { canonical } = buildPublicPageMetadataWithCanonical({
    seoRow: null,
    settings,
    pageTitle: 'Services',
    routePath: '/services',
    entityType: 'page',
  })

  const jsonLd = resolvePublicJsonLd(null, settings)

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <PublicJsonLd data={jsonLd} />
      <ServicesListingView services={services} />
    </>
  )
}
