import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'
import { aboutFadeUp } from './aboutMotion'

export default function AboutValues() {
  const { sections } = useAboutPage()
  const values = sections.values

  return (
    <section className="why-section about-page-values" aria-labelledby="values-heading">
      <div className="why-inner">
        <motion.header className="why-header" {...aboutFadeUp}>
          <p className="why-eyebrow">{values.eyebrow}</p>
          <h2 id="values-heading" className="why-title">
            {values.title} <span className="why-brand">{values.titleAccent}</span>
          </h2>
        </motion.header>

        <div className="why-grid">
          {values.items.map(({ title, text, Icon }, i) => (
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
              <p className="why-card-desc">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
