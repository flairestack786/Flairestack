import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CareerDetailView from '@/components/next/public/careers/CareerDetailView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import { publicCareerPath } from '@/lib/contentSlug'
import { getActiveJobPostingBySlug } from '@/lib/next/publicCareersServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import { resolvePublicCanonicalUrl } from '@/lib/next/publicSiteUrl'
import '@/blog-careers.css'

export const revalidate = 60

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string }
}

async function resolveParams(params: PageProps['params']) {
  return await Promise.resolve(params)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params)
  const [job, settings] = await Promise.all([
    getActiveJobPostingBySlug(slug),
    getPublicSiteSettings(),
  ])
  if (!job) return { title: 'Role not found' }

  const path = publicCareerPath(job.slug)
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: path,
  })
  const title = `${job.title} | Careers at FlaireStack`
  const description = job.shortDescription || undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicCareerDetailPage({ params }: PageProps) {
  const { slug } = await resolveParams(params)
  const job = await getActiveJobPostingBySlug(slug)
  if (!job) notFound()

  const settings = await getPublicSiteSettings()
  const path = publicCareerPath(job.slug)
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: path,
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <CareerDetailView job={job} />
    </>
  )
}
