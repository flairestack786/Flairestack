import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  buildPublishedTestimonials,
  FALLBACK_HOME_TESTIMONIALS,
  FALLBACK_SERVICE_TESTIMONIALS,
} from '../lib/publicTestimonials'
import { fetchPublishedTestimonials } from '../lib/testimonials'

/** @type {ReturnType<typeof buildPublishedTestimonials> | null} */
let testimonialsCache = null

/** @type {Promise<ReturnType<typeof buildPublishedTestimonials>> | null} */
let testimonialsPromise = null

/**
 * Drop cached published testimonials (e.g. after publish/unpublish/create/delete).
 */
export function clearPublishedTestimonialsCache() {
  testimonialsCache = null
  testimonialsPromise = null
}

/**
 * @returns {Promise<ReturnType<typeof buildPublishedTestimonials>>}
 */
async function loadPublishedTestimonials() {
  if (testimonialsCache) {
    return testimonialsCache
  }

  if (!testimonialsPromise) {
    testimonialsPromise = fetchPublishedTestimonials()
      .then((rows) => {
        testimonialsCache = buildPublishedTestimonials(rows, 'home')
        return testimonialsCache
      })
      .catch((error) => {
        testimonialsPromise = null
        throw error
      })
  }

  return testimonialsPromise
}

const PublishedTestimonialsContext = createContext(null)

/**
 * Provides cached published testimonials for Home and Service pages.
 * @param {{ children: React.ReactNode }} props
 */
export function PublishedTestimonialsProvider({ children }) {
  const [testimonials, setTestimonials] = useState(
    () => testimonialsCache ?? FALLBACK_HOME_TESTIMONIALS
  )
  const [loading, setLoading] = useState(() => !testimonialsCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => {
    let cancelled = false

    loadPublishedTestimonials()
      .then((next) => {
        if (cancelled) return
        setTestimonials(next)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setTestimonials(FALLBACK_HOME_TESTIMONIALS)
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    clearPublishedTestimonialsCache()
    setLoading(true)
    try {
      const next = await loadPublishedTestimonials()
      setTestimonials(next)
      setError(null)
      return next
    } catch (err) {
      setTestimonials(FALLBACK_HOME_TESTIMONIALS)
      setError(err instanceof Error ? err : new Error(String(err)))
      return FALLBACK_HOME_TESTIMONIALS
    } finally {
      setLoading(false)
    }
  }, [])

  const serviceTestimonials = useMemo(() => {
    if (!testimonials.length) return FALLBACK_SERVICE_TESTIMONIALS
    return testimonials.map((item) => ({
      ...item,
      stat: item.stat || '—',
      statLabel: item.statLabel || 'Impact',
    }))
  }, [testimonials])

  const value = useMemo(
    () => ({
      testimonials,
      serviceTestimonials,
      loading,
      error,
      refresh,
    }),
    [testimonials, serviceTestimonials, loading, error, refresh]
  )

  return React.createElement(PublishedTestimonialsContext.Provider, { value }, children)
}

/**
 * @returns {{
 *   testimonials: ReturnType<typeof buildPublishedTestimonials>,
 *   serviceTestimonials: ReturnType<typeof buildPublishedTestimonials>,
 *   loading: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<ReturnType<typeof buildPublishedTestimonials>>,
 * }}
 */
export function usePublishedTestimonials() {
  const context = useContext(PublishedTestimonialsContext)
  if (!context) {
    throw new Error('usePublishedTestimonials must be used within a PublishedTestimonialsProvider.')
  }
  return context
}

/** Alias matching the requested hook name. */
export const useTestimonials = usePublishedTestimonials
