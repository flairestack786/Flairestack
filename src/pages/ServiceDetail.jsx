import React, { useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServicePageLayout from '../components/service/ServicePageLayout'
import { useServicePage } from '../hooks/useServicePage'
import { usePageDocumentSeo } from '../hooks/usePageDocumentSeo'
import { usePublishedTestimonials } from '../hooks/useTestimonials'
import { useHomePage } from '../hooks/useHomePage'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { normalizeServiceSlug } from '../lib/serviceSlug'

export default function ServiceDetail() {
  const { slug } = useParams()
  const normalizedSlug = normalizeServiceSlug(slug)
  const { service, page, seo, loading } = useServicePage(normalizedSlug)
  const { serviceTestimonials } = usePublishedTestimonials()
  const { sections } = useHomePage()
  const { settings } = useSiteSettings()
  const companyStats =
    Array.isArray(sections?.stats?.stats) && sections.stats.stats.length > 0
      ? sections.stats.stats
      : undefined

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
      <ServicePageLayout
        service={service}
        page={page}
        LinkComponent={Link}
        testimonials={serviceTestimonials}
        companyStats={companyStats}
        phone={settings?.phone}
        phoneTel={settings?.phoneTel}
      />
      <Footer />
    </motion.article>
  )
}
