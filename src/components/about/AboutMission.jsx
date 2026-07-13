import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'

export default function AboutMission() {
  const { sections } = useAboutPage()
  const mission = sections.mission

  return (
    <section className="about-page-mission" aria-labelledby="mission-heading">
      <div className="about-page-inner">
        <motion.article
          className="about-mission-panel"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="about-page-eyebrow">{mission.eyebrow}</p>
          <h2
            id="mission-heading"
            className="about-page-section-title about-page-section-title--light"
          >
            {mission.title}{' '}
            <span className="about-page-title-accent">{mission.titleAccent}</span>
          </h2>
          <p className="about-mission-text">{mission.body}</p>
        </motion.article>
      </div>
    </section>
  )
}
