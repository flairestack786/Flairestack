import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Clock, Sparkles } from 'lucide-react'
import InquiryForm from './inquiry/InquiryForm'

const trustItems = [
  { Icon: Clock, text: 'Response within 1 business day' },
  { Icon: Shield, text: 'NDA & enterprise security practices' },
  { Icon: Sparkles, text: 'Premium engineering execution powered by modern AI systems' },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

const capabilities = [
  'AI solutions',
  'Enterprise software',
  'Scalable digital products',
  'Cloud systems',
  'Custom development services',
]

export default function CTA() {
  return (
    <section id="contact" className="inquiry-section" aria-labelledby="inquiry-heading">
      <div className="inquiry-ambient inquiry-ambient--left" aria-hidden />
      <div className="inquiry-ambient inquiry-ambient--right" aria-hidden />
      <div className="inquiry-grain hero-grain" aria-hidden />

      <div className="inquiry-inner">
        <div className="inquiry-layout">
          <motion.div className="inquiry-copy" {...fadeUp}>
            <p className="inquiry-eyebrow">Start a project</p>
            <h2 id="inquiry-heading" className="inquiry-title">
              Let&apos;s Build Something{' '}
              <span className="inquiry-accent">Exceptional Together</span>
            </h2>
            <p className="inquiry-lead">
              Partner with FlaireStack for cinematic digital products engineered with precision —
              from intelligent automation to mission-critical platforms that scale globally.
            </p>

            <ul className="inquiry-capabilities">
              {capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ul className="inquiry-trust">
              {trustItems.map(({ Icon, text }) => (
                <li key={text}>
                  <span className="inquiry-trust-icon" aria-hidden>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="inquiry-form-wrap"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <InquiryForm />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
