'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
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

        <div className="svc-showcase-grid">
          {services.map((service, index) => {
            const stagger = reduceMotion ? 0 : (index % 2) * 0.08 + Math.floor(index / 2) * 0.04
            const href = publicServicePath(service.slug)

            return (
              <motion.article
                key={service.id || service.slug}
                className="svc-showcase-card"
                initial={reduceMotion ? false : { opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-48px' }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                  delay: stagger,
                  ease: easeOut,
                }}
              >
                <Link href={href} className="svc-showcase-link">
                  <div className="svc-showcase-media">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.imageAlt || service.title}
                        className="svc-showcase-img"
                        loading="lazy"
                        decoding="async"
                        width={960}
                        height={600}
                      />
                    ) : (
                      <div className="svc-showcase-media-fallback" aria-hidden />
                    )}
                    <div className="svc-showcase-media-shade" aria-hidden />
                  </div>
                  <div className="svc-showcase-body">
                    <h3 className="svc-showcase-card-title">{service.title}</h3>
                    {service.shortDescription ? (
                      <p className="svc-showcase-card-desc">{service.shortDescription}</p>
                    ) : null}
                    <span className="svc-showcase-cta">
                      Explore Service
                      <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
                    </span>
                  </div>
                </Link>
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
