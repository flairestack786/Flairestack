'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { publicServicePath } from '@/lib/serviceSlug'
import type { PublicServiceListItem } from '@/lib/next/publicServiceServer'

type Props = {
  services: PublicServiceListItem[]
}

/**
 * Public `/services` listing — same card language as Home services grid.
 */
export default function ServicesListingView({ services }: Props) {
  return (
    <main className="services-listing-page">
      <section className="services-section services-section--listing" aria-labelledby="services-listing-heading">
        <div className="services-inner">
          <header className="services-copy">
            <p className="services-eyebrow">What we deliver</p>
            <h1 id="services-listing-heading" className="services-title">
              <span className="services-title-muted">Our</span>{' '}
              <span className="services-title-accent">Services</span>
            </h1>
            <p className="services-subtitle">
              Enterprise software, design, and growth capabilities — each engagement mapped to
              measurable outcomes.
            </p>
          </header>

          {services.length === 0 ? (
            <p className="services-empty" role="status">
              No published services are available right now. Please check back soon.
            </p>
          ) : (
            <div className="services-grid">
              {services.map((service, index) => (
                <motion.article
                  key={service.id || service.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="service-card group"
                >
                  <Link href={publicServicePath(service.slug)} className="service-card-link">
                    <div className="service-card-inner service-card-inner--grid">
                      <h2 className="service-card-title">{service.title}</h2>
                      <p className="service-card-desc">{service.shortDescription}</p>
                      <span className="service-card-cta">
                        Learn more
                        <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
