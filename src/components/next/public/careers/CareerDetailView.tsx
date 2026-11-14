'use client'

import Link from 'next/link'
import { publicCareerApplyPath } from '@/lib/contentSlug'
import {
  labelEmploymentType,
  labelWorkArrangement,
  type PublicJobDetail,
} from '@/lib/next/publicCareersServer'

export default function CareerDetailView({ job }: { job: PublicJobDetail }) {
  const applyHref = publicCareerApplyPath(job.slug)

  return (
    <article className="career-detail">
      <header className="career-detail-header">
        <Link href="/careers" className="blog-back-link">
          ← Back to Careers
        </Link>
        <p className="careers-eyebrow">{job.department || 'Open role'}</p>
        <h1 className="career-detail-title">{job.title}</h1>
        <p className="career-detail-meta">
          <span>{labelEmploymentType(job.employmentType)}</span>
          <span>{labelWorkArrangement(job.workArrangement)}</span>
          {job.location ? <span>{job.location}</span> : null}
        </p>
        {job.shortDescription ? (
          <p className="career-detail-lead">{job.shortDescription}</p>
        ) : null}
        <Link href={applyHref} className="careers-job-cta career-detail-apply">
          Apply now
        </Link>
      </header>

      {job.descriptionHtml ? (
        <section className="career-detail-section">
          <h2>About the role</h2>
          <div
            className="blog-article-prose"
            dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
          />
        </section>
      ) : null}

      {job.responsibilitiesHtml ? (
        <section className="career-detail-section">
          <h2>Responsibilities</h2>
          <div
            className="blog-article-prose"
            dangerouslySetInnerHTML={{ __html: job.responsibilitiesHtml }}
          />
        </section>
      ) : null}

      {job.qualificationsHtml ? (
        <section className="career-detail-section">
          <h2>Qualifications</h2>
          <div
            className="blog-article-prose"
            dangerouslySetInnerHTML={{ __html: job.qualificationsHtml }}
          />
        </section>
      ) : null}

      <section className="career-detail-section career-detail-apply-block">
        <h2>How to apply</h2>
        {job.applicationInstructions ? (
          <p className="career-detail-instructions">{job.applicationInstructions}</p>
        ) : (
          <p className="career-detail-instructions">
            Send your resume and a short note about why you are a fit for this role.
          </p>
        )}
        <Link href={applyHref} className="careers-job-cta">
          Apply now
        </Link>
      </section>
    </article>
  )
}
