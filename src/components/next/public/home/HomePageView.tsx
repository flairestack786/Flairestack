'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Calendar, Star } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { resolveLucideIcon } from '@/lib/lucideIcons'
import { publicServicePath } from '@/lib/serviceSlug'
import { technologiesRowA, technologiesRowB } from '@/data/technologies'
import TrustedBy from '@/components/TrustedBy'
import { AnimatedCounter, fadeUp, FloatingOrb, staggerContainer } from '@/components/service/ServiceMotion'
import heroJpg from '@/assets/hero-4k.jpg'
import heroWebp from '@/assets/hero-4k.webp'
import servicesStackImage from '@/assets/logos/FlaireStack_Service_Image.png'
import HomeInquiryForm from './HomeInquiryForm'
import type {
  HomeServiceCard,
  HomeTestimonial,
  SerializableHomePage,
} from '@/lib/next/publicHomeServer'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

const techIconLookup = new Map(
  [...technologiesRowA, ...technologiesRowB].map(({ name, Icon, color }) => [
    name,
    { Icon, color },
  ])
)

function buildMarqueeTrack<T>(items: T[]) {
  let sequence = [...items]
  while (sequence.length < 32) {
    sequence = [...sequence, ...items]
  }
  return [...sequence, ...sequence]
}

type HomePageViewProps = {
  home: SerializableHomePage
  services: HomeServiceCard[]
  testimonials: HomeTestimonial[]
}

