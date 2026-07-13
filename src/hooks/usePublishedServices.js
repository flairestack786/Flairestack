import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  buildPublishedServicesList,
  FALLBACK_PUBLISHED_SERVICES,
  fetchPublishedServicesList,
} from '../lib/publicServicesList'

/** @type {import('../lib/publicServicesList').PublicServiceListItem[] | null} */
let servicesCache = null

/** @type {Promise<import('../lib/publicServicesList').PublicServiceListItem[]> | null} */
let servicesPromise = null

/**
 * Drop cached published services (e.g. after publish/unpublish/create/delete).
 */
export function clearPublishedServicesCache() {
  servicesCache = null
  servicesPromise = null
}

/**
 * @returns {Promise<import('../lib/publicServicesList').PublicServiceListItem[]>}
 */
async function loadPublishedServices() {
  if (servicesCache) {
    return servicesCache
  }

  if (!servicesPromise) {
    servicesPromise = fetchPublishedServicesList()
      .then((rows) => {
        servicesCache = buildPublishedServicesList(rows)
        return servicesCache
      })
      .catch((error) => {
        servicesPromise = null
        throw error
      })
  }

  return servicesPromise
}

const PublishedServicesContext = createContext(null)

/**
 * Provides cached published services for public listings (nav, home, footer).
 * @param {{ children: React.ReactNode }} props
 */
export function PublishedServicesProvider({ children }) {
  const [services, setServices] = useState(
    () => servicesCache ?? FALLBACK_PUBLISHED_SERVICES
  )
  const [loading, setLoading] = useState(() => !servicesCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => {
    let cancelled = false

    loadPublishedServices()
      .then((next) => {
        if (cancelled) return
        setServices(next)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setServices(FALLBACK_PUBLISHED_SERVICES)
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    clearPublishedServicesCache()
    setLoading(true)
    try {
      const next = await loadPublishedServices()
      setServices(next)
      setError(null)
      return next
    } catch (err) {
      setServices(FALLBACK_PUBLISHED_SERVICES)
      setError(err instanceof Error ? err : new Error(String(err)))
      return FALLBACK_PUBLISHED_SERVICES
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({ services, loading, error, refresh }),
    [services, loading, error, refresh]
  )

  return React.createElement(
    PublishedServicesContext.Provider,
    { value },
    children
  )
}

/**
 * @returns {{
 *   services: import('../lib/publicServicesList').PublicServiceListItem[],
 *   loading: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<import('../lib/publicServicesList').PublicServiceListItem[]>,
 * }}
 */
export function usePublishedServices() {
  const context = useContext(PublishedServicesContext)
  if (!context) {
    throw new Error('usePublishedServices must be used within a PublishedServicesProvider.')
  }
  return context
}
