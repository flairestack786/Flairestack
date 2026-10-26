'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { publicServicePath } from '@/lib/serviceSlug'
import type { HomeServiceCard } from '@/lib/next/publicHomeServer'

const easeOut = [0.22, 1, 0.36, 1] as const

type ServicesHeaderContent = {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  body: string
  ctaLabel: string
  ctaUrl: string
}

type HomeServicesShowcaseProps = {
  services: HomeServiceCard[]
  header: ServicesHeaderContent
}

export default function HomeServicesShowcase({ services, header }: HomeServicesShowcaseProps) {
  const reduceMotion = useReducedMotion()

  const handleSectionCta = () => {
    if (header.ctaUrl.startsWith('#')) {
      document.querySelector(header.ctaUrl)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
      return
    }
    window.location.assign(header.ctaUrl)
  }

  return (
    <section
      id="services"
      className="services-section services-section--showcase"
      aria-labelledby="home-services-heading"
    >
      <div className="services-inner services-inner--showcase">
        <motion.header
          className="svc-showcase-header"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: easeOut }}
        >
          <p className="svc-showcase-eyebrow">{header.eyebrow}</p>
          <h2 id="home-services-heading" className="svc-showcase-title">
            <span className="svc-showcase-title-muted">{header.title}</span>{' '}
            <span className="svc-showcase-title-accent">{header.titleAccent}</span>{' '}
            <span className="svc-showcase-title-muted">{header.intro}</span>
          </h2>
          {header.body ? <p className="svc-showcase-lead">{header.body}</p> : null}
        </motion.header>

        <div className="svc-feature-list">
          {services.map((service, index) => {
            const href = publicServicePath(service.slug)
            const reverse = index % 2 === 1
            const highlights = Array.isArray(service.highlights) ? service.highlights.slice(0, 4) : []

            return (
              <motion.article
                key={service.id || service.slug}
                className={`svc-feature${reverse ? ' svc-feature--reverse' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-64px' }}
                transition={{
                  duration: reduceMotion ? 0 : 0.7,
                  delay: reduceMotion ? 0 : 0.04,
                  ease: easeOut,
                }}
              >
                <div className="svc-feature-media">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.imageAlt || service.title}
                      className="svc-feature-img"
                      loading="lazy"
                      decoding="async"
                      width={960}
                      height={640}
                    />
                  ) : (
                    <div className="svc-feature-media-fallback" aria-hidden />
                  )}
                </div>

                <div className="svc-feature-copy">
                  <h3 className="svc-feature-title">
                    <span className="svc-feature-title-lead">{service.title}</span>{' '}
                    <span className="svc-feature-title-accent">{service.accent}</span>
                  </h3>

                  {service.shortDescription ? (
                    <p className="svc-feature-desc">{service.shortDescription}</p>
                  ) : null}

                  {highlights.length > 0 ? (
                    <ul className="svc-feature-checks">
                      {highlights.map((item) => (
                        <li key={item}>
                          <span className="svc-feature-check-icon" aria-hidden>
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="svc-feature-actions">
                    <Link href={href} className="svc-feature-btn svc-feature-btn--primary">
                      <span className="svc-feature-btn-icon" aria-hidden>
                        <ArrowUpRight size={14} strokeWidth={2.25} />
                      </span>
                      {service.ctaLabel || 'Explore service'}
                    </Link>
                    <Link href="/#contact" className="svc-feature-btn svc-feature-btn--ghost">
                      <span className="svc-feature-btn-icon" aria-hidden>
                        <ArrowUpRight size={14} strokeWidth={2.25} />
                      </span>
                      Talk to us
                    </Link>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>

        {header.ctaLabel ? (
          <motion.div
            className="svc-showcase-footer"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: easeOut }}
          >
            <button type="button" className="svc-showcase-section-cta" onClick={handleSectionCta}>
              {header.ctaLabel}
              <ArrowRight size={18} aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}
