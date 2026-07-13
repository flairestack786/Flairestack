import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'
import { aboutFadeUp } from './aboutMotion'

export default function AboutTeam() {
  const { sections } = useAboutPage()
  const team = sections.team

  return (
    <section className="about-page-founders" aria-labelledby="founders-heading">
      <div className="about-page-inner">
        <motion.header className="about-page-section-head" {...aboutFadeUp}>
          <p className="about-page-eyebrow">{team.eyebrow}</p>
          <h2 id="founders-heading" className="about-page-section-title">
            {team.title} <span className="about-page-title-accent">{team.titleAccent}</span>
          </h2>
        </motion.header>

        <div className="about-founders-grid">
          {team.members.map((founder, i) => (
            <motion.article
              key={founder.id}
              className="about-founder-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
            >
              <div className="about-founder-photo-wrap">
                <img
                  src={founder.imageUrl}
                  alt={founder.imageAlt}
                  className="about-founder-photo"
                  style={{ objectPosition: founder.imagePosition }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : undefined}
                />
                <div className="about-founder-photo-shine" aria-hidden />
              </div>
              <div className="about-founder-body">
                <h3 className="about-founder-name">{founder.name}</h3>
                <p className="about-founder-title">{founder.title}</p>
                <p className="about-founder-bio">{founder.bio}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
