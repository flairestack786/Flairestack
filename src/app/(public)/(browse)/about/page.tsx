import type { Metadata } from 'next'
import AboutPageView from '@/components/next/public/about/AboutPageView'
import PublicJsonLd from '@/components/next/public/PublicJsonLd'
import {
  buildPublicPageMetadata,
  resolvePublicJsonLd,
} from '@/lib/next/buildPublicPageMetadata'
import { getPublicAboutPage } from '@/lib/next/publicAboutServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const [about, settings] = await Promise.all([
    getPublicAboutPage(),
    getPublicSiteSettings(),
  ])

  return buildPublicPageMetadata({
    seoRow: about.seo.row,
    settings,
    pageTitle: about.page.title || 'About',
    routePath: about.page.route_path || '/about',
    entityType: 'page',
    fallbackTitle: about.seo.metaTitle,
    fallbackDescription: about.seo.metaDescription,
  })
}

/**
 * Phase 18 — public About page (CMS `pages`/`page_sections` slug `about`).
 * Missing published page → fallback content (Vite parity; not notFound).
 */
export default async function PublicAboutPage() {
  const [about, settings] = await Promise.all([
    getPublicAboutPage(),
    getPublicSiteSettings(),
  ])
  const jsonLd = resolvePublicJsonLd(about.seo.row, settings)

  return (
    <>
      <PublicJsonLd data={jsonLd} />
      <AboutPageView about={about} />
    </>
  )
}
