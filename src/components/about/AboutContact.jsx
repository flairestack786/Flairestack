import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { aboutFadeUp } from './aboutMotion'

/**
 * @param {{
 *   contact: {
 *     eyebrow: string,
 *     title: string,
 *     titleAccent: string,
 *     body: string,
 *     ctaLabel: string,
 *     ctaUrl: string,
 *   }
 * }} props
 */
export default function AboutContact({ contact }) {
  return (
    <section className="about-page-contact" aria-labelledby="about-contact-heading">
      <div className="about-page-inner about-page-contact-inner">
        <motion.p className="about-page-eyebrow" {...aboutFadeUp}>
          {contact.eyebrow}
        </motion.p>
        <motion.h2 id="about-contact-heading" className="about-page-section-title" {...aboutFadeUp}>
          {contact.title}{' '}
          <span className="about-page-title-accent">{contact.titleAccent}</span>
        </motion.h2>
        <motion.p className="about-page-lead" {...aboutFadeUp}>
          {contact.body}
        </motion.p>
        <motion.div {...aboutFadeUp}>
          <a href={contact.ctaUrl} className="about-page-cta-btn">
            {contact.ctaLabel}
            <ArrowRight size={18} aria-hidden />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
