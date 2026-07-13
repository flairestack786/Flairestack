import React from 'react'
import { motion } from 'framer-motion'
import { useHomePage } from '../hooks/useHomePage'

export default function WhyChoose() {
  const { sections } = useHomePage()
  const content = sections['why-choose']

  return (
    <section id="why-choose" className="why-section" aria-labelledby="why-choose-heading">
      <div className="why-inner">
        <header className="why-header">
          <p className="why-eyebrow">{content.eyebrow}</p>
          <h2 id="why-choose-heading" className="why-title">
            {content.title} <span className="why-brand">{content.titleAccent}</span>
          </h2>
          <p className="why-intro">{content.intro}</p>
        </header>

        <div className="why-grid">
          {content.items.map(({ title, description, Icon }, i) => (
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
          ))}
        </div>
      </div>
    </section>
  )
}
