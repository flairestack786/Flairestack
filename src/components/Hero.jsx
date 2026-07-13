import React from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useHomePage } from '../hooks/useHomePage'
import heroJpg from '../assets/hero-4k.jpg'
import heroWebp from '../assets/hero-4k.webp'
import TrustedBy from './TrustedBy'

export default function Hero() {
  const { sections } = useHomePage()
  const content = sections.hero

  return (
    <section className="hero">
      <picture className="hero-media" aria-hidden>
        {content.useBundledBackground ? (
          <>
            <source srcSet={heroWebp} type="image/webp" />
            <img
              src={heroJpg}
              alt=""
              className="hero-bg-img"
              decoding="async"
              fetchPriority="high"
              sizes="100vw"
            />
          </>
        ) : (
          <img
            src={content.backgroundImageUrl}
            alt=""
            className="hero-bg-img"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
        )}
      </picture>
      <div className="absolute inset-0 hero-overlay" aria-hidden />
      <div className="absolute inset-0 hero-vignette" aria-hidden />
      <div className="absolute inset-0 hero-grain" aria-hidden />

      <div className="hero-inner">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="hero-title text-white"
          >
            {content.title}
            <br />
            <span className="text-accent">{content.titleAccent}</span>
            <br />
            {content.intro}
          </motion.h1>
          <div className="hero-rule" aria-hidden />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="hero-subtext"
          >
            {content.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="hero-actions"
          >
            <a href={content.ctaUrl} className="hero-btn-secondary">
              <Calendar size={16} strokeWidth={1.75} />
              {content.ctaLabel}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="hero-trusted"
          >
            <TrustedBy />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
