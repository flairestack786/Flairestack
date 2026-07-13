import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'
import { aboutFadeUp } from './aboutMotion'

export default function AboutVision() {
  const { sections } = useAboutPage()
  const vision = sections.vision

  return (
    <section className="about-page-vision" aria-labelledby="vision-heading">
      <div className="about-page-inner">
        <motion.header className="about-page-section-head" {...aboutFadeUp}>
          <p className="about-page-eyebrow">{vision.eyebrow}</p>
          <h2 id="vision-heading" className="about-page-section-title">
            {vision.title}{' '}
            <span className="about-page-title-accent">{vision.titleAccent}</span>
          </h2>
        </motion.header>
        <motion.p className="about-page-lead" {...aboutFadeUp}>
          {vision.body}
        </motion.p>
      </div>
    </section>
  )
}
