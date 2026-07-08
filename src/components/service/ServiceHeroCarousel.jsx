import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FADE = { duration: 1.35, ease: [0.4, 0, 0.2, 1] }

function CarouselSlide({ slide, variant, isFirst }) {
  if (variant === 'frame') {
    return (
      <motion.img
        key={slide.src}
        src={slide.src}
        alt={slide.alt ?? ''}
        loading={isFirst ? 'eager' : 'lazy'}
        decoding="async"
        className="cinematic-media-img sp-hero-carousel-img sp-hero-visual-img"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={FADE}
      />
    )
  }

  return (
    <motion.img
      key={slide.src}
      src={slide.src}
      alt=""
      aria-hidden
      className="sp-hero-bg-img sp-hero-carousel-img"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
    />
  )
}

function CarouselDots({ slides, index, onSelect, className = 'sp-hero-carousel-dots' }) {
  if (slides.length < 2) return null

  return (
    <div className={className} role="tablist" aria-label="Hero image slideshow">
      {slides.map((slide, i) => (
        <button
          key={slide.src}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Show image ${i + 1} of ${slides.length}`}
          className={`sp-hero-carousel-dot ${i === index ? 'is-active' : ''}`}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  )
}

function preloadSlide(src) {
  if (!src || typeof src !== 'string') return
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

/** Shared slideshow state for hero background + frame (stays in sync). */
export function useHeroSlideshow(images, intervalMs = 5500) {
  const slides = images.filter((img) => img?.src)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    slides.forEach((slide) => preloadSlide(slide.src))
  }, [slides])

  useEffect(() => {
    if (slides.length < 2) return
    preloadSlide(slides[(index + 1) % slides.length].src)
  }, [index, slides])

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return undefined

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [slides.length, paused, intervalMs])

  const goTo = (i) => {
    setIndex(i)
    setPaused(true)
    window.setTimeout(() => setPaused(false), intervalMs * 2)
  }

  const pause = () => setPaused(true)
  const resume = () => setPaused(false)

  return { slides, index, goTo, pause, resume, current: slides[index] }
}

export function ServiceHeroBgCarousel({ slideshow }) {
  const { slides, pause, resume, current, index } = slideshow
  if (!slides.length) return null

  return (
    <div
      className="sp-hero-carousel sp-hero-carousel--bg"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {current && <CarouselSlide slide={current} variant="bg" isFirst={index === 0} />}
      </AnimatePresence>
    </div>
  )
}

export function ServiceHeroFrameCarousel({ slideshow, className = '' }) {
  const { slides, index, goTo, pause, resume, current } = slideshow
  if (!slides.length) return null

  return (
    <figure
      className={`sp-hero-carousel sp-hero-carousel--frame cinematic-media ${className}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {current && <CarouselSlide slide={current} variant="frame" isFirst={index === 0} />}
      </AnimatePresence>
      <div className="cinematic-media-grade" aria-hidden />
      <div className="cinematic-media-grain hero-grain" aria-hidden />
      <div className="cinematic-media-glow" aria-hidden />
      <CarouselDots slides={slides} index={index} onSelect={goTo} />
    </figure>
  )
}

/** @deprecated Use useHeroSlideshow + ServiceHeroBgCarousel / ServiceHeroFrameCarousel */
export default function ServiceHeroCarousel(props) {
  const slideshow = useHeroSlideshow(props.images, props.intervalMs)
  if (props.variant === 'frame') {
    return <ServiceHeroFrameCarousel slideshow={slideshow} className={props.className} />
  }
  return <ServiceHeroBgCarousel slideshow={slideshow} />
}
