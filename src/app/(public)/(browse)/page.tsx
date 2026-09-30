import type { Metadata } from 'next'
import HomeHashScroller from '@/components/next/public/home/HomeHashScroller'
import HomePageView from '@/components/next/public/home/HomePageView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import PublicJsonLd from '@/components/next/public/PublicJsonLd'
import {
  buildPublicPageMetadataWithCanonical,
  resolvePublicJsonLd,
} from '@/lib/next/buildPublicPageMetadata'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import {
  getHomeServiceCards,
  getHomeTestimonials,
  getPublicHomePage,
} from '@/lib/next/publicHomeServer'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [home, settings] = await Promise.all([getPublicHomePage(), getPublicSiteSettings()])

  return buildPublicPageMetadataWithCanonical({
    seoRow: home.seo.row,
    settings,
    pageTitle: home.page.title || 'Home',
    routePath: home.page.route_path || '/',
    entityType: 'page',
    fallbackTitle: home.seo.metaTitle,
    fallbackDescription: home.seo.metaDescription,
  }).metadata
}

/**
 * Phase 16 — real public Home page (CMS `pages`/`page_sections` + published services/testimonials).
 * Renders inside Phase 15 `(public)` shell. Navbar/Footer come from the layout.
 */
export default async function PublicHomePage() {
  const [home, services, testimonials, settings] = await Promise.all([
    getPublicHomePage(),
    getHomeServiceCards(),
    getHomeTestimonials(),
    getPublicSiteSettings(),
  ])

  const { canonical } = buildPublicPageMetadataWithCanonical({
    seoRow: home.seo.row,
    settings,
    pageTitle: home.page.title || 'Home',
    routePath: home.page.route_path || '/',
    entityType: 'page',
    fallbackTitle: home.seo.metaTitle,
    fallbackDescription: home.seo.metaDescription,
  })

  const jsonLd = resolvePublicJsonLd(home.seo.row, settings)

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <PublicJsonLd data={jsonLd} />
      <HomeHashScroller />
      <HomePageView home={home} services={services} testimonials={testimonials} />
    </>
  )
}
