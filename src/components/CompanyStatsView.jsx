import React from 'react'
import { motion } from 'framer-motion'
import { companyStats as FALLBACK_STATS } from '../data/companyStats'
import { AnimatedCounter, fadeUp, staggerContainer } from './service/ServiceMotion'

function GridDecor() {
  return (
    <div className="sp-grid-decor sp-grid-decor--light" aria-hidden>
      <div className="sp-grid-decor-lines" />
      <div className="sp-grid-decor-glow" />
    </div>
  )
}

/**
 * Presentational company metrics — no Vite data hooks (Next-safe).
 * @param {{ id?: string, stats?: Array<{ value: number, suffix?: string, label: string }> }} props
 */
export default function CompanyStatsView({ id, stats }) {
  const resolved =
    Array.isArray(stats) && stats.length > 0 ? stats : FALLBACK_STATS

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
          {resolved.map((stat, i) => (
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
