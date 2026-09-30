'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Honor `/#section` and hash changes after Home mounts (parity with Vite Home scroll). */
export default function HomeHashScroller() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/') return

    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return

    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)

    return () => window.clearTimeout(timer)
  }, [pathname])

  return null
}
