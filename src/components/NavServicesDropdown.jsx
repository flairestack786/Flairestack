import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePublishedServices } from '../hooks/usePublishedServices'
import { useNavActive } from '../hooks/useNavActive'

const VIEWPORT_MARGIN = 12
const PANEL_GAP = 14

export default function NavServicesDropdown() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)
  const containerRef = useRef(null)
  const panelRef = useRef(null)
  const [coords, setCoords] = useState(null)
  const { services } = usePublishedServices()
  const { isNavItemActive, isServiceActive } = useNavActive()

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 100)
  }

  const cancelHide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  // Keep the fixed-position panel anchored under the trigger while clamping it
  // inside the viewport so it can never render off-screen horizontally.
  const positionPanel = useCallback(() => {
    const trigger = containerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const triggerRect = trigger.getBoundingClientRect()
    const panelWidth = panel.offsetWidth
    const viewportWidth = document.documentElement.clientWidth

    const triggerCenter = triggerRect.left + triggerRect.width / 2
    const maxLeft = viewportWidth - panelWidth - VIEWPORT_MARGIN
    const minLeft = VIEWPORT_MARGIN
    const left = Math.max(minLeft, Math.min(triggerCenter - panelWidth / 2, maxLeft))

    setCoords({ top: triggerRect.bottom + PANEL_GAP, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) return undefined
    positionPanel()
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, { passive: true })
    return () => {
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel)
    }
  }, [open, positionPanel, services.length])

  return (
    <div
      className="nav-dropdown"
      ref={containerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        type="button"
        className={`nav-link nav-dropdown-trigger ${isNavItemActive('services') ? 'nav-link--active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="nav-services-menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="nav-dropdown-trigger-text">Services</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={`nav-dropdown-chevron ${open ? 'nav-dropdown-chevron--open' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-services-menu"
            ref={panelRef}
            role="menu"
            className="nav-dropdown-panel"
            style={{
              top: coords ? `${coords.top}px` : undefined,
              left: coords ? `${coords.left}px` : undefined,
              visibility: coords ? 'visible' : 'hidden',
            }}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelHide}
            onMouseLeave={hide}
          >
            <p className="nav-dropdown-label">All Services</p>
            <ul className="nav-dropdown-list">
              {services.map((service) => (
                <li key={service.slug} role="none">
                  <Link
                    to={`/services/${service.slug}`}
                    role="menuitem"
                    className={`nav-dropdown-link ${isServiceActive(service.slug) ? 'nav-dropdown-link--active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
