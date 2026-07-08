import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  Heart,
  Settings,
  Layers,
  Target,
  Rocket,
} from 'lucide-react'
import TrustedBy from '../TrustedBy'
import {
  CinematicImage,
  fadeUp,
  FloatingOrb,
  staggerContainer,
} from './ServiceMotion'
import ServiceTestimonialsSlider from './ServiceTestimonialsSlider'
import CompanyStats from '../CompanyStats'
import {
  useHeroSlideshow,
  ServiceHeroBgCarousel,
} from './ServiceHeroCarousel'
import FrameworkSection from './FrameworkSection'
import './framework-section.css'
import IndustriesSection from './IndustriesSection'
import './industries-section.css'
import techIcons from '../../data/techIcons.json'

const growthIcons = [Sparkles, Heart, BarChart3, TrendingUp, Users, Settings]
const featureIcons = [Layers, Target, Zap, Rocket, Shield, BarChart3]

function FaqItem({ item, open, onToggle, light }) {
  return (
    <motion.div className={`sp-faq-item ${open ? 'is-open' : ''} ${light ? 'sp-faq-item--light' : ''}`} layout>
      <button type="button" className="sp-faq-trigger" onClick={onToggle}>
        <span>{item.q}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sp-faq-panel"
          >
            <p>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SectionBackground({ image, className = '' }) {
  if (!image?.src) return null
  return (
    <div className={`sp-section-bg ${className}`} aria-hidden>
      <img src={image.src} alt="" loading="lazy" className="sp-section-bg-img" />
      <div className="sp-section-bg-overlay" />
      <div className="sp-section-bg-grain hero-grain" />
    </div>
  )
}

function GridDecor({ light }) {
  return (
    <div className={`sp-grid-decor ${light ? 'sp-grid-decor--light' : ''}`} aria-hidden>
      <div className="sp-grid-decor-lines" />
      <div className="sp-grid-decor-glow" />
    </div>
  )
}

function SectionHeader({ label, title, intro, id, light, centered }) {
  return (
    <motion.div
      className={`sp-section-header ${light ? 'sp-section-header--light' : ''} ${centered ? 'sp-section-header--center' : ''}`.trim()}
      variants={fadeUp}
    >
      {label && <p className="service-section-label">{label}</p>}
      {id ? (
        <h2 id={id} className="sp-section-title">
          {title}
        </h2>
      ) : (
        <h2 className="sp-section-title">{title}</h2>
      )}
      {intro && <p className="sp-section-intro">{intro}</p>}
    </motion.div>
  )
}

function Band({ tone = 'dark', id, className = '', children, fullBleed = true }) {
  return (
    <section
      id={id}
      className={`sp-band sp-band--${tone} ${fullBleed ? 'sp-band--bleed' : ''} ${className}`.trim()}
    >
      <GridDecor light={tone === 'light'} />
      <div className="sp-band-inner">{children}</div>
    </section>
  )
}

function useScrollSpy(anchorNav) {
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    const els = anchorNav
      .map((item) => document.getElementById(item.id))
      .filter(Boolean)
    if (!els.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-35% 0px -55% 0px' }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [anchorNav])

  return activeId
}

export default function ServicePageLayout({ service, page }) {
  const [openFaq, setOpenFaq] = useState(0)
  const heroSlideshow = useHeroSlideshow(page.heroImages)
  const activeSection = useScrollSpy(page.anchorNav)

  return (
    <div className="sp-root" data-service={service.slug}>
      {/* ── Hero ── */}
      <header className="sp-hero sp-hero--bg sp-hero--premium">
        <div className="sp-hero-bg-glow" aria-hidden />
        <div className="sp-hero-bg-media" aria-hidden>
          <ServiceHeroBgCarousel slideshow={heroSlideshow} />
          <div className="sp-hero-bg-overlay" />
          <div className="sp-hero-bg-grain hero-grain" />
        </div>
        <div className="sp-hero-grid-overlay" aria-hidden />
        <FloatingOrb className="sp-hero-orb sp-hero-orb--1" delay={0} />
        <FloatingOrb className="sp-hero-orb sp-hero-orb--2" delay={2} />

        <div className="sp-hero-inner">
          <motion.div
            className="sp-hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to="/#services" className="service-back-link">
              <ArrowLeft size={16} aria-hidden />
              All Services
            </Link>
            <span className="sp-hero-badge">
              <Sparkles size={13} strokeWidth={2} aria-hidden />
              Enterprise-Grade Delivery
            </span>
            <h1 className="sp-hero-title">{page.heroHeadline}</h1>
            <p className="sp-hero-lead">{page.heroSubheadline}</p>
            <div className="sp-hero-actions">
              <Link to="/#contact" className="primary-cta sp-hero-cta">
                {page.heroCta}
                <span className="cta-arrow" aria-hidden>
                  →
                </span>
              </Link>
              <a href="#process" className="sp-hero-secondary-cta">
                {page.heroSecondaryCta ?? 'View Our Process'}
              </a>
            </div>
          </motion.div>

        </div>
      </header>

      {/* ── Anchor nav ── */}
      <nav className="sp-anchor-nav" aria-label="Page sections">
        <div className="sp-anchor-nav-inner">
          {page.anchorNav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`sp-anchor-link ${activeSection === item.id ? 'sp-anchor-link--active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <CompanyStats stats={service.stats} />

      {/* ── Challenges (dark) ── */}
      <Band tone="dark" id="challenges">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <SectionHeader title={page.challenges.title} intro={page.challenges.intro} />
          <div className="sp-challenges-grid">
            {page.challenges.items.map((item, i) => (
              <motion.article
                key={item.title}
                className="sp-challenge-card sp-card-premium glass"
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6 }}
              >
                <span className="sp-challenge-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </Band>

      {/* ── Framework (light) ── */}
      <Band tone="light" id="framework" className="sp-band--framework">
        <FrameworkSection
          title={page.framework.title}
          intro={page.framework.intro}
          items={page.framework.items}
        />
      </Band>

      {/* ── Features bento (dark) ── */}
      <Band tone="dark" id="features">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <SectionHeader title={page.features.title} intro={page.features.intro} />
          <div className="sp-bento sp-bento--premium">
            {page.features.items.map((item, i) => {
              const FIcon = featureIcons[i % featureIcons.length]
              const isWide = i === 0 || i === 3
              const indexLabel = String(i + 1).padStart(2, '0')
              return (
                <motion.article
                  key={item.title}
                  className={`sp-bento-card sp-bento-card--premium sp-bento-card--tone-${(i % 3) + 1} ${isWide ? 'sp-bento-card--wide' : ''}`}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                >
                  <span className="sp-bento-bg-num" aria-hidden>
                    {indexLabel}
                  </span>
                  <div className="sp-bento-card-glow" aria-hidden />
                  <div className="sp-bento-card-body">
                    <div className="sp-bento-card-top">
                      <div className="sp-bento-icon">
                        <FIcon size={20} strokeWidth={1.75} aria-hidden />
                      </div>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </motion.div>
      </Band>

      {/* ── Growth benefits (light) ── */}
      <Band tone="light" id="growth">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <SectionHeader light title={page.growth.title} intro={page.growth.intro} />
          <div className="sp-growth-grid">
            {page.growth.items.map((item, i) => {
              const GIcon = growthIcons[i % growthIcons.length]
              return (
                <motion.article
                  key={item.title}
                  className="sp-growth-card sp-card-premium sp-card-premium--light"
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -5 }}
                >
                  <div className="sp-growth-icon">
                    <GIcon size={20} aria-hidden />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </motion.article>
              )
            })}
          </div>
        </motion.div>
      </Band>

      {/* ── Logo marquee (dark) ── */}
      <Band tone="dark" className="sp-band--marquee">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <SectionHeader
            label="Industry inspiration"
            title="Built on Principles From the World's Top Tech Companies"
            intro="The methodologies, standards, and culture of technology's greatest leaders don't have to be reserved for Silicon Valley giants. We bring that same DNA to forward-thinking companies everywhere."
          />
          <div className="sp-marquee-wrap">
            <TrustedBy variant="brand" align="center" />
          </div>
        </motion.div>
      </Band>

      {/* ── Testimonials (light, optional bg) ── */}
      <Band
        tone="light"
        id="testimonials"
        className={page.testimonialsBackground ? 'sp-band--has-bg' : ''}
      >
        {page.testimonialsBackground && (
          <SectionBackground image={page.testimonialsBackground} className="sp-band-bg" />
        )}
        <motion.div
          className="sp-band-content-raised"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <SectionHeader
            light={!page.testimonialsBackground}
            title="What our clients say about us"
            intro="Our clients consistently commend our team for turning ideas into high-impact products — with technical excellence, reliability, and unwavering commitment to quality."
          />
          <ServiceTestimonialsSlider testimonials={page.testimonials} />
        </motion.div>
      </Band>

      {/* ── Process (light) ── */}
      <Band tone="light" id="process">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <div className="sp-process-top">
            <SectionHeader light title={page.process.title} intro={page.process.intro} />
            <CinematicImage
              src={page.process.image.src}
              alt={page.process.image.alt}
              className="sp-process-hero-img"
              imgClassName="sp-process-hero-img-el"
              aspect="21/9"
            />
          </div>
          <div className="sp-process-track" aria-hidden>
            <div className="sp-process-track-line" />
          </div>
          <div className="sp-process-timeline sp-process-timeline--premium">
            {page.process.steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="sp-process-step sp-process-step--premium"
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
              >
                <span className="sp-process-step-num">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Band>

      {/* ── Industries (dark) ── */}
      <Band tone="dark" id="industries" className="sp-band--industries">
        <IndustriesSection
          title={page.industries.title}
          intro={page.industries.intro}
          items={page.industries.items}
        />
      </Band>

      {/* ── Tech stack (light) — static markup so cards are never stuck at opacity: 0 */}
      <Band tone="light" id="tech" className="sp-band--tech">
        <SectionHeader light title={page.tech.title} intro={page.tech.intro} />
        {page.tech.items.length > 0 && (
          <div className="sp-tech-showcase">
            <div className="sp-tech-grid" role="list">
              {page.tech.items.map((tech, i) => (
                <div
                  key={tech}
                  className="sp-tech-card"
                  role="listitem"
                  style={{ '--sp-tech-i': i }}
                >
                  <span className="sp-tech-card-media" aria-hidden={!techIcons[tech]}>
                    {techIcons[tech] ? (
                      <img
                        src={`/icons/tech/${techIcons[tech]}`}
                        alt={`${tech} logo`}
                        className="sp-tech-card-icon"
                        loading="lazy"
                        width="44"
                        height="44"
                      />
                    ) : (
                      <span className="sp-tech-card-fallback">
                        {tech.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}
                      </span>
                    )}
                  </span>
                  <span className="sp-tech-card-name">{tech}</span>
                </div>
              ))}
            </div>
            <p className="sp-tech-stack-label sp-tech-stack-label--footer">
              {page.tech.items.length} tools &amp; platforms curated for this service
            </p>
          </div>
        )}
      </Band>

      {/* ── Post-launch (dark) ── */}
      <Band tone="dark">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
        >
          <SectionHeader title={page.postLaunch.title} intro={page.postLaunch.intro} centered />
          <div className="sp-postlaunch-grid">
            {page.postLaunch.items.map((item, i) => (
              <motion.article
                key={item.title}
                className="sp-postlaunch-card sp-card-premium glass"
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
              >
                <span className="sp-postlaunch-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </Band>

      {/* ── FAQ (light) ── */}
      <Band tone="light" id="faq">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <header className="sp-section-header sp-section-header--light sp-faq-header">
            <h2 className="sp-faq-title">
              Frequently Asked <span className="sp-faq-title-accent">Questions</span>
            </h2>
            <p className="sp-section-intro">
              Everything you need to know about working with FlaireStack.
            </p>
          </header>
          <div className="sp-faq-list sp-faq-list--light">
            {page.faqs.map((item, i) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                light
              />
            ))}
          </div>
        </motion.div>
      </Band>

      {/* ── Final CTA ── */}
      <motion.section
        className={`sp-final-cta sp-final-cta--premium ${page.finalCta.background ? 'sp-final-cta--has-bg' : ''}`}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
      >
        <SectionBackground image={page.finalCta.background} className="sp-final-cta-bg" />
        <div className="sp-final-cta-glow" aria-hidden />
        <div className="sp-final-cta-inner">
          <div className="sp-final-cta-copy">
            <p className="service-section-label">Let&apos;s build together</p>
            <h2>{page.finalCta.title}</h2>
            <p>{page.finalCta.subtitle}</p>
          </div>
          <Link to="/#contact" className="primary-cta">
            {page.finalCta.button}
            <span className="cta-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </motion.section>
    </div>
  )
}
