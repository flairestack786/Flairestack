'use client'

import AboutHero from '@/components/about/AboutHero'
import AboutCompanyStory from '@/components/about/AboutCompanyStory'
import AboutMission from '@/components/about/AboutMission'
import AboutVision from '@/components/about/AboutVision'
import AboutValues from '@/components/about/AboutValues'
import AboutTeam from '@/components/about/AboutTeam'
import AboutContact from '@/components/about/AboutContact'
import type { SerializableAboutPage } from '@/lib/next/publicAboutServer'

type Props = {
  about: SerializableAboutPage
}

/**
 * Phase 18 — public About view (shared Vite section components + CMS props).
 */
export default function AboutPageView({ about }: Props) {
  const { sections, seo } = about

  return (
    <main className="about-page">
      {seo.pageDescription ? <p className="sr-only">{seo.pageDescription}</p> : null}
      <AboutHero hero={sections.hero} />
      <AboutCompanyStory story={sections['company-story']} />
      <AboutMission mission={sections.mission} />
      <AboutVision vision={sections.vision} />
      <AboutValues values={sections.values} />
      <AboutTeam team={sections.team} />
      <AboutContact contact={sections.contact} />
    </main>
  )
}
