import React, { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServicePageLayout from '../components/service/ServicePageLayout'
import { getServiceBySlug } from '../data/services'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = getServiceBySlug(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (!service) return
    document.title = service.seoTitle
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', service.seoDescription)
    return () => {
      document.title = 'FlaireStack'
    }
  }, [service])

  if (!service) return <Navigate to="/" replace />

  return (
    <motion.article
      className="service-detail sp-page antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Navbar />
      <ServicePageLayout service={service} page={service.page} />
      <Footer />
    </motion.article>
  )
}
