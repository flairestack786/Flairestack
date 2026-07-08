import React from 'react'
import { Briefcase, Users, Award, Globe, Sparkles, Target, Zap } from 'lucide-react'

const stats = [
  {
    value: '60+',
    label: 'Projects delivered',
    description:
      'End-to-end web development, software engineering, mobile apps, and AI solutions launched for startups and enterprise teams worldwide.',
    Icon: Briefcase,
  },
  {
    value: '25+',
    label: 'Clients partnered',
    description:
      'Long-term partnerships across SaaS, fintech, healthcare, and e-commerce — with transparent delivery and measurable business outcomes.',
    Icon: Users,
  },
  {
    value: '5+',
    label: 'Years of expertise',
    description:
      'Senior engineers, designers, and strategists with deep experience in cloud architecture, UX, and production-grade product development.',
    Icon: Award,
  },
  {
    value: '3',
    label: 'Countries served',
    description:
      'Remote-first delivery supporting organizations in North America, Europe, the Middle East, and beyond with 24/7 collaboration options.',
    Icon: Globe,
  },
]

const missionPoints = [
  {
    title: 'AI-first engineering',
    text: 'We integrate machine learning, automation, and intelligent workflows into products built for real-world scale.',
    Icon: Sparkles,
  },
  {
    title: 'Design-led delivery',
    text: 'Human-centered UI/UX and conversion-focused interfaces that help users adopt and trust your product faster.',
    Icon: Target,
  },
  {
    title: 'Ship with confidence',
    text: 'Agile sprints, security best practices, and DevOps pipelines that take ideas from discovery to production reliably.',
    Icon: Zap,
  },
]

export default function About() {
  return (
    <section id="about" className="about-section" aria-labelledby="about-heading">
      <div className="about-inner">
        <header className="about-header">
          <p className="about-eyebrow">Who we are</p>
          <h2 id="about-heading" className="about-title">
            About <span className="about-brand">FlaireStack</span>
          </h2>
          <p className="about-intro">
            FlaireStack is an AI-first software development company specializing in custom web applications,
            enterprise software, mobile apps, cloud strategy, and intelligent automation — helping ambitious
            teams build scalable digital products that drive growth.
          </p>
        </header>

        <div className="about-grid">
          <div className="about-stats">
            {stats.map(({ value, label, description, Icon }) => (
              <article key={label} className="about-card about-stat-card">
                <div className="about-card-icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <p className="about-stat-value">{value}</p>
                <h3 className="about-stat-label">{label}</h3>
                <p className="about-stat-desc">{description}</p>
              </article>
            ))}
          </div>

          <article className="about-card about-mission">
            <div className="about-mission-header">
              <div className="about-card-icon about-card-icon--mission" aria-hidden>
                <Sparkles size={22} strokeWidth={1.75} />
              </div>
              <h3 className="about-mission-title">Our mission</h3>
            </div>
            <p className="about-mission-lead">
              We blend artificial intelligence with world-class engineering to help organizations design,
              build, and scale software that performs in production — not just in presentations.
            </p>
            <ul className="about-mission-list">
              {missionPoints.map(({ title, text, Icon }) => (
                <li key={title} className="about-mission-item">
                  <span className="about-mission-item-icon" aria-hidden>
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
