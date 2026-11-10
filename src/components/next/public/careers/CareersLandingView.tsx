'use client'

import Link from 'next/link'
import { publicCareerPath } from '@/lib/contentSlug'
import {
  labelEmploymentType,
  labelWorkArrangement,
  type PublicJobCard,
} from '@/lib/next/publicCareersServer'

const CULTURE = [
  {
    title: 'Build with intention',
    text: 'Ship production systems with clear ownership, thoughtful architecture, and measurable outcomes.',
  },
  {
    title: 'Partner with clients',
    text: 'Work closely with ambitious teams solving real product and platform problems.',
  },
  {
    title: 'Grow your craft',
    text: 'Collaborate across design, engineering, and strategy with room to stretch and lead.',
  },
]

export default function CareersLandingView({ jobs }: { jobs: PublicJobCard[] }) {
  return (
    <div className="careers-page">
      <section className="careers-hero">
        <p className="careers-eyebrow">Careers</p>
        <h1 className="careers-hero-title">
          Build the future with <span className="text-accent">FlaireStack</span>
        </h1>
        <p className="careers-hero-lead">
          We help companies design, engineer, and scale digital products. If you care about craft,
          clarity, and shipping work that lasts — you will feel at home here.
        </p>
      </section>

      <section className="careers-culture" aria-labelledby="careers-culture-heading">
        <div className="careers-section-copy">
          <h2 id="careers-culture-heading">Why FlaireStack</h2>
          <p>
            A modern technology studio where engineers, designers, and strategists collaborate on
            high-impact delivery — without the noise of a generic agency template.
          </p>
        </div>
        <div className="careers-culture-grid">
          {CULTURE.map((item) => (
            <article key={item.title} className="careers-culture-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="careers-openings" aria-labelledby="careers-openings-heading">
        <div className="careers-section-copy">
          <h2 id="careers-openings-heading">Open positions</h2>
          <p>Explore current roles across engineering, product, and delivery.</p>
        </div>

        {jobs.length === 0 ? (
          <div className="careers-empty">
            <h3>No open positions right now</h3>
            <p>
              We are not actively hiring for public roles at the moment. Check back soon, or reach
              out through Contact if you would like to introduce yourself.
            </p>
            <Link href="/#contact" className="careers-empty-cta">
              Contact FlaireStack
            </Link>
          </div>
        ) : (
          <div className="careers-job-list">
            {jobs.map((job) => (
              <article key={job.id} className="careers-job-card">
                <div className="careers-job-copy">
                  <p className="careers-job-department">{job.department || 'General'}</p>
                  <h3 className="careers-job-title">
                    <Link href={publicCareerPath(job.slug)}>{job.title}</Link>
                  </h3>
                  <p className="careers-job-meta">
                    <span>{labelEmploymentType(job.employmentType)}</span>
                    <span>{labelWorkArrangement(job.workArrangement)}</span>
                    {job.location ? <span>{job.location}</span> : null}
                  </p>
                  {job.shortDescription ? (
                    <p className="careers-job-desc">{job.shortDescription}</p>
                  ) : null}
                </div>
                <div className="careers-job-actions">
                  <Link href={publicCareerPath(job.slug)} className="careers-job-cta">
                    View position
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
