import React from 'react'
import { motion } from 'framer-motion'
import { useHomePage } from '../hooks/useHomePage'
import InquiryForm from './inquiry/InquiryForm'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

export default function CTA() {
  const { sections } = useHomePage()
  const content = sections.contact

  return (
    <section id="contact" className="inquiry-section" aria-labelledby="inquiry-heading">
      <div className="inquiry-ambient inquiry-ambient--left" aria-hidden />
      <div className="inquiry-ambient inquiry-ambient--right" aria-hidden />
      <div className="inquiry-grain hero-grain" aria-hidden />

      <div className="inquiry-inner">
        <div className="inquiry-layout">
          <motion.div className="inquiry-copy" {...fadeUp}>
            <p className="inquiry-eyebrow">{content.eyebrow}</p>
            <h2 id="inquiry-heading" className="inquiry-title">
              {content.title}{' '}
              <span className="inquiry-accent">{content.titleAccent}</span>
            </h2>
            <p className="inquiry-lead">{content.body}</p>

            <ul className="inquiry-capabilities">
              {content.capabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ul className="inquiry-trust">
              {content.trustItems.map(({ Icon, text }) => (
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
