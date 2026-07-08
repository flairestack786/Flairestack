import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { services } from '../data/services'
import ServiceCard from './ServiceCard'
import { FloatingOrb } from './service/ServiceMotion'
import servicesStackImage from '../assets/logos/Flairestack_Service_Image.png'

export default function Services() {
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
            <p className="services-eyebrow">Our services</p>
            <h2 className="services-title">
              <span className="services-title-muted">Redefining</span>{' '}
              <span className="services-title-accent">digital impact</span>{' '}
              <span className="services-title-muted">across the globe.</span>
            </h2>

            <motion.figure
              className="services-visual"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={servicesStackImage}
                alt="FlaireStack service platform: code, AI, cloud, and analytics connected"
                loading="lazy"
              />
            </motion.figure>

            <p className="services-subtitle">
              From AI-native platforms to cloud infrastructure — we partner with ambitious teams
              to design, build, and scale products that feel cinematic, resilient, and ready for
              enterprise.
            </p>

            <div className="services-panel">
              <div className="services-panel-accent" aria-hidden />
              <p className="services-panel-label">Why FlaireStack</p>

              <div className="services-copy-stack">
                <p className="services-detail">
                  We embed expert product engineers, cloud architects, and AI specialists into your
                  roadmap to reduce delivery risk, accelerate release velocity, and improve platform
                  reliability at scale.
                </p>
                <p className="services-detail">
                  Whether you are launching a new product, modernizing legacy systems, or scaling AI
                  across operations, we work as an extension of your team — with transparent sprints,
                  senior ownership, and delivery tied to business outcomes.
                </p>

                <div className="services-divider" aria-hidden />

                <ul className="services-points" aria-label="Core service strengths">
                  <li>Enterprise-grade architecture and governance</li>
                  <li>Product-led UX with measurable conversion impact</li>
                  <li>Continuous delivery with quality and security by design</li>
                  <li>Cloud-native infrastructure, FinOps, and observability</li>
                  <li>AI integration, automation, and intelligent workflows</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              className="services-cta"
              onClick={() => {
                const el = document.querySelector('#contact')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Get in touch
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
