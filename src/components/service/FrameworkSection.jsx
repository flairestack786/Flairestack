import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { PHONE_DISPLAY, PHONE_TEL } from '../../config/contact'
import { fadeUp, staggerContainer } from './ServiceMotion'

const itemReveal = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: i * 0.04 },
  }),
}

const contentReveal = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

const visualReveal = {
  hidden: { opacity: 0, y: 44, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
}

function FrameworkVisual({ src, alt }) {
  return (
    <motion.div className="sp-fw-visual-wrap" variants={visualReveal}>
      <div className="sp-fw-visual-glow" aria-hidden />
      <div className="sp-fw-visual-shell">
        <figure className="sp-fw-visual-frame">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="sp-fw-visual-img"
          />
          <div className="sp-fw-visual-overlay" aria-hidden />
          <div className="sp-fw-visual-shine" aria-hidden />
        </figure>
      </div>
    </motion.div>
  )
}

export default function FrameworkSection({ title, intro, items }) {
  return (
    <div className="sp-fw">
      <div className="sp-fw-atmosphere" aria-hidden>
        <div className="sp-fw-atmosphere-grid" />
        <div className="sp-fw-atmosphere-orb sp-fw-atmosphere-orb--a" />
        <div className="sp-fw-atmosphere-orb sp-fw-atmosphere-orb--b" />
      </div>

      <motion.header
        className="sp-fw-header"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={staggerContainer}
      >
        <motion.p className="sp-fw-eyebrow" variants={fadeUp}>
          Core Framework
        </motion.p>
        <motion.h2 className="sp-fw-title" variants={fadeUp} custom={1}>
          {title}
        </motion.h2>
        {intro && (
          <motion.p className="sp-fw-intro" variants={fadeUp} custom={2}>
            {intro}
          </motion.p>
        )}
        <motion.div className="sp-fw-header-rule" variants={fadeUp} custom={3} aria-hidden />
      </motion.header>

      <ol className="sp-fw-showcase">
        {items.map((item, i) => {
          const imageSrc = typeof item.image === 'object' ? item.image.src : item.image
          const imageAlt = typeof item.image === 'object' ? item.image.alt : item.title
          const headingId = `framework-item-${i}`
          const isReverse = i % 2 === 1

          return (
            <motion.li
              key={item.title}
              className={`sp-fw-item${isReverse ? ' sp-fw-item--reverse' : ''}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={itemReveal}
              custom={i}
              aria-labelledby={headingId}
            >
              <motion.div className="sp-fw-content" variants={contentReveal}>
                <div className="sp-fw-num-block">
                  <span className="sp-fw-num" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="sp-fw-num-label">
                    Capability {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 id={headingId} className="sp-fw-item-title">
                  {item.title}
                </h3>
                <p className="sp-fw-item-desc">{item.description}</p>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="sp-fw-cta"
                  aria-label={`Book a call — ${PHONE_DISPLAY}`}
                >
                  <span>Book a Call</span>
                  <ArrowUpRight size={17} aria-hidden className="sp-fw-cta-icon" />
                </a>
              </motion.div>

              <FrameworkVisual src={imageSrc} alt={imageAlt} />
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
