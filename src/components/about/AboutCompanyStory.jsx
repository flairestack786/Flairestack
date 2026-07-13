import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'
import { aboutFadeUp } from './aboutMotion'

export default function AboutCompanyStory() {
  const { sections } = useAboutPage()
  const story = sections['company-story']

  return (
    <section className="about-section" aria-labelledby="about-story-heading">
      <div className="about-inner">
        <motion.header className="about-header" {...aboutFadeUp}>
          <p className="about-eyebrow">{story.eyebrow}</p>
          <h2 id="about-story-heading" className="about-title">
            {story.title} <span className="about-brand">{story.titleAccent}</span>
          </h2>
          <p className="about-intro">{story.body}</p>
        </motion.header>

        <div className="about-stats">
          {story.stats.map(({ value, label, description, Icon }, i) => (
            <motion.article
              key={`${label}-${i}`}
              className="about-card about-stat-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
            >
              <div className="about-card-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <p className="about-stat-value">{value}</p>
              <h3 className="about-stat-label">{label}</h3>
              <p className="about-stat-desc">{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
