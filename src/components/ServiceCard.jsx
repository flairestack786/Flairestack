import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export default function ServiceCard({ service, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="service-card group"
    >
      <Link to={`/services/${service.slug}`} className="service-card-link">
        <div className="service-card-inner service-card-inner--grid">
          <h3 className="service-card-title">{service.title}</h3>
          <p className="service-card-desc">{service.shortDescription}</p>
          <span className="service-card-cta">
            Learn more
            <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}
