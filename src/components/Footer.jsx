import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { SiFacebook, SiInstagram, SiLinkedin } from 'react-icons/si'
import { services } from '../data/services'
import {
  COMPANY_NAME,
  COMPANY_TAGLINE,
  COMPANY_DESCRIPTION,
  PHONE_DISPLAY,
  PHONE_TEL,
  COMPANY_EMAIL,
  COMPANY_EMAIL_MAILTO,
  COMPANY_LOCATION,
  COMPANY_LOCATION_SUB,
} from '../config/contact'
import { scrollToHomeSection, scrollToHomeTop } from '../utils/scrollToSection'

const navLinks = [
  { label: 'Home', type: 'home' },
  { label: 'About', type: 'page', to: '/about' },
  { label: 'Services', type: 'section', section: 'services' },
  { label: 'Contact', type: 'section', section: 'contact' },
]

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook', Icon: SiFacebook },
  { href: 'https://instagram.com', label: 'Instagram', Icon: SiInstagram },
  { href: 'https://linkedin.com', label: 'LinkedIn', Icon: SiLinkedin },
]

const FOOTER_SERVICE_COUNT = 8

function pickRandomServices(list, count = FOOTER_SERVICE_COUNT) {
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

function FooterNavLink({ item }) {
  const navigate = useNavigate()

  if (item.type === 'home') {
    return (
      <Link
        to="/"
        className="site-footer-link"
        onClick={(e) => {
          e.preventDefault()
          scrollToHomeTop(navigate)
        }}
      >
        {item.label}
      </Link>
    )
  }

  if (item.type === 'page') {
    return (
      <Link to={item.to} className="site-footer-link">
        {item.label}
      </Link>
    )
  }

  return (
    <a
      href={`/#${item.section}`}
      className="site-footer-link"
      onClick={(e) => scrollToHomeSection(item.section, navigate, e)}
    >
      {item.label}
    </a>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const navigate = useNavigate()
  const footerServices = useMemo(() => pickRandomServices(services), [])

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-glow" aria-hidden />

      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-col site-footer-col--brand">
            <Link
              className="site-logo site-logo--footer"
              to="/"
              onClick={(e) => {
                e.preventDefault()
                scrollToHomeTop(navigate)
              }}
            >
              <span className="site-logo-text">FlaireStack</span>
              <span className="logo-accent" aria-hidden />
            </Link>
            <p className="site-footer-tagline">{COMPANY_TAGLINE}</p>
            <p className="site-footer-desc">{COMPANY_DESCRIPTION}</p>
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
              {footerServices.map(({ slug, title }) => (
                <li key={slug}>
                  <Link to={`/services/${slug}`} className="site-footer-link">
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
                <a href={COMPANY_EMAIL_MAILTO} className="site-footer-contact-link">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <Mail size={16} strokeWidth={1.75} />
                  </span>
                  <span>{COMPANY_EMAIL}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE_TEL}`} className="site-footer-contact-link">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <Phone size={16} strokeWidth={1.75} />
                  </span>
                  <span>{PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <span className="site-footer-contact-link site-footer-contact-link--static">
                  <span className="site-footer-contact-icon" aria-hidden>
                    <MapPin size={16} strokeWidth={1.75} />
                  </span>
                  <span className="site-footer-location">
                    <span>{COMPANY_LOCATION}</span>
                    <span>{COMPANY_LOCATION_SUB}</span>
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-divider" aria-hidden />

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            © {year} {COMPANY_NAME}. All rights reserved.
          </p>

          <p className="site-footer-values">
            Engineering · Design · Delivery
          </p>

          <ul className="site-footer-socials" aria-label="Social media">
            {socialLinks.map(({ href, label, Icon }) => (
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
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
