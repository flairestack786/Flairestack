'use client'

import { useRouter, usePathname } from 'next/navigation'

/**
 * Next-friendly home section navigation (replaces Vite scrollToSection + useNavigate).
 */
export function usePublicHomeNavigation() {
  const router = useRouter()
  const pathname = usePathname() ?? '/'

  const scrollToHomeTop = (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    router.push('/')
  }

  const scrollToHomeSection = (sectionId: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    router.push(`/#${sectionId}`)
  }

  return { scrollToHomeTop, scrollToHomeSection, pathname, router }
}
