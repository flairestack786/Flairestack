import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

export function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = value
    const duration = 1400
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [inView, value])

  return (
    <span ref={ref} className="service-stat-value">
      <span className="service-stat-number">{count}</span>
      {suffix ? <span className="service-stat-suffix">{suffix}</span> : null}
    </span>
  )
}

export function ParallaxHeroImage({ src, alt }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.18])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35])

  return (
    <div ref={ref} className="service-detail-hero-parallax">
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale, opacity }}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1.08, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="service-detail-hero-img"
      />
    </div>
  )
}

/** Premium cinematic image with grain, grade overlay, hover zoom */
export function CinematicImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  aspect = '4/3',
  parallax = false,
  priority = false,
  tone = 'dark',
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const toneClass = tone === 'light' ? ' cinematic-media--light' : ''

  return (
    <motion.figure
      ref={ref}
      className={`cinematic-media${toneClass} ${className}`.trim()}
      style={{ aspectRatio: aspect }}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`cinematic-media-img ${imgClassName}`}
        style={parallax ? { y } : undefined}
        whileHover={{ scale: 1.06 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="cinematic-media-grade" aria-hidden />
      <div className="cinematic-media-grain hero-grain" aria-hidden />
      <div className="cinematic-media-glow" aria-hidden />
    </motion.figure>
  )
}

export function RevealImage({ src, alt, variant = 'split' }) {
  const wrapClass =
    variant === 'tech'
      ? 'service-tech-visual service-reveal-media'
      : 'service-reveal-media service-split-media'
  const imgClass = variant === 'tech' ? 'service-tech-visual-img' : 'service-split-img'

  return (
    <motion.figure
      className={wrapClass}
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className={imgClass}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="service-split-media-overlay" aria-hidden />
    </motion.figure>
  )
}

export function VisualBanner({ image }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <motion.figure
      ref={ref}
      className="service-visual-banner"
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        style={{ y }}
        className="service-visual-banner-img"
      />
      <div className="service-visual-banner-overlay" aria-hidden />
      <div className="service-visual-banner-grain hero-grain" aria-hidden />
    </motion.figure>
  )
}

export function FloatingOrb({ className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      aria-hidden
      animate={{
        y: [0, -18, 0],
        x: [0, 12, 0],
        opacity: [0.35, 0.55, 0.35],
      }}
      transition={{
        duration: 8 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
