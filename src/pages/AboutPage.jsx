import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { founders, companyMission } from '../data/founders'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'About Us | FlaireStack'
    return () => {
      document.title = 'FlaireStack'
    }
  }, [])

  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="about-page-hero" aria-labelledby="about-page-title">
          <div className="about-page-hero-glow" aria-hidden />
          <div className="about-page-inner">
            <motion.p className="about-page-eyebrow" {...fadeUp}>
              About us
            </motion.p>
            <motion.h1 id="about-page-title" className="about-page-title" {...fadeUp}>
              The team behind <span className="about-page-title-accent">FlaireStack</span>
            </motion.h1>
            <motion.p className="about-page-lead" {...fadeUp}>
              We are an AI-first software studio helping ambitious organizations design, build, and
              scale digital products with senior engineering, premium design, and transparent delivery.
            </motion.p>
          </div>
        </section>

        <section className="about-page-founders" aria-labelledby="founders-heading">
          <div className="about-page-inner">
            <motion.header className="about-page-section-head" {...fadeUp}>
              <p className="about-page-eyebrow">Leadership</p>
              <h2 id="founders-heading" className="about-page-section-title">
                Meet our <span className="about-page-title-accent">co-founders</span>
              </h2>
            </motion.header>

            <div className="about-founders-grid">
              {founders.map((founder, i) => (
                <motion.article
                  key={founder.id}
                  className="about-founder-card"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                >
                  <div className="about-founder-photo-wrap">
                    <img
                      src={founder.image}
                      alt={founder.imageAlt}
                      className="about-founder-photo"
                      style={{ objectPosition: founder.imagePosition }}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                    />
                    <div className="about-founder-photo-shine" aria-hidden />
                  </div>
                  <div className="about-founder-body">
                    <h3 className="about-founder-name">{founder.name}</h3>
                    <p className="about-founder-title">{founder.title}</p>
                    <p className="about-founder-bio">{founder.bio}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-page-mission" aria-labelledby="mission-heading">
          <div className="about-page-inner">
            <motion.article
              className="about-mission-panel"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="about-page-eyebrow">Our mission</p>
              <h2 id="mission-heading" className="about-page-section-title about-page-section-title--light">
                Building digital experiences that <span className="about-page-title-accent">drive growth</span>
              </h2>
              <p className="about-mission-text">{companyMission}</p>
            </motion.article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
