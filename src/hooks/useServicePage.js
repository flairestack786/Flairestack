import { useEffect, useState } from 'react'
import { getServiceBySlug } from '../data/services'
import { fetchPublishedService, buildPublicServicePage } from '../lib/publicServicePage'

/** @type {Map<string, { service: object, page: object, seo: object }>} */
const cache = new Map()

/**
 * Drop a cached public service payload (e.g. after publish/unpublish).
 * @param {string} [slug]
 */
export function clearPublicServiceCache(slug) {
  if (!slug) {
    cache.clear()
    return
  }
  cache.delete(String(slug).trim().toLowerCase())
}

/**
 * Load a published service page by slug (CMS). Misses are not cached so
 * publishing a draft becomes visible without a full browser reload.
 * @param {string | undefined} slug
 */
export function useServicePage(slug) {
  const normalizedSlug = String(slug ?? '').trim().toLowerCase()
  const cached = normalizedSlug ? cache.get(normalizedSlug) : null

  const [page, setPage] = useState(() => cached?.page ?? null)
  const [service, setService] = useState(() => cached?.service ?? null)
  const [seo, setSeo] = useState(() => cached?.seo ?? null)
  const [loading, setLoading] = useState(() => Boolean(normalizedSlug) && !cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    if (!normalizedSlug) {
      setPage(null)
      setService(null)
      setSeo(null)
      setLoading(false)
      setError(null)
      return undefined
    }

    const hit = cache.get(normalizedSlug)
    if (hit) {
      setPage(hit.page)
      setService(hit.service)
      setSeo(hit.seo)
      setLoading(false)
      setError(null)
      return undefined
    }

    setLoading(true)
    setError(null)
    setPage(null)
    setService(null)
    setSeo(null)

    ;(async () => {
      try {
        const raw = await fetchPublishedService(normalizedSlug)
        if (cancelled) return

        if (!raw) {
          // Do not cache misses — draft→publish must be visible on next visit.
          setPage(null)
          setService(null)
          setSeo(null)
          return
        }

        const built = buildPublicServicePage(
          raw.service,
          raw.sections,
          raw.media,
          raw.seo,
          getServiceBySlug(normalizedSlug)
        )
        if (!built) {
          setPage(null)
          setService(null)
          setSeo(null)
          return
        }

        cache.set(normalizedSlug, built)
        setPage(built.page)
        setService(built.service)
        setSeo(built.seo)
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setPage(null)
          setService(null)
          setSeo(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [normalizedSlug])

  return { page, service, seo, loading, error }
}
