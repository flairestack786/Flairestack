import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import SiteLogo from './SiteLogo'
import { usePublishedServices } from '../hooks/usePublishedServices'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { scrollToHomeSection, scrollToHomeTop } from '../utils/scrollToSection'

const navLinks = [
  { label: 'Home', type: 'home' },
  { label: 'About', type: 'page', to: '/about' },
  { label: 'Services', type: 'section', section: 'services' },
  { label: 'Contact', type: 'section', section: 'contact' },
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
  const navigate = useNavigate()
  const { settings } = useSiteSettings()
  const { services } = usePublishedServices()
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
            <SiteLogo
              className="site-logo site-logo--footer"
              to="/"
              onClick={(e) => {
                e.preventDefault()
                scrollToHomeTop(navigate)
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

          <p className="site-footer-values">
            Engineering · Design · Delivery
          </p>

          {socialLinks.length > 0 && (
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
          )}
        </div>
      </div>
    </footer>
  )
}
