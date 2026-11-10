import type { Metadata } from 'next'
import CareersLandingView from '@/components/next/public/careers/CareersLandingView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import { buildPublicPageMetadataWithCanonical } from '@/lib/next/buildPublicPageMetadata'
import { listActiveJobPostings } from '@/lib/next/publicCareersServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import '@/blog-careers.css'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  return buildPublicPageMetadataWithCanonical({
    seoRow: null,
    settings,
    pageTitle: 'Careers',
    routePath: '/careers',
    entityType: 'page',
    fallbackTitle: 'Careers | FlaireStack',
    fallbackDescription:
      'Explore open roles at FlaireStack and help build modern digital products and platforms.',
  }).metadata
}

export default async function PublicCareersPage() {
  const [jobs, settings] = await Promise.all([
    listActiveJobPostings(),
    getPublicSiteSettings(),
  ])

  const { canonical } = buildPublicPageMetadataWithCanonical({
    seoRow: null,
    settings,
    pageTitle: 'Careers',
    routePath: '/careers',
    entityType: 'page',
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <CareersLandingView jobs={jobs} />
    </>
  )
}
