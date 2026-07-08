import React from 'react'
import { motion } from 'framer-motion'
import { Search, Compass, Palette, Code2, FlaskConical, Rocket } from 'lucide-react'
import { homeProcessSteps } from '../data/homeProcessSteps'

const icons = [Search, Compass, Palette, Code2, FlaskConical, Rocket]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
}

export default function Process() {
  return (
    <section id="process" className="process-section" aria-labelledby="process-heading">
      <div className="process-inner">
        <header className="process-header">
          <p className="process-eyebrow">How we deliver</p>
          <h2 id="process-heading" className="process-title">
            Our <span className="process-accent">Process</span>
          </h2>
          <p className="process-intro">
            A proven six-step framework that keeps projects transparent, on schedule, and built for
            long-term success — from first workshop to production scale.
          </p>
        </header>

        <div className="process-track" aria-hidden>
          <div className="process-track-line" />
        </div>

        <ol className="process-grid">
          {homeProcessSteps.map((item, i) => {
            const Icon = icons[i]
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
                {i < homeProcessSteps.length - 1 && (
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
