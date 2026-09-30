import React from 'react'
import { motion } from 'framer-motion'
import { aboutFadeUp } from './aboutMotion'
import { resolveLucideIcon } from '../../lib/lucideIcons'

/**
 * @param {{
 *   story: {
 *     eyebrow: string,
 *     title: string,
 *     titleAccent: string,
 *     body: string,
 *     stats: Array<{ value: string, label: string, description: string, iconName?: string, Icon?: import('react').ComponentType<any> }>
 *   }
 * }} props
 */
export default function AboutCompanyStory({ story }) {
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
          {story.stats.map(({ value, label, description, Icon, iconName }, i) => {
            const ResolvedIcon = Icon || resolveLucideIcon(iconName)
            return (
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
                  <ResolvedIcon size={20} strokeWidth={1.75} />
                </div>
                <p className="about-stat-value">{value}</p>
                <h3 className="about-stat-label">{label}</h3>
                <p className="about-stat-desc">{description}</p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
