import React, { useEffect } from 'react'
import { AboutPageProvider, useAboutPage } from '../hooks/useAboutPage'
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
  const { seo } = useAboutPage()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = seo.metaTitle
    return () => {
      document.title = 'FlaireStack'
    }
  }, [seo.metaTitle])

  return (
    <main className="about-page">
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
