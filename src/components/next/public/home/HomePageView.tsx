'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { resolveLucideIcon } from '@/lib/lucideIcons'
import { technologiesRowA, technologiesRowB } from '@/data/technologies'
import HomeHeroSlideshow from '@/components/public/HomeHeroSlideshow'
import { AnimatedCounter, fadeUp, staggerContainer } from '@/components/service/ServiceMotion'
import heroJpg from '@/assets/hero-4k.jpg'
import heroWebp from '@/assets/hero-4k.webp'
import HomeInquiryForm from './HomeInquiryForm'
import HomeProcessSection from './HomeProcessSection'
import HomeServicesShowcase from './HomeServicesShowcase'
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
  const { sections, heroSlides } = home
  const servicesContent = sections.services as {
    eyebrow: string
    title: string
    titleAccent: string
    intro: string
    body: string
    ctaLabel: string
    ctaUrl: string
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

  const bundledJpg = typeof heroJpg === 'string' ? heroJpg : heroJpg.src
  const bundledWebp = typeof heroWebp === 'string' ? heroWebp : heroWebp.src ?? heroWebp

  return (
    <main>
      <HomeHeroSlideshow
        slides={heroSlides}
        bundledImageSrc={bundledJpg}
        bundledWebpSrc={bundledWebp}
      />

      <HomeServicesShowcase
        services={services}
        header={{
          eyebrow: servicesContent.eyebrow,
          title: servicesContent.title,
          titleAccent: servicesContent.titleAccent,
          intro: servicesContent.intro,
          body: servicesContent.body,
          ctaLabel: servicesContent.ctaLabel,
          ctaUrl: servicesContent.ctaUrl,
        }}
      />

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

      <HomeProcessSection
        eyebrow={process.eyebrow}
        title={process.title}
        titleAccent={process.titleAccent}
        intro={process.intro}
        steps={process.steps}
      />

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
              <HomeInquiryForm serviceOptions={contact.serviceOptions} />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
