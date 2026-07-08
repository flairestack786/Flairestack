import React from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import TrustedBy from './TrustedBy'
import heroJpg from '../assets/hero-4k.jpg'
import heroWebp from '../assets/hero-4k.webp'

export default function Hero() {
  return (
    <section className="hero">
      <picture className="hero-media" aria-hidden>
        <source srcSet={heroWebp} type="image/webp" />
        <img
          src={heroJpg}
          alt=""
          className="hero-bg-img"
          decoding="async"
          fetchPriority="high"
          sizes="100vw"
        />
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
            Building intelligent
            <br />
            <span className="text-accent">digital experiences</span>
            <br />
            for the future.
          </motion.h1>
          <div className="hero-rule" aria-hidden />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="hero-subtext"
          >
            FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern
            digital products designed to scale businesses globally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="hero-actions"
          >
            <a href="#contact" className="hero-btn-secondary">
              <Calendar size={16} strokeWidth={1.75} />
              Book Consultation
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
