import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
import { useNavActive } from '../hooks/useNavActive'
import { scrollToHomeSection, scrollToHomeTop } from '../utils/scrollToSection'
import { services } from '../data/services'

const EASE = [0.22, 1, 0.36, 1]
const OVERLAY_MS = 0.35

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: OVERLAY_MS, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.28, ease: EASE } },
}

const itemMotion = (index) => ({
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { delay: 0.06 + index * 0.05, duration: 0.38, ease: EASE },
})

function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    const { overflow, paddingRight } = document.body.style
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}

function useFocusTrap(containerRef, active, onClose) {
  useEffect(() => {
    if (!active || !containerRef.current) return undefined

    const container = containerRef.current
    const getFocusable = () =>
      Array.from(
        container.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

    const previouslyFocused = document.activeElement
    requestAnimationFrame(() => getFocusable()[0]?.focus())

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = getFocusable()
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [active, containerRef, onClose])
}

export default function MobileMenu({ open, onClose }) {
  const navigate = useNavigate()
  const { isNavItemActive, isServiceActive } = useNavActive()
  const panelRef = useRef(null)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useScrollLock(open)
  useFocusTrap(panelRef, open, onClose)

  useEffect(() => {
    if (!open) setServicesOpen(false)
  }, [open])

  const handleSectionClick = useCallback(
    (e, sectionId) => {
      e.preventDefault()
      onClose()
      scrollToHomeSection(sectionId, navigate)
    },
    [navigate, onClose]
  )

  const handleHomeClick = (e) => {
    e.preventDefault()
    onClose()
    scrollToHomeTop(navigate)
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    onClose()
    scrollToHomeTop(navigate)
  }

  const handleServiceClick = () => onClose()

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="mmenu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div ref={panelRef} className="mmenu-inner">
            <header className="mmenu-header">
              <Link to="/" className="site-logo mmenu-logo" onClick={handleLogoClick}>
                <span className="site-logo-text">FlaireStack</span>
                <span className="logo-accent" aria-hidden />
              </Link>

              <motion.button
                type="button"
                className="mmenu-close"
                onClick={onClose}
                aria-label="Close menu"
                whileTap={{ scale: 0.92 }}
              >
                <X size={20} strokeWidth={2.25} aria-hidden />
              </motion.button>
            </header>

            <nav
              className={`mmenu-nav ${servicesOpen ? 'mmenu-nav--expanded' : ''}`}
              id="mobile-navigation"
              aria-label="Mobile"
            >
              <ul className="mmenu-list">
                <motion.li className="mmenu-item" {...itemMotion(0)}>
                  <a
                    href="/"
                    className={`mmenu-row ${isNavItemActive('home') ? 'mmenu-row--active' : ''}`}
                    onClick={handleHomeClick}
                  >
                    <span className="mmenu-row-label">Home</span>
                  </a>
                </motion.li>

                <motion.li className="mmenu-item" {...itemMotion(1)}>
                  <Link
                    to="/about"
                    className={`mmenu-row ${isNavItemActive('about') ? 'mmenu-row--active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="mmenu-row-label">About</span>
                  </Link>
                </motion.li>

                <motion.li className="mmenu-item mmenu-item--services" {...itemMotion(2)}>
                  <button
                    type="button"
                    className={`mmenu-row mmenu-row--has-arrow ${isNavItemActive('services') ? 'mmenu-row--active' : ''}`}
                    aria-expanded={servicesOpen}
                    aria-controls="mmenu-services-panel"
                    onClick={() => setServicesOpen((prev) => !prev)}
                  >
                    <span className="mmenu-row-label">Services</span>
                    <span className="mmenu-row-arrow-wrap" aria-hidden>
                      <ArrowRight
                        size={22}
                        strokeWidth={2}
                        className={`mmenu-row-arrow ${servicesOpen ? 'mmenu-row-arrow--open' : ''}`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {servicesOpen && (
                      <motion.div
                        id="mmenu-services-panel"
                        className="mmenu-services-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <div className="mmenu-services-scroll">
                          <ul className="mmenu-services-list">
                            {services.map((service, i) => (
                              <motion.li
                                key={service.slug}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.28, ease: EASE }}
                              >
                                <Link
                                  to={`/services/${service.slug}`}
                                  className={`mmenu-service-link ${isServiceActive(service.slug) ? 'mmenu-service-link--active' : ''}`}
                                  onClick={handleServiceClick}
                                >
                                  {service.title}
                                </Link>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>

                <motion.li className="mmenu-item" {...itemMotion(3)}>
                  <a
                    href="/#contact"
                    className={`mmenu-row ${isNavItemActive('contact') ? 'mmenu-row--active' : ''}`}
                    onClick={(e) => handleSectionClick(e, 'contact')}
                  >
                    <span className="mmenu-row-label">Contact</span>
                  </a>
                </motion.li>
              </ul>
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
