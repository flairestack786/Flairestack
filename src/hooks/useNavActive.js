import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const HOME_SECTIONS = ['services', 'contact']

export function useNavActive() {
  const location = useLocation()
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (location.pathname === '/about') {
      setActiveId('about')
      return
    }

    if (location.pathname !== '/') {
      setActiveId(null)
      return
    }

    const elements = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean)
    if (!elements.length) return

    const visible = new Set()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        })

        const ordered = HOME_SECTIONS.filter((id) => visible.has(id))
        setActiveId(ordered[ordered.length - 1] ?? null)
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: [0, 0.12, 0.35] }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [location.pathname, location.hash])

  const isActive = (id) => activeId === id

  const isNavItemActive = (id) => {
    if (id === 'home') return location.pathname === '/' && activeId === null
    if (id === 'about') return location.pathname === '/about'
    if (id === 'services') {
      return activeId === 'services' || location.pathname.startsWith('/services/')
    }
    if (id === 'contact') return activeId === 'contact'
    return activeId === id
  }

  const isServiceActive = (slug) => location.pathname === `/services/${slug}`

  return { isActive, activeId, isNavItemActive, isServiceActive, location }
}
