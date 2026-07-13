import React, { useEffect } from 'react'
import { AboutPageProvider, useAboutPage } from '../hooks/useAboutPage'
import { usePageDocumentSeo } from '../hooks/usePageDocumentSeo'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AboutHero from '../components/about/AboutHero'
import AboutCompanyStory from '../components/about/AboutCompanyStory'
import AboutMission from '../components/about/AboutMission'
import AboutVision from '../components/about/AboutVision'
import AboutValues from '../components/about/AboutValues'
import AboutTeam from '../components/about/AboutTeam'
import AboutContact from '../components/about/AboutContact'

function AboutPageContent() {
  const { seo, page, loading } = useAboutPage()

  usePageDocumentSeo({
    seoRow: seo?.row,
    pageTitle: page?.title || 'About',
    routePath: page?.route_path || '/about',
    entityType: 'page',
    fallbackTitle: seo?.metaTitle,
    fallbackDescription: seo?.metaDescription,
    ready: !loading,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="about-page">
      {seo?.pageDescription ? (
        <p className="sr-only">{seo.pageDescription}</p>
      ) : null}
      <AboutHero />
      <AboutCompanyStory />
      <AboutMission />
      <AboutVision />
      <AboutValues />
      <AboutTeam />
      <AboutContact />
    </main>
  )
}

export default function AboutPage() {
  return (
    <AboutPageProvider>
      <Navbar />
      <AboutPageContent />
      <Footer />
    </AboutPageProvider>
  )
}
