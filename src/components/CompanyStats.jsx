import React from 'react'
import { motion } from 'framer-motion'
import { companyStats } from '../data/companyStats'
import { AnimatedCounter, fadeUp, staggerContainer } from './service/ServiceMotion'

function GridDecor() {
  return (
    <div className="sp-grid-decor sp-grid-decor--light" aria-hidden>
      <div className="sp-grid-decor-lines" />
      <div className="sp-grid-decor-glow" />
    </div>
  )
}

export default function CompanyStats({ stats = companyStats, id }) {
  return (
    <section
      id={id}
      className="sp-band sp-band--light sp-band--bleed sp-band--stats"
      aria-label="Company metrics"
    >
      <GridDecor />
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
  )
}
