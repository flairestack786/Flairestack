import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JobApplicationForm from '@/components/next/public/careers/JobApplicationForm'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import { publicCareerApplyPath, publicCareerPath } from '@/lib/contentSlug'
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
  const job = await getActiveJobPostingBySlug(slug)
  if (!job) return { title: 'Apply | FlaireStack Careers', robots: { index: false, follow: false } }

  return {
    title: `Apply — ${job.title} | FlaireStack Careers`,
    description: `Submit your application for ${job.title} at FlaireStack.`,
    robots: { index: false, follow: false },
  }
}

export default async function CareerApplyPage({ params }: PageProps) {
  const { slug } = await resolveParams(params)
  const [job, settings] = await Promise.all([
    getActiveJobPostingBySlug(slug),
    getPublicSiteSettings(),
  ])
  if (!job) notFound()

  const path = publicCareerApplyPath(job.slug)
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: path,
    cmsCanonicalUrl: null,
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <div className="career-detail job-apply-page">
        <header className="career-detail-header">
          <Link href={publicCareerPath(job.slug)} className="blog-back-link">
            ← Back to {job.title}
          </Link>
          <p className="careers-eyebrow">{job.department || 'Open role'}</p>
          <h1 className="career-detail-title">Apply for {job.title}</h1>
          <p className="career-detail-lead">
            Complete the form below to submit your application and resume for this position.
          </p>
        </header>
        <JobApplicationForm
          job={{
            id: job.id,
            title: job.title,
            slug: job.slug,
            department: job.department,
          }}
        />
      </div>
    </>
  )
}
