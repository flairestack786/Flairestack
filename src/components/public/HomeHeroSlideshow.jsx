'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { HERO_SLIDE_INTERVAL_MS, HERO_VIDEO_PLAYBACK_RATE } from '../../lib/heroSlides'
import { videoSourceTypeFromUrl } from '../../lib/heroMediaUpload'
import {
  applyMediaReadyState,
  isIncomingMediaReady,
  nextSlideIndex,
  resolveHeroSlideVisual,
  videoHasDisplayFrame,
  videoPreloadForSlot,
} from '../../lib/heroSlideshowMedia'
import TrustedBy from '../TrustedBy'

/**
 * @typedef {import('../../lib/heroSlides').PublicHeroSlide & { useBundledBackground?: boolean }} HeroSlideView
 */

/**
 * @param {{
 *   slides: HeroSlideView[],
 *   bundledImageSrc?: string | null,
 *   bundledWebpSrc?: string | null,
 * }} props
 */
export default function HomeHeroSlideshow({
  slides,
  bundledImageSrc = null,
  bundledWebpSrc = null,
}) {
  const safeSlides = useMemo(
    () => (Array.isArray(slides) && slides.length > 0 ? slides : []),
    [slides]
  )
  const multi = safeSlides.length > 1
  const labelId = useId()

  /** Requested slide (navigation target). */
  const [index, setIndex] = useState(0)
  /** Slide currently faded in — lags until incoming media is ready. */
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [videoFailed, setVideoFailed] = useState(/** @type {Record<string, boolean>} */ ({}))
  const [mediaReady, setMediaReady] = useState(/** @type {Record<string, boolean>} */ ({}))

  const videoRefs = useRef(/** @type {Record<string, HTMLVideoElement | null>} */ ({}))
  const resumeAutoAt = useRef(0)
  const navGeneration = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (index >= safeSlides.length) setIndex(0)
    if (visibleIndex >= safeSlides.length) setVisibleIndex(0)
  }, [index, visibleIndex, safeSlides.length])

  const active = safeSlides[Math.min(index, Math.max(safeSlides.length - 1, 0))] ?? null
  const visible =
    safeSlides[Math.min(visibleIndex, Math.max(safeSlides.length - 1, 0))] ?? active

  const resolveVisual = useCallback(
    (slide) =>
      resolveHeroSlideVisual(slide, {
        videoFailed: Boolean(slide && videoFailed[slide.id]),
        reducedMotion,
        bundledImageSrc,
      }),
    [videoFailed, reducedMotion, bundledImageSrc]
  )

  const markReady = useCallback((slideId, ready) => {
    const generation = navGeneration.current
    setMediaReady((current) =>
      applyMediaReadyState(current, slideId, ready, generation, navGeneration.current)
    )
  }, [])

  const goTo = useCallback(
    (next, { user = false } = {}) => {
      if (!safeSlides.length) return
      const normalized = ((next % safeSlides.length) + safeSlides.length) % safeSlides.length
      navGeneration.current += 1
      setIndex(normalized)
      if (user) {
        resumeAutoAt.current = Date.now() + HERO_SLIDE_INTERVAL_MS
      }
    },
    [safeSlides.length]
  )

  const goPrev = useCallback(
    (event) => {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      goTo(index - 1, { user: true })
    },
    [goTo, index]
  )

  const goNext = useCallback(
    (event) => {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      goTo(index + 1, { user: true })
    },
    [goTo, index]
  )

  const togglePaused = useCallback((event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setPaused((value) => {
      const next = !value
      if (!next) {
        resumeAutoAt.current = Date.now() + HERO_SLIDE_INTERVAL_MS
      }
      return next
    })
  }, [])

  // Auto-advance follows the requested index.
  useEffect(() => {
    if (!multi || paused || reducedMotion) return undefined
    const timer = window.setInterval(() => {
      if (Date.now() < resumeAutoAt.current) return
      navGeneration.current += 1
      setIndex((current) => (current + 1) % safeSlides.length)
    }, HERO_SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [multi, paused, reducedMotion, safeSlides.length])

  // Crossfade only when the incoming slide's media is ready — keep outgoing visible.
  useEffect(() => {
    if (!active) return
    if (index === visibleIndex) return

    const visual = resolveVisual(active)
    const videoEl = videoRefs.current[active.id]
    const readiness = {
      videoReady:
        visual.kind !== 'video' ||
        mediaReady[active.id] === true ||
        videoHasDisplayFrame(videoEl),
      imageReady: mediaReady[active.id] !== false,
    }

    if (reducedMotion || isIncomingMediaReady(visual, readiness)) {
      setVisibleIndex(index)
    }
  }, [index, visibleIndex, active, mediaReady, resolveVisual, reducedMotion])

  // Play only the visible (or soon-to-be-visible target) video; pause all others.
  useEffect(() => {
    const playId = active?.id
    safeSlides.forEach((slide) => {
      const el = videoRefs.current[slide.id]
      if (!el) return
      const visual = resolveVisual(slide)
      const shouldPlay =
        visual.kind === 'video' &&
        slide.id === playId &&
        !videoFailed[slide.id] &&
        !reducedMotion
      if (shouldPlay) {
        try {
          el.playbackRate = HERO_VIDEO_PLAYBACK_RATE
        } catch {
          // ignore
        }
        const playPromise = el.play()
        if (playPromise?.catch) playPromise.catch(() => {})
      } else {
        el.pause()
      }
    })
  }, [active, safeSlides, videoFailed, reducedMotion, resolveVisual])

  // Warm the next slide's image in cache (videos use preload=metadata on the element).
  useEffect(() => {
    if (!multi || typeof window === 'undefined') return undefined
    const next = safeSlides[nextSlideIndex(index, safeSlides.length)]
    if (!next) return undefined
    const visual = resolveVisual(next)
    if (visual.kind !== 'image' && visual.kind !== 'bundled') return undefined
    if (!visual.src) return undefined
    const img = new window.Image()
    img.decoding = 'async'
    img.src = visual.src
    return undefined
  }, [index, multi, safeSlides, resolveVisual])

  if (!active || !visible) return null

  const showControls = multi
  const nextIndex = nextSlideIndex(index, safeSlides.length)

  return (
    <section
      className="hero"
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-labelledby={labelId}
    >
      <div className="hero-media" aria-hidden>
        {safeSlides.map((slide, i) => {
          const isVisible = i === visibleIndex
          const isTarget = i === index
          const isNext = i === nextIndex
          const visual = resolveVisual(slide)
          // Keep video elements mounted whenever this slide owns CMS video media.
          // Unmounting inactive videos was the root cause of the bundled-image flash.
          const mountVideo = visual.kind === 'video' && Boolean(visual.src)
          const showStaticImage =
            !mountVideo && (visual.kind === 'image' || visual.kind === 'bundled') && visual.src
          const useBundledPicture = visual.kind === 'bundled'

          return (
            <div
              key={slide.id}
              className={`hero-slide-media${isVisible ? ' is-active' : ''}${
                isTarget && !isVisible ? ' is-pending' : ''
              }`}
              data-active={isVisible ? 'true' : 'false'}
              data-slide-id={slide.id}
            >
              {mountVideo ? (
                <video
                  ref={(node) => {
                    videoRefs.current[slide.id] = node
                    if (node) {
                      try {
                        node.playbackRate = HERO_VIDEO_PLAYBACK_RATE
                      } catch {
                        // ignore
                      }
                      if (videoHasDisplayFrame(node)) {
                        markReady(slide.id, true)
                      }
                    }
                  }}
                  className="hero-bg-img hero-bg-video"
                  muted
                  playsInline
                  loop
                  autoPlay={isTarget && !reducedMotion}
                  preload={videoPreloadForSlot({ isActive: isTarget, isNext })}
                  poster={visual.poster || undefined}
                  onLoadedData={(event) => {
                    try {
                      event.currentTarget.playbackRate = HERO_VIDEO_PLAYBACK_RATE
                    } catch {
                      // ignore
                    }
                    markReady(slide.id, true)
                  }}
                  onCanPlay={(event) => {
                    try {
                      event.currentTarget.playbackRate = HERO_VIDEO_PLAYBACK_RATE
                    } catch {
                      // ignore
                    }
                    markReady(slide.id, true)
                  }}
                  onPlaying={() => markReady(slide.id, true)}
                  onError={() => {
                    setVideoFailed((current) => ({ ...current, [slide.id]: true }))
                    // Allow crossfade onto poster/bundled fallback for this slide.
                    markReady(slide.id, true)
                  }}
                >
                  <source
                    src={visual.src ?? undefined}
                    type={videoSourceTypeFromUrl(visual.src)}
                  />
                </video>
              ) : null}

              {showStaticImage && useBundledPicture ? (
                <picture>
                  {bundledWebpSrc ? (
                    <source srcSet={bundledWebpSrc} type="image/webp" />
                  ) : null}
                  <img
                    src={visual.src ?? undefined}
                    alt=""
                    className="hero-bg-img"
                    decoding="async"
                    fetchPriority={isTarget || isVisible ? 'high' : 'low'}
                    sizes="100vw"
                    onLoad={() => markReady(slide.id, true)}
                    onError={() => markReady(slide.id, true)}
                  />
                </picture>
              ) : null}

              {showStaticImage && !useBundledPicture ? (
                <img
                  src={visual.src ?? undefined}
                  alt={visual.alt || ''}
                  className="hero-bg-img"
                  decoding="async"
                  fetchPriority={isTarget || isVisible ? 'high' : 'low'}
                  sizes="100vw"
                  onLoad={() => markReady(slide.id, true)}
                  onError={() => markReady(slide.id, true)}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Section-level scrims — apply to every CMS slide, not baked into media */}
      <div className="hero-left-scrim" aria-hidden />
      <div className="hero-overlay" aria-hidden />
      <div className="hero-vignette" aria-hidden />
      <div className="hero-grain" aria-hidden />

      <div className="hero-inner">
        <div className="hero-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={visible.id}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reducedMotion ? 0 : 0.4 }}
            >
              {visible.eyebrow ? <p className="hero-eyebrow">{visible.eyebrow}</p> : null}
              <h1 id={labelId} className="hero-title text-white">
                {visible.title}
                {visible.titleAccent ? (
                  <>
                    <br />
                    <span className="text-accent">{visible.titleAccent}</span>
                  </>
                ) : null}
                {visible.intro ? (
                  <>
                    <br />
                    {visible.intro}
                  </>
                ) : null}
              </h1>
              <div className="hero-rule" aria-hidden />
              {visible.body ? <p className="hero-subtext">{visible.body}</p> : null}
              <div className="hero-actions">
                {visible.ctaLabel && visible.ctaUrl ? (
                  <a href={visible.ctaUrl} className="hero-btn-secondary">
                    <Calendar size={16} strokeWidth={1.75} />
                    {visible.ctaLabel}
                  </a>
                ) : null}
                {visible.ctaSecondaryLabel && visible.ctaSecondaryUrl ? (
                  <a href={visible.ctaSecondaryUrl} className="hero-btn-secondary hero-btn-ghost">
                    {visible.ctaSecondaryLabel}
                  </a>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="hero-trusted">
            <TrustedBy />
          </div>
        </div>
      </div>

      {showControls ? (
        <div className="hero-slideshow-controls">
          <div className="hero-slideshow-nav" role="group" aria-label="Hero slideshow controls">
            <button
              type="button"
              className="hero-slideshow-btn"
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="hero-slideshow-btn"
              onClick={togglePaused}
              aria-label={paused || reducedMotion ? 'Play slideshow' : 'Pause slideshow'}
              aria-pressed={paused || reducedMotion}
              disabled={reducedMotion}
            >
              {paused || reducedMotion ? (
                <Play size={16} strokeWidth={1.75} aria-hidden />
              ) : (
                <Pause size={16} strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <button
              type="button"
              className="hero-slideshow-btn"
              onClick={goNext}
              aria-label="Next slide"
            >
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="hero-slideshow-dots" role="tablist" aria-label="Hero slides">
            {safeSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className={`hero-slideshow-dot${i === index ? ' is-active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  goTo(i, { user: true })
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
