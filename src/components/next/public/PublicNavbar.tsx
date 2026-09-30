'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, LayoutGroup } from 'framer-motion'
import { Menu } from 'lucide-react'
import PublicMobileMenu from './PublicMobileMenu'
import PublicNavServicesDropdown from './PublicNavServicesDropdown'
import PublicSiteLogo from './PublicSiteLogo'
import { usePublicNavActive } from './usePublicNavActive'
import { usePublicHomeNavigation } from './usePublicHomeNavigation'

const navItems = [
  { id: 'about', label: 'About', type: 'page' as const, href: '/about' },
  { id: 'contact', label: 'Contact', type: 'section' as const, section: 'contact' },
]

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const { isActive, isNavItemActive } = usePublicNavActive()
  const { scrollToHomeSection, scrollToHomeTop } = usePublicHomeNavigation()

  return (
    <LayoutGroup id="nav-menu">
      <header className={`nav-glass fixed w-full z-50 top-0 left-0${open ? ' nav-glass--menu-open' : ''}`}>
        <nav className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 h-[72px] flex items-center">
          <PublicSiteLogo
            className="site-logo"
            href="/"
            onClick={(e) => {
              e.preventDefault()
              scrollToHomeTop()
            }}
          />

          <div className="hidden lg:flex items-center gap-10 ml-auto mr-10">
            <Link
              href="/"
              className={`nav-link ${isNavItemActive('home') ? 'nav-link--active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                scrollToHomeTop()
              }}
            >
              Home
            </Link>
            <PublicNavServicesDropdown />
            {navItems.map((item) =>
              item.type === 'page' ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-link ${isActive(item.id) ? 'nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={`/#${item.section}`}
                  className={`nav-link ${isActive(item.id) ? 'nav-link--active' : ''}`}
                  onClick={(e) => scrollToHomeSection(item.section, e)}
                >
                  {item.label}
                </a>
              )
            )}
          </div>

          <a
            href="/#contact"
            className="nav-cta hidden lg:inline-flex"
            onClick={(e) => scrollToHomeSection('contact', e)}
          >
            Get Started
            <span className="cta-arrow" aria-hidden>
              →
            </span>
          </a>

          <div className="lg:hidden ml-auto">
            {!open && (
              <motion.button
                type="button"
                onClick={() => setOpen(true)}
                className="nav-menu-toggle"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="mobile-navigation"
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              >
                <Menu size={22} strokeWidth={2} aria-hidden />
              </motion.button>
            )}
          </div>
        </nav>
        <PublicMobileMenu open={open} onClose={() => setOpen(false)} />
      </header>
    </LayoutGroup>
  )
}
