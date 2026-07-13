import React from 'react'
import { useHomePage } from '../hooks/useHomePage'

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
  const { sections } = useHomePage()
  const content = sections.technologies

  return (
    <section id="technologies" className="tech-section" aria-labelledby="technologies-heading">
      <div className="tech-inner">
        <header className="tech-header">
          <p className="tech-eyebrow">{content.eyebrow}</p>
          <h2 id="technologies-heading" className="tech-title">
            {content.title} <span className="tech-accent">{content.titleAccent}</span>
          </h2>
          <p className="tech-intro">{content.intro}</p>
        </header>

        <div className="tech-marquee-stack" aria-label="Technologies and platforms">
          <div className="tech-marquee-fade tech-marquee-fade--left" aria-hidden />
          <div className="tech-marquee-fade tech-marquee-fade--right" aria-hidden />
          <TechMarqueeRow items={content.rowA} duration="52s" />
          <TechMarqueeRow items={content.rowB} reverse duration="58s" />
        </div>
      </div>
    </section>
  )
}