export default function HomePageView({ home, services, testimonials }: HomePageViewProps) {
  const { sections } = home
  const hero = sections.hero as {
    title: string
    titleAccent: string
    intro: string
    body: string
    ctaLabel: string
    ctaUrl: string
    backgroundImageUrl: string | null
    useBundledBackground: boolean
  }
  const servicesContent = sections.services as {
    eyebrow: string
    title: string
    titleAccent: string
    intro: string
    body: string
    ctaLabel: string
    ctaUrl: string
    panelLabel: string
    visualAlt: string
    visualImageUrl: string | null
    useBundledVisual: boolean
    details: string[]
    points: string[]
  }
  const why = sections['why-choose']
  const process = sections.process
  const tech = sections.technologies
  const contact = sections.contact
  const stats = sections.stats.stats

  const techRowA = useMemo(
    () =>
      tech.rowA.map((item) => {
        const match = techIconLookup.get(item.name)
        return {
          name: item.name,
          color: item.color ?? match?.color,
          Icon: match?.Icon ?? technologiesRowA[0].Icon,
        }
      }),
    [tech.rowA]
  )
  const techRowB = useMemo(
    () =>
      tech.rowB.map((item) => {
        const match = techIconLookup.get(item.name)
        return {
          name: item.name,
          color: item.color ?? match?.color,
          Icon: match?.Icon ?? technologiesRowB[0].Icon,
        }
      }),
    [tech.rowB]
  )

  const handleServicesCta = () => {
    if (servicesContent.ctaUrl.startsWith('#')) {
      document.querySelector(servicesContent.ctaUrl)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      return
    }
    window.location.assign(servicesContent.ctaUrl)
  }

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <picture className="hero-media" aria-hidden>
          {hero.useBundledBackground ? (
            <>
              <source srcSet={heroWebp.src ?? heroWebp} type="image/webp" />
              <img
                src={typeof heroJpg === 'string' ? heroJpg : heroJpg.src}
                alt=""
                className="hero-bg-img"
                decoding="async"
                fetchPriority="high"
                sizes="100vw"
              />
            </>
          ) : (
            <img
              src={hero.backgroundImageUrl ?? undefined}
              alt=""
              className="hero-bg-img"
              decoding="async"
              fetchPriority="high"
              sizes="100vw"
            />
          )}
        </picture>
        <div className="absolute inset-0 hero-overlay" aria-hidden />
        <div className="absolute inset-0 hero-vignette" aria-hidden />
        <div className="absolute inset-0 hero-grain" aria-hidden />
        <div className="hero-inner">
          <div className="hero-content">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="hero-title text-white"
            >
              {hero.title}
              <br />
              <span className="text-accent">{hero.titleAccent}</span>
              <br />
              {hero.intro}
            </motion.h1>
            <div className="hero-rule" aria-hidden />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="hero-subtext"
            >
              {hero.body}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="hero-actions"
            >
              <a href={hero.ctaUrl} className="hero-btn-secondary">
                <Calendar size={16} strokeWidth={1.75} />
                {hero.ctaLabel}
              </a>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.24 }}
              className="hero-trusted"
            >
              <TrustedBy />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
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
              <p className="services-eyebrow">{servicesContent.eyebrow}</p>
              <h2 className="services-title">
                <span className="services-title-muted">{servicesContent.title}</span>{' '}
                <span className="services-title-accent">{servicesContent.titleAccent}</span>{' '}
                <span className="services-title-muted">{servicesContent.intro}</span>
              </h2>
              <motion.figure
                className="services-visual"
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={
                    servicesContent.useBundledVisual
                      ? typeof servicesStackImage === 'string'
                        ? servicesStackImage
                        : servicesStackImage.src
                      : servicesContent.visualImageUrl ?? undefined
                  }
                  alt={servicesContent.visualAlt}
                  loading="lazy"
                />
              </motion.figure>
              <p className="services-subtitle">{servicesContent.body}</p>
              <div className="services-panel">
                <div className="services-panel-accent" aria-hidden />
                <p className="services-panel-label">{servicesContent.panelLabel}</p>
                <div className="services-copy-stack">
                  {servicesContent.details.map((detail) => (
                    <p key={detail} className="services-detail">
                      {detail}
                    </p>
                  ))}
                  <div className="services-divider" aria-hidden />
                  <ul className="services-points" aria-label="Core service strengths">
                    {servicesContent.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button type="button" className="services-cta" onClick={handleServicesCta}>
                {servicesContent.ctaLabel}
                <ArrowRight size={18} aria-hidden />
              </button>
            </motion.header>
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
                      <h3 className="service-card-title">{service.title}</h3>
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
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section id="why-choose" className="why-section" aria-labelledby="why-choose-heading">
        <div className="why-inner">
          <header className="why-header">
            <p className="why-eyebrow">{why.eyebrow}</p>
            <h2 id="why-choose-heading" className="why-title">
              {why.title} <span className="why-brand">{why.titleAccent}</span>
            </h2>
            <p className="why-intro">{why.intro}</p>
          </header>
          <div className="why-grid">
            {why.items.map(({ title, description, iconName }, i) => {
              const Icon = resolveLucideIcon(iconName)
              return (
                <motion.article
                  key={`${title}-${i}`}
                  className="why-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5 }}
                >
                  <div className="why-card-icon" aria-hidden>
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="why-card-title">{title}</h3>
                  <p className="why-card-desc">{description}</p>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="sp-band sp-band--light sp-band--bleed sp-band--stats" aria-label="Company metrics">
        <div className="sp-grid-decor sp-grid-decor--light" aria-hidden>
          <div className="sp-grid-decor-lines" />
          <div className="sp-grid-decor-glow" />
        </div>
        <div className="sp-band-inner">
          <motion.div
            className="sp-stats sp-stats--premium"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} className="sp-stat sp-stat--premium" variants={fadeUp} custom={i}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section" aria-labelledby="testimonials-heading">
        <div className="testimonials-glow" aria-hidden />
        <div className="testimonials-inner">
          <header className="testimonials-header">
            <h2 id="testimonials-heading" className="testimonials-title">
              Our clients simply love <span className="testimonials-accent">what we do</span>
            </h2>
            <p className="testimonials-intro">
              Proud to serve as the innovation partner for industry leaders who have experienced our
              expertise and excellence firsthand.
            </p>
            <div className="testimonials-trust">
              <div className="testimonials-badge testimonials-badge--clutch">
                <span className="testimonials-badge-mark testimonials-badge-mark--clutch" aria-hidden>
                  C
                </span>
                <div className="testimonials-badge-stars" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="testimonials-badge-count">52 REVIEWS</span>
              </div>
              <div className="testimonials-badge testimonials-badge--goodfirms">
                <span
                  className="testimonials-badge-mark testimonials-badge-mark--goodfirms"
                  aria-hidden
                >
                  G
                </span>
                <div className="testimonials-badge-stars" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="testimonials-badge-count">32 REVIEWS</span>
              </div>
            </div>
          </header>
          <div className="testimonials-slider-wrap">
            {testimonials.length > 0 && (
              <Swiper
                className="testimonials-swiper"
                modules={[Autoplay, EffectFade, Pagination]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                loop={testimonials.length > 1}
                speed={700}
                slidesPerView={1}
                autoplay={{
                  delay: 5500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{ clickable: true, dynamicBullets: false }}
                a11y={{
                  prevSlideMessage: 'Previous testimonial',
                  nextSlideMessage: 'Next testimonial',
                }}
              >
                {testimonials.map((item) => (
                  <SwiperSlide key={item.id}>
                    <article className="testimonial-card">
                      <p className="testimonial-quote">&ldquo;{item.quote}&rdquo;</p>
                      <footer className="testimonial-footer">
                        <div className="testimonial-avatar" aria-hidden>
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt="" className="testimonial-avatar-img" />
                          ) : (
                            item.initials
                          )}
                        </div>
                        <div className="testimonial-meta">
                          <cite className="testimonial-author">{item.author}</cite>
                          <span className="testimonial-role">{item.role}</span>
                        </div>
                      </footer>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="process-section" aria-labelledby="process-heading">
        <div className="process-inner">
          <header className="process-header">
            <p className="process-eyebrow">{process.eyebrow}</p>
            <h2 id="process-heading" className="process-title">
              {process.title} <span className="process-accent">{process.titleAccent}</span>
            </h2>
            <p className="process-intro">{process.intro}</p>
          </header>
          <div className="process-track" aria-hidden>
            <div className="process-track-line" />
          </div>
          <ol className="process-grid">
            {process.steps.map((item, i) => {
              const Icon = resolveLucideIcon(process.iconNames[i] ?? process.iconNames[0])
              return (
                <motion.li
                  key={item.step}
                  className="process-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="process-card-top">
                    <span className="process-step-num">{item.step}</span>
                    <span className="process-step-icon" aria-hidden>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                  </div>
                  <h3 className="process-card-title">{item.title}</h3>
                  <p className="process-card-text">{item.text}</p>
                  {i < process.steps.length - 1 && (
                    <span className="process-card-connector" aria-hidden />
                  )}
                </motion.li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Technologies */}
      <section id="technologies" className="tech-section" aria-labelledby="technologies-heading">
        <div className="tech-inner">
          <header className="tech-header">
            <p className="tech-eyebrow">{tech.eyebrow}</p>
            <h2 id="technologies-heading" className="tech-title">
              {tech.title} <span className="tech-accent">{tech.titleAccent}</span>
            </h2>
            <p className="tech-intro">{tech.intro}</p>
          </header>
          <div className="tech-marquees">
            {[
              { items: techRowA, reverse: false, duration: '50s' },
              { items: techRowB, reverse: true, duration: '55s' },
            ].map((row) => {
              const track = buildMarqueeTrack(row.items)
              const labeledCount = track.length / 2
              return (
                <div
                  key={row.duration}
                  className={`tech-marquee-row ${row.reverse ? 'tech-marquee-row--reverse' : ''}`}
                >
                  <div className="tech-marquee-viewport">
                    <div className="tech-marquee-track" style={{ animationDuration: row.duration }}>
                      {track.map((t, i) => {
                        const Icon = t.Icon
                        return (
                          <span
                            key={`${t.name}-${i}`}
                            className="tech-marquee-tile"
                            title={t.name}
                            aria-label={i < labeledCount ? t.name : undefined}
                            aria-hidden={i >= labeledCount}
                          >
                            <Icon color={t.color} aria-hidden />
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="inquiry-section" aria-labelledby="inquiry-heading">
        <div className="inquiry-ambient inquiry-ambient--left" aria-hidden />
        <div className="inquiry-ambient inquiry-ambient--right" aria-hidden />
        <div className="inquiry-grain hero-grain" aria-hidden />
        <div className="inquiry-inner">
          <div className="inquiry-layout">
            <motion.div
              className="inquiry-copy"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="inquiry-eyebrow">{contact.eyebrow}</p>
              <h2 id="inquiry-heading" className="inquiry-title">
                {contact.title} <span className="inquiry-accent">{contact.titleAccent}</span>
              </h2>
              <p className="inquiry-lead">{contact.body}</p>
              <ul className="inquiry-capabilities">
                {contact.capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <ul className="inquiry-trust">
                {contact.trustItems.map(({ iconName, text }) => {
                  const Icon = resolveLucideIcon(iconName)
                  return (
                    <li key={text}>
                      <span className="inquiry-trust-icon" aria-hidden>
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      {text}
                    </li>
                  )
                })}
              </ul>
            </motion.div>
            <motion.div
              className="inquiry-form-wrap"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <HomeInquiryForm />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
