import React from 'react'
import { technologiesRowA, technologiesRowB } from '../data/technologies'

/** Repeat until the strip is wide enough to fill large viewports, then duplicate for seamless loop */
function buildMarqueeTrack(items) {
  let sequence = [...items]
  while (sequence.length < 32) {
    sequence = [...sequence, ...items]
  }
  return [...sequence, ...sequence]
}

function TechMarqueeRow({ items, reverse = false, duration = '50s' }) {
  const track = buildMarqueeTrack(items)
  const labeledCount = track.length / 2

  return (
    <div className={`tech-marquee-row ${reverse ? 'tech-marquee-row--reverse' : ''}`}>
      <div className="tech-marquee-viewport">
        <div className="tech-marquee-track" style={{ animationDuration: duration }}>
          {track.map((tech, i) => {
            const Icon = tech.Icon
            return (
              <span
                key={`${tech.name}-${i}`}
                className="tech-marquee-tile"
                title={tech.name}
                aria-label={i < labeledCount ? tech.name : undefined}
                aria-hidden={i >= labeledCount}
              >
                <Icon aria-hidden />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Technologies() {
  return (
    <section id="technologies" className="tech-section" aria-labelledby="technologies-heading">
      <div className="tech-inner">
        <header className="tech-header">
          <p className="tech-eyebrow">Tech stack</p>
          <h2 id="technologies-heading" className="tech-title">
            Technologies we <span className="tech-accent">work with</span>
          </h2>
          <p className="tech-intro">
            Modern frameworks, clouds, databases, and AI platforms — integrated with the tools your
            teams already use.
          </p>
        </header>

        <div className="tech-marquee-stack" aria-label="Technologies and platforms">
          <div className="tech-marquee-fade tech-marquee-fade--left" aria-hidden />
          <div className="tech-marquee-fade tech-marquee-fade--right" aria-hidden />
          <TechMarqueeRow items={technologiesRowA} duration="52s" />
          <TechMarqueeRow items={technologiesRowB} reverse duration="58s" />
        </div>
      </div>
    </section>
  )
}
