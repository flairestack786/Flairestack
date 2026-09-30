'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import {
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiLinkedin,
  SiX,
  SiYoutube,
} from 'react-icons/si'
import { publicServicePath } from '@/lib/serviceSlug'
import PublicSiteLogo from './PublicSiteLogo'
import { usePublicSite } from './PublicSiteProvider'
import { usePublicHomeNavigation } from './usePublicHomeNavigation'
import type { PublicNavService } from '@/lib/next/publicSiteSettingsServer'

const SOCIAL_ICONS: Record<string, typeof SiFacebook> = {
  facebook_url: SiFacebook,
  instagram_url: SiInstagram,
  linkedin_url: SiLinkedin,
  x_url: SiX,
  youtube_url: SiYoutube,
  github_url: SiGithub,
}

const navLinks = [
  { label: 'Home', type: 'home' as const },
  { label: 'About', type: 'page' as const, href: '/about' },
  { label: 'Services', type: 'section' as const, section: 'services' },
  { label: 'Contact', type: 'section' as const, section: 'contact' },
]

const FOOTER_SERVICE_COUNT = 8

function pickRandomServices(list: PublicNavService[], count = FOOTER_SERVICE_COUNT) {
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function FooterNavLink({
  item,
}: {
  item: (typeof navLinks)[number]
}) {
  const { scrollToHomeSection, scrollToHomeTop } = usePublicHomeNavigation()

  if (item.type === 'home') {
    return (
      <Link
        href="/"
        className="site-footer-link"
        onClick={(e) => {
          e.preventDefault()
          scrollToHomeTop()
        }}
      >
        {item.label}
      </Link>
    )
  }

  if (item.type === 'page') {
    return (
      <Link href={item.href} className="site-footer-link">
        {item.label}
      </Link>
    )
  }

  return (
    <a
      href={`/#${item.section}`}
      className="site-footer-link"
      onClick={(e) => scrollToHomeSection(item.section, e)}
    >
      {item.label}
    </a>
  )
}

export default function PublicFooter() {
  const { scrollToHomeTop } = usePublicHomeNavigation()
  const { settings, services } = usePublicSite()
  const footerServices = useMemo(() => pickRandomServices(services), [services])

  const {
    tagline,
    description,
    email,
    emailMailto,
    phone,
    phoneTel,
    addressLines,
    copyright_text,
    socialLinks,
  } = settings

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-glow" aria-hidden />

      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-col site-footer-col--brand">
            <PublicSiteLogo
              className="site-logo site-logo--footer"
              href="/"
              onClick={(e) => {
                e.preventDefault()
                scrollToHomeTop()
              }}
            />
            <p className="site-footer-tagline">{tagline}</p>
            <p className="site-footer-desc">{description}</p>
          </div>

          <nav className="site-footer-col" aria-label="Footer navigation">
            <h2 className="site-footer-heading">Navigation</h2>
            <ul className="site-footer-links">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-col site-footer-col--services" aria-label="Services">
            <h2 className="site-footer-heading">Services</h2>
            <ul className="site-footer-links site-footer-links--services">
              {footerServices.map(({ id, slug, title }) => (
                <li key={id || slug}>
                  <Link href={publicServicePath(slug)} className="site-footer-link">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer-col site-footer-col--contact">
            <h2 className="site-footer-heading">Get in Touch</h2>
            <ul className="site-footer-contact">
              <li>
                <a href={emailMailto} className="site-footer-contact-link">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <Mail size={16} strokeWidth={1.75} />
                  </span>
                  <span>{email}</span>
                </a>
              </li>
              <li>
                <a href={phoneTel} className="site-footer-contact-link">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <Phone size={16} strokeWidth={1.75} />
                  </span>
                  <span>{phone}</span>
                </a>
              </li>
              <li>
                <span className="site-footer-contact-link site-footer-contact-link--static">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <MapPin size={16} strokeWidth={1.75} />
                  </span>
                  <span className="site-footer-location">
                    {addressLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-divider" aria-hidden />

        <div className="site-footer-bottom">
          <p className="site-footer-copy">{copyright_text}</p>
          <p className="site-footer-values">Engineering · Design · Delivery</p>

          {socialLinks.length > 0 && (
            <ul className="site-footer-socials" aria-label="Social media">
              {socialLinks.map(({ href, label, key }) => {
                const Icon = SOCIAL_ICONS[key]
                if (!Icon) return null
                return (
                  <li key={label}>
                    <a
                      href={href}
                      className="site-footer-social"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                    >
                      <Icon size={18} aria-hidden />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  )
}
