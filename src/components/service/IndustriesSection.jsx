import React from 'react'
import { motion } from 'framer-motion'
import {
  HeartPulse,
  Landmark,
  ShoppingBag,
  GraduationCap,
  Truck,
  Building2,
  CloudCog,
  Home,
} from 'lucide-react'
import { fadeUp, staggerContainer } from './ServiceMotion'

const INDUSTRY_ICONS = {
  Healthcare: HeartPulse,
  Fintech: Landmark,
  'E-Commerce': ShoppingBag,
  Education: GraduationCap,
  Logistics: Truck,
  Enterprise: Building2,
  SaaS: CloudCog,
  'Real Estate': Home,
}

/** Bento span pattern — asymmetric 12-column grid on desktop */
const CARD_SPANS = [
  'sp-ind-card--a',
  'sp-ind-card--b',
  'sp-ind-card--c',
  'sp-ind-card--d',
  'sp-ind-card--e',
  'sp-ind-card--f',
  'sp-ind-card--g',
  'sp-ind-card--h',
]

const cardReveal = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      delay: i * 0.07,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export default function IndustriesSection({ title, intro, items }) {
  return (
    <div className="sp-ind">
      <div className="sp-ind-atmosphere" aria-hidden>
        <div className="sp-ind-atmosphere-mesh" />
        <div className="sp-ind-atmosphere-orb sp-ind-atmosphere-orb--a" />
        <div className="sp-ind-atmosphere-orb sp-ind-atmosphere-orb--b" />
        <div className="sp-ind-atmosphere-lines" />
      </div>

      <motion.header
        className="sp-ind-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={staggerContainer}
      >
        <motion.p className="sp-ind-eyebrow" variants={fadeUp}>
          Industries We Serve
        </motion.p>
        <motion.h2 className="sp-ind-title" variants={fadeUp} custom={1}>
          {title}
        </motion.h2>
        {intro && (
          <motion.p className="sp-ind-intro" variants={fadeUp} custom={2}>
            {intro}
          </motion.p>
        )}
        <motion.div className="sp-ind-header-rule" variants={fadeUp} custom={3} aria-hidden />
      </motion.header>

      <motion.ul
        className="sp-ind-showcase"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={staggerContainer}
      >
        {items.map((ind, i) => {
          const Icon = INDUSTRY_ICONS[ind.title] ?? Building2
          const spanClass = CARD_SPANS[i] ?? ''

          return (
            <motion.li
              key={ind.title}
              className={`sp-ind-card ${spanClass}`.trim()}
              variants={cardReveal}
              custom={i}
            >
              <article className="sp-ind-card-inner">
                <span className="sp-ind-card-num" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="sp-ind-card-icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} className="sp-ind-card-icon" />
                </div>
                <div className="sp-ind-card-body">
                  <h3 className="sp-ind-card-title">{ind.title}</h3>
                  <p className="sp-ind-card-desc">{ind.description}</p>
                </div>
                <div className="sp-ind-card-glow" aria-hidden />
                <div className="sp-ind-card-edge" aria-hidden />
              </article>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
