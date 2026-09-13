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
  fetchPublishedServicesList,
} from '../lib/publicServicesList'

/** @type {import('../lib/publicServicesList').PublicServiceListItem[] | null} */
let servicesCache = null

/** @type {Promise<import('../lib/publicServicesList').PublicServiceListItem[]> | null} */
let servicesPromise = null

let publishedServicesEpoch = 0

/** @type {Set<(epoch: number) => void>} */
const publishedServicesListeners = new Set()

/**
 * Drop cached published services (e.g. after publish/unpublish/create/delete/rename).
 * Mounted public providers refetch so nav/cards/footer pick up the new slug.
 */
export function clearPublishedServicesCache() {
  servicesCache = null
  servicesPromise = null
  publishedServicesEpoch += 1
  publishedServicesListeners.forEach((listener) => listener(publishedServicesEpoch))
}

/**
 * @param {(epoch: number) => void} listener
 * @returns {() => void}
 */
function subscribePublishedServicesEpoch(listener) {
  publishedServicesListeners.add(listener)
  return () => publishedServicesListeners.delete(listener)
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
 * Slugs always come from live CMS rows, never from the static catalog.
 * @param {{ children: React.ReactNode }} props
 */
export function PublishedServicesProvider({ children }) {
  const [epoch, setEpoch] = useState(publishedServicesEpoch)
  const [services, setServices] = useState(
    () => servicesCache ?? []
  )
  const [loading, setLoading] = useState(() => !servicesCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => subscribePublishedServicesEpoch(setEpoch), [])

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
        setServices([])
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [epoch])

  const refresh = useCallback(async () => {
    clearPublishedServicesCache()
    setLoading(true)
    try {
      const next = await loadPublishedServices()
      setServices(next)
      setError(null)
      return next
    } catch (err) {
      setServices([])
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
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
