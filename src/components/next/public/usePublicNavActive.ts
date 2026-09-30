'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { publicServicePath } from '@/lib/serviceSlug'

const HOME_SECTIONS = ['services', 'contact']

/**
 * Next port of Vite useNavActive — uses App Router pathname instead of React Router.
 */
export function usePublicNavActive() {
  const pathname = usePathname() ?? '/'
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/about') {
      setActiveId('about')
      return
    }

    if (pathname !== '/') {
      setActiveId(null)
      return
    }

    const elements = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[]
    if (!elements.length) return

    const visible = new Set<string>()

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
  }, [pathname])

  const isActive = (id: string) => activeId === id

  const isNavItemActive = (id: string) => {
    if (id === 'home') return pathname === '/' && activeId === null
    if (id === 'about') return pathname === '/about'
    if (id === 'services') {
      return activeId === 'services' || pathname.startsWith('/services/')
    }
    if (id === 'contact') return activeId === 'contact'
    return activeId === id
  }

  const isServiceActive = (slug: string) => pathname === publicServicePath(slug)

  return { isActive, activeId, isNavItemActive, isServiceActive, pathname }
}
