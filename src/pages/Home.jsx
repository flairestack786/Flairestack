import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Services from '../components/Services'
import WhyChoose from '../components/WhyChoose'
import CompanyStats from '../components/CompanyStats'
import Testimonials from '../components/Testimonials'
import Process from '../components/Process'
import Technologies from '../components/Technologies'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import { resolveHomeScrollTarget } from '../utils/scrollToSection'
import { useHomePage } from '../hooks/useHomePage'
import { usePageDocumentSeo } from '../hooks/usePageDocumentSeo'

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { page, seo, loading } = useHomePage()

  usePageDocumentSeo({
    seoRow: seo?.row,
    pageTitle: page?.title || 'Home',
    routePath: page?.route_path || '/',
    entityType: 'page',
    fallbackTitle: seo?.metaTitle,
    fallbackDescription: seo?.metaDescription,
    ready: !loading,
  })

  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      navigate('/', { replace: true, state: {} })
      return
    }

    const target = resolveHomeScrollTarget(location)
    if (!target) return

    const scroll = () => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      if (location.state?.scrollTo) {
        navigate(`/#${target}`, { replace: true, state: {} })
      }
    }

    const timer = setTimeout(scroll, 80)
    return () => clearTimeout(timer)
  }, [location.pathname, location.hash, location.state, navigate])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <WhyChoose />
        <CompanyStats />
        <Testimonials />
        <Process />
        <Technologies />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
