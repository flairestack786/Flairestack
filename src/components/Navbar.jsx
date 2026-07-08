import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { Menu } from 'lucide-react'
import MobileMenu from './MobileMenu'
import NavServicesDropdown from './NavServicesDropdown'
import { useNavActive } from '../hooks/useNavActive'
import { scrollToHomeSection, scrollToHomeTop } from '../utils/scrollToSection'

const navItems = [
  { id: 'about', label: 'About', type: 'page', to: '/about' },
  { id: 'contact', label: 'Contact', type: 'section', section: 'contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isActive, isNavItemActive } = useNavActive()

  const handleSectionClick = (e, sectionId) => {
    e.preventDefault()
    scrollToHomeSection(sectionId, navigate)
  }

  const handleHomeClick = (e) => {
    e.preventDefault()
    scrollToHomeTop(navigate)
  }

  return (
    <LayoutGroup id="nav-menu">
      <header className={`nav-glass fixed w-full z-50 top-0 left-0${open ? ' nav-glass--menu-open' : ''}`}>
      <nav className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 h-[72px] flex items-center">
        <Link className="site-logo" to="/" onClick={handleHomeClick}>
          <span className="site-logo-text">FlaireStack</span>
          <span className="logo-accent" aria-hidden />
        </Link>

        <div className="hidden lg:flex items-center gap-10 ml-auto mr-10">
          <Link
            to="/"
            className={`nav-link ${isNavItemActive('home') ? 'nav-link--active' : ''}`}
            onClick={handleHomeClick}
          >
            Home
          </Link>
          <NavServicesDropdown />
          {navItems.map((item) =>
            item.type === 'page' ? (
              <Link
                key={item.id}
                to={item.to}
                className={`nav-link ${isActive(item.id) ? 'nav-link--active' : ''}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={`/#${item.section}`}
                className={`nav-link ${isActive(item.id) ? 'nav-link--active' : ''}`}
                onClick={(e) => handleSectionClick(e, item.section)}
              >
                {item.label}
              </a>
            )
          )}
        </div>

        <a
          href="/#contact"
          className="nav-cta hidden lg:inline-flex"
          onClick={(e) => handleSectionClick(e, 'contact')}
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
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
    </LayoutGroup>
  )
}
