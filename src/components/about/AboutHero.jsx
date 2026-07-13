import React from 'react'
import { motion } from 'framer-motion'
import { useAboutPage } from '../../hooks/useAboutPage'
import { aboutFadeUp } from './aboutMotion'

export default function AboutHero() {
  const { sections } = useAboutPage()
  const hero = sections.hero

  return (
    <section className="about-page-hero" aria-labelledby="about-page-title">
      <div className="about-page-hero-glow" aria-hidden />
      <div className="about-page-inner">
        <motion.p className="about-page-eyebrow" {...aboutFadeUp}>
          {hero.eyebrow}
        </motion.p>
        <motion.h1 id="about-page-title" className="about-page-title" {...aboutFadeUp}>
          {hero.title} <span className="about-page-title-accent">{hero.titleAccent}</span>
        </motion.h1>
        <motion.p className="about-page-lead" {...aboutFadeUp}>
          {hero.intro}
        </motion.p>
      </div>
    </section>
  )
}
