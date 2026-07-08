import React, { useEffect, useState } from 'react'

export default function Loader({ active }) {
  const [mounted, setMounted] = useState(active)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (active) {
      setMounted(true)
      setExiting(false)
      return
    }

    if (mounted) setExiting(true)
  }, [active, mounted])

  if (!mounted) return null

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'opacity' || !exiting) return
    setMounted(false)
  }

  return (
    <div
      className={`app-loader ${exiting ? 'app-loader--exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading FlaireStack"
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="app-loader-inner">
        <div className="app-loader-ring" aria-hidden />
        <p className="app-loader-brand">
          Flaire<span className="app-loader-brand-accent">Stack</span>
        </p>
      </div>
    </div>
  )
}
