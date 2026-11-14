'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Centralized public-site scroll reset for App Router soft navigations.
 *
 * Soft navigations between shared layouts can leave window.scrollY from the
 * previous page. On each pathname change without a hash, force the destination
 * to the top. Hash URLs (e.g. `/#contact`) are left alone so HomeHashScroller
 * and section links keep working.
 */
export default function PublicScrollToTop() {
  const pathname = usePathname()
  const previousPathname = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) return
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    if (!pathname) return

    const pathChanged = previousPathname.current !== pathname
    previousPathname.current = pathname
    if (!pathChanged) return

    if (window.location.hash) return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
