'use client'

import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { resolveLucideIcon } from '@/lib/lucideIcons'

const easeOut = [0.22, 1, 0.36, 1] as const

export type HomeProcessStep = {
  step: string
  title: string
  text: string
  iconName: string
  imageUrl: string | null
  imageAlt: string
}

type HomeProcessSectionProps = {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  steps: HomeProcessStep[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function HomeProcessSection({
  eyebrow,
  title,
  titleAccent,
  intro,
  steps,
}: HomeProcessSectionProps) {
  const reduceMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stepCount = Math.max(steps.length, 1)
  const horizontalEnabled = !reduceMotion && steps.length > 1
  const [activeIndex, setActiveIndex] = useState(0)
  const x = useMotionValue(0)

  useEffect(() => {
    if (!horizontalEnabled) {
      x.set(0)
      setActiveIndex(0)
      return undefined
    }

    const track = trackRef.current
    if (!track) return undefined

    let frame = 0

    const update = () => {
      frame = 0
      const viewport = window.innerHeight || 1
      const total = Math.max(track.offsetHeight - viewport, 0)
      const progressed = clamp(-track.getBoundingClientRect().top, 0, total)
      const progress = total > 0 ? progressed / total : 0
      const stage = stageRef.current
      const list = stage?.querySelector('.process-story-list')
      const firstStep = list?.querySelector('.process-story-step')
      const stepWidth =
        (firstStep instanceof HTMLElement ? firstStep.offsetWidth : 0) ||
        stage?.clientWidth ||
        track.offsetWidth ||
        0
      const gap = list
        ? Number.parseFloat(window.getComputedStyle(list).columnGap || '0') || 0
        : 0
      x.set(-progress * (stepCount - 1) * (stepWidth + gap))
      setActiveIndex(clamp(Math.round(progress * (stepCount - 1)), 0, stepCount - 1))
    }

    const onScrollOrResize = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [horizontalEnabled, stepCount, x])

  const trackStyle = useMemo(
    () =>
      ({
        '--process-step-count': stepCount,
      }) as CSSProperties,
    [stepCount]
  )

  return (
    <section id="process" className="process-section" aria-labelledby="process-heading">
      <div className="process-inner">
        <motion.header
          className="process-header"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: easeOut }}
        >
          <p className="process-eyebrow">{eyebrow}</p>
          <h2 id="process-heading" className="process-title">
            {title} <span className="process-accent">{titleAccent}</span>
          </h2>
          {intro ? <p className="process-intro">{intro}</p> : null}
          <motion.div
            className="process-rule"
            aria-hidden
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{
              duration: reduceMotion ? 0 : 0.55,
              delay: reduceMotion ? 0 : 0.12,
              ease: easeOut,
            }}
          />
        </motion.header>
      </div>

      {steps.length === 0 ? null : (
        <div
          ref={trackRef}
          className={[
            'process-horizontal',
            horizontalEnabled ? '' : 'process-horizontal--reduced',
          ]
            .filter(Boolean)
            .join(' ')}
          style={trackStyle}
        >
          <div className="process-horizontal-sticky">
            <div ref={stageRef} className="process-stage">
              <motion.ol
                className="process-story-list"
                aria-label="Our process steps"
                style={horizontalEnabled ? { x } : undefined}
              >
                {steps.map((item, index) => {
                  const Icon = resolveLucideIcon(item.iconName)
                  const isActive = !horizontalEnabled || index === activeIndex

                  return (
                    <li
                      key={`process-step-${item.step}-${index}`}
                      className={[
                        'process-story-step',
                        isActive ? 'process-story-step--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <div className="process-story-copy">
                        <div className="process-story-kicker">
                          <span className="process-step-num">{item.step}</span>
                          <span className="process-step-icon" aria-hidden>
                            <Icon size={18} strokeWidth={1.75} />
                          </span>
                        </div>
                        <h3 className="process-card-title">{item.title}</h3>
                        <p className="process-card-text">{item.text}</p>
                        <span className="process-story-count">
                          {String(index + 1).padStart(2, '0')} /{' '}
                          {String(stepCount).padStart(2, '0')}
                        </span>
                      </div>
                      {item.imageUrl ? (
                        <div className="process-story-media">
                          <img
                            src={item.imageUrl}
                            alt={item.imageAlt || item.title}
                            className="process-story-img"
                            width={1200}
                            height={800}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="process-story-media process-story-media--empty" aria-hidden />
                      )}
                    </li>
                  )
                })}
              </motion.ol>

              {horizontalEnabled ? (
                <div className="process-horizontal-progress" aria-hidden>
                  {steps.map((item, index) => (
                    <span
                      key={`process-dot-${item.step}-${index}`}
                      className={[
                        'process-horizontal-progress-dot',
                        index === activeIndex
                          ? 'process-horizontal-progress-dot--active'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
