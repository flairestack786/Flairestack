import React from 'react'
import { motion } from 'framer-motion'
import { useHomePage } from '../hooks/useHomePage'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
}

export default function Process() {
  const { sections } = useHomePage()
  const content = sections.process

  return (
    <section id="process" className="process-section" aria-labelledby="process-heading">
      <div className="process-inner">
        <header className="process-header">
          <p className="process-eyebrow">{content.eyebrow}</p>
          <h2 id="process-heading" className="process-title">
            {content.title} <span className="process-accent">{content.titleAccent}</span>
          </h2>
          <p className="process-intro">{content.intro}</p>
        </header>

        <div className="process-track" aria-hidden>
          <div className="process-track-line" />
        </div>

        <ol className="process-grid">
          {content.steps.map((item, i) => {
            const Icon = content.icons[i] ?? content.icons[0]
            return (
              <motion.li
                key={item.step}
                className="process-card"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
              >
                <div className="process-card-top">
                  <span className="process-step-num">{item.step}</span>
                  <span className="process-step-icon" aria-hidden>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="process-card-title">{item.title}</h3>
                <p className="process-card-text">{item.text}</p>
                {i < content.steps.length - 1 && (
                  <span className="process-card-connector" aria-hidden />
                )}
              </motion.li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
