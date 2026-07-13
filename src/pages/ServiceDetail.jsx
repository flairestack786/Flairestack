import React, { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServicePageLayout from '../components/service/ServicePageLayout'
import { useServicePage } from '../hooks/useServicePage'

export default function ServiceDetail() {
  const { slug } = useParams()
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()
  const { service, page, seo, loading } = useServicePage(normalizedSlug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [normalizedSlug])

  useEffect(() => {
    if (!seo?.metaTitle) return
    document.title = seo.metaTitle

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', seo.metaDescription ?? '')

    return () => {
      document.title = 'FlaireStack'
    }
  }, [seo?.metaTitle, seo?.metaDescription])

  if (!normalizedSlug) {
    return <Navigate to="/" replace />
  }

  // Wait for CMS fetch before redirecting — CMS-only slugs have no static fallback.
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="service-detail sp-page antialiased" aria-busy="true">
          <div className="sp-band sp-band--dark" style={{ minHeight: '40vh' }} />
        </main>
        <Footer />
      </>
    )
  }

  if (!service || !page) {
    return <Navigate to="/" replace />
  }

  return (
    <motion.article
      className="service-detail sp-page antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Navbar />
      <ServicePageLayout service={service} page={page} />
      <Footer />
    </motion.article>
  )
}
