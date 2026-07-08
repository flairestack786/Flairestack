import React from 'react'
import { motion } from 'framer-motion'
import { Layers, Cpu, Rocket, Shield, Layout, Brain } from 'lucide-react'

const reasons = [
  {
    title: 'Scalable architecture',
    description:
      'We design cloud-native systems, APIs, and data layers that grow from MVP to millions of users — without costly rewrites or downtime.',
    Icon: Layers,
  },
  {
    title: 'Modern technologies',
    description:
      'React, Next.js, Node, Python, AWS, and proven AI stacks — chosen for performance, maintainability, and long-term team velocity.',
    Icon: Cpu,
  },
  {
    title: 'Fast delivery',
    description:
      'Agile squads ship production-ready increments every sprint with clear milestones, demos, and transparent progress you can track.',
    Icon: Rocket,
  },
  {
    title: 'Security-first systems',
    description:
      'Encryption, access control, compliance-aware workflows, and secure SDLC practices built into every phase of development.',
    Icon: Shield,
  },
  {
    title: 'Premium UI/UX',
    description:
      'Research-driven interfaces and design systems that improve adoption, reduce friction, and strengthen brand trust across every touchpoint.',
    Icon: Layout,
  },
  {
    title: 'AI automation expertise',
    description:
      'LLM integrations, intelligent workflows, and automation that save time — deployed responsibly with evaluation, monitoring, and governance.',
    Icon: Brain,
  },
]

export default function WhyChoose() {
  return (
    <section id="why-choose" className="why-section" aria-labelledby="why-choose-heading">
      <div className="why-inner">
        <header className="why-header">
          <p className="why-eyebrow">The FlaireStack difference</p>
          <h2 id="why-choose-heading" className="why-title">
            Why choose <span className="why-brand">FlaireStack</span>
          </h2>
          <p className="why-intro">
            Partner with a software development team that combines senior engineering, premium design,
            and AI-native thinking — so your product ships faster, scales reliably, and wins in the market.
          </p>
        </header>

        <div className="why-grid">
          {reasons.map(({ title, description, Icon }, i) => (
            <motion.article
              key={title}
              className="why-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
            >
              <div className="why-card-icon" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <h3 className="why-card-title">{title}</h3>
              <p className="why-card-desc">{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
