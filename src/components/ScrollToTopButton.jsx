import React, { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const SCROLL_THRESHOLD = 300

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-top-btn ${visible ? 'scroll-top-btn--visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <ArrowUp size={26} strokeWidth={2.25} className="scroll-top-btn-icon" aria-hidden />
    </button>
  )
}
