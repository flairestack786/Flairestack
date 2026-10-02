'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Public `/services/[slug]` scroll reset (Vite ServiceDetail parity).
 *
 * Next App Router soft-navigations between shared public layouts can leave the
 * window at the prior page's scrollY (especially from the footer). Force top
 * for forward service navigations only.
 *
 * - Skips when the URL has a hash (section jump).
 * - Skips the next effect after `popstate` so back/forward can restore scroll.
 */
export default function ServicePageScrollReset() {
  const pathname = usePathname()
  const skipForPopNavigation = useRef(false)

  useEffect(() => {
    const onPopState = () => {
      skipForPopNavigation.current = true
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useLayoutEffect(() => {
    if (!pathname?.startsWith('/services/')) return
    if (window.location.hash) return

    if (skipForPopNavigation.current) {
      skipForPopNavigation.current = false
      return
    }

    // `behavior: 'auto'` overrides root `scroll-behavior: smooth` so the page
    // does not animate from the previous scroll position.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
