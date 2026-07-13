import React, { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServicePageLayout from '../components/service/ServicePageLayout'
import { useServicePage } from '../hooks/useServicePage'
import { usePageDocumentSeo } from '../hooks/usePageDocumentSeo'

export default function ServiceDetail() {
  const { slug } = useParams()
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()
  const { service, page, seo, loading } = useServicePage(normalizedSlug)

  usePageDocumentSeo({
    seoRow: seo?.row,
    pageTitle: service?.title || 'Service',
    routePath: `/services/${normalizedSlug}`,
    entityType: 'service',
    fallbackTitle: seo?.metaTitle,
    fallbackDescription: seo?.metaDescription,
    ready: !loading && Boolean(service && page),
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [normalizedSlug])

  if (!normalizedSlug) {
    return <Navigate to="/" replace />
  }

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
