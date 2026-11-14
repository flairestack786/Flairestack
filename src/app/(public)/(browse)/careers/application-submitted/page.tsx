import type { Metadata } from 'next'
import Link from 'next/link'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import { publicCareerPath } from '@/lib/contentSlug'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import { resolvePublicCanonicalUrl } from '@/lib/next/publicSiteUrl'
import '@/blog-careers.css'

export const metadata: Metadata = {
  title: 'Application Submitted | FlaireStack Careers',
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<
    string,
    string | string[] | undefined
  >
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

export default async function ApplicationSubmittedPage({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams || {})
  const jobTitle = firstParam(params.job) || 'the open role'
  const jobSlug = firstParam(params.slug)
  const settings = await getPublicSiteSettings()
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: '/careers/application-submitted',
    cmsCanonicalUrl: null,
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <div className="career-detail job-apply-success">
        <p className="careers-eyebrow">Application received</p>
        <h1 className="career-detail-title">Thank you — your application was submitted</h1>
        <p className="career-detail-lead">
          We received your application for <strong>{jobTitle}</strong>, including your resume.
          Please check your email for a confirmation message from the FlaireStack hiring team.
        </p>
        <div className="job-apply-actions">
          {jobSlug ? (
            <Link href={publicCareerPath(jobSlug)} className="blog-back-link">
              ← Back to role
            </Link>
          ) : null}
          <Link href="/careers" className="careers-job-cta">
            View open roles
          </Link>
        </div>
      </div>
    </>
  )
}
