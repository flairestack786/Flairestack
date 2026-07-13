import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useHomePage } from '../hooks/useHomePage'
import { usePublishedServices } from '../hooks/usePublishedServices'
import ServiceCard from './ServiceCard'
import { FloatingOrb } from './service/ServiceMotion'
import servicesStackImage from '../assets/logos/Flairestack_Service_Image.png'

export default function Services() {
  const { sections } = useHomePage()
  const { services } = usePublishedServices()
  const content = sections.services

  const handleCtaClick = () => {
    if (content.ctaUrl.startsWith('#')) {
      const el = document.querySelector(content.ctaUrl)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    window.location.assign(content.ctaUrl)
  }

  return (
    <section id="services" className="services-section">
      <FloatingOrb className="services-orb services-orb--1" delay={0} />
      <FloatingOrb className="services-orb services-orb--2" delay={2} />
      <motion.div
        className="services-ambient"
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
      />
      <motion.div className="services-ambient services-ambient--secondary" aria-hidden />
      <div className="absolute inset-0 hero-grain pointer-events-none" aria-hidden />

      <div className="services-inner">
        <div className="services-layout">
          <motion.header
            className="services-header"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="services-eyebrow">{content.eyebrow}</p>
            <h2 className="services-title">
              <span className="services-title-muted">{content.title}</span>{' '}
              <span className="services-title-accent">{content.titleAccent}</span>{' '}
              <span className="services-title-muted">{content.intro}</span>
            </h2>

            <motion.figure
              className="services-visual"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={content.useBundledVisual ? servicesStackImage : content.visualImageUrl}
                alt={content.visualAlt}
                loading="lazy"
              />
            </motion.figure>

            <p className="services-subtitle">{content.body}</p>

            <div className="services-panel">
              <div className="services-panel-accent" aria-hidden />
              <p className="services-panel-label">{content.panelLabel}</p>

              <div className="services-copy-stack">
                {content.details.map((detail) => (
                  <p key={detail} className="services-detail">
                    {detail}
                  </p>
                ))}

                <div className="services-divider" aria-hidden />

                <ul className="services-points" aria-label="Core service strengths">
                  {content.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button type="button" className="services-cta" onClick={handleCtaClick}>
              {content.ctaLabel}
              <ArrowRight size={18} aria-hidden />
            </button>
          </motion.header>

          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard key={service.slug} service={service} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
