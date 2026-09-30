import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import NextServicePageView from '@/components/next/public/services/NextServicePageView'
import PublicJsonLd from '@/components/next/public/PublicJsonLd'
import {
  buildPublicPageMetadata,
  resolvePublicJsonLd,
} from '@/lib/next/buildPublicPageMetadata'
import {
  getPublicServicePage,
  getServicePageCompanyStats,
  getServicePageTestimonials,
} from '@/lib/next/publicServiceServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import { normalizeServiceSlug } from '@/lib/serviceSlug'

export const revalidate = 60

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string }
}

async function resolveParams(params: PageProps['params']) {
  return await Promise.resolve(params)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await resolveParams(params)
  const slug = normalizeServiceSlug(rawSlug)
  if (!slug) notFound()

  const [built, settings] = await Promise.all([
    getPublicServicePage(slug),
    getPublicSiteSettings(),
  ])

  if (!built) notFound()

  return buildPublicPageMetadata({
    seoRow: (built.seo?.row as Record<string, unknown> | null) ?? null,
    settings,
    pageTitle: String(built.service.title || 'Service'),
    routePath: `/services/${slug}`,
    entityType: 'service',
    fallbackTitle: String(built.seo?.metaTitle || built.service.seoTitle || ''),
    fallbackDescription: String(built.seo?.metaDescription || built.service.seoDescription || ''),
  })
}

/**
 * Phase 17 — public service detail. Unpublished / unknown slug → notFound().
 * (Vite redirects home; Next uses App Router notFound for public 404.)
 */
export default async function PublicServiceDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await resolveParams(params)
  const slug = normalizeServiceSlug(rawSlug)
  if (!slug) notFound()

  const [built, testimonials, companyStats, settings] = await Promise.all([
    getPublicServicePage(slug),
    getServicePageTestimonials(),
    getServicePageCompanyStats(),
    getPublicSiteSettings(),
  ])

  if (!built?.service || !built?.page) {
    notFound()
  }

  const jsonLd = resolvePublicJsonLd(
    (built.seo?.row as Record<string, unknown> | null) ?? null,
    settings
  )

  return (
    <>
      <PublicJsonLd data={jsonLd} />
      <NextServicePageView
        service={built.service as Record<string, unknown>}
        page={built.page as Record<string, unknown>}
        testimonials={testimonials}
        companyStats={companyStats}
      />
    </>
  )
}
