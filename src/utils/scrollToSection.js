/**
 * Navigate to a homepage section with smooth scrolling.
 * Works from any route (home, service pages, about).
 */
export function scrollToHomeSection(sectionId, navigate) {
  const id = sectionId.replace(/^#/, '')

  if (window.location.pathname === '/') {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `/#${id}`)
    }
    return
  }

  navigate('/', { state: { scrollTo: id } })
}

/** Scroll to the top of the home page, or navigate there from another route. */
export function scrollToHomeTop(navigate) {
  if (window.location.pathname === '/') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.replaceState(null, '', '/')
    return
  }

  navigate('/', { state: { scrollToTop: true } })
}

export function resolveHomeScrollTarget(location) {
  if (location.pathname !== '/') return null
  if (location.state?.scrollTo) return location.state.scrollTo
  const hash = location.hash?.replace(/^#/, '')
  return hash || null
}
