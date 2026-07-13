import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  buildPublicAboutPage,
  FALLBACK_PUBLIC_ABOUT,
  fetchPublishedAboutPage,
} from '../lib/publicAboutPage'

/** @type {ReturnType<typeof buildPublicAboutPage> | null} */
let aboutPageCache = null

/** @type {Promise<ReturnType<typeof buildPublicAboutPage>> | null} */
let aboutPagePromise = null

/** Drop cached public About page content (e.g. after CMS / SEO save). */
export function clearAboutPageCache() {
  aboutPageCache = null
  aboutPagePromise = null
}

/**
 * @returns {Promise<ReturnType<typeof buildPublicAboutPage>>}
 */
async function loadAboutPage() {
  if (aboutPageCache) {
    return aboutPageCache
  }

  if (!aboutPagePromise) {
    aboutPagePromise = fetchPublishedAboutPage()
      .then((result) => {
        aboutPageCache = result
          ? buildPublicAboutPage(result.page, result.sections, result.seo)
          : buildPublicAboutPage(null, [], null)
        return aboutPageCache
      })
      .catch((error) => {
        aboutPagePromise = null
        throw error
      })
  }

  return aboutPagePromise
}

const AboutPageContext = createContext(null)

/**
 * Provides cached public About page CMS content.
 * @param {{ children: React.ReactNode }} props
 */
export function AboutPageProvider({ children }) {
  const [pageData, setPageData] = useState(() => aboutPageCache ?? FALLBACK_PUBLIC_ABOUT)
  const [loading, setLoading] = useState(() => !aboutPageCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => {
    let cancelled = false

    loadAboutPage()
      .then((nextPageData) => {
        if (cancelled) return
        setPageData(nextPageData)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setPageData(FALLBACK_PUBLIC_ABOUT)
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    aboutPageCache = null
    aboutPagePromise = null
    setLoading(true)
    setError(null)

    try {
      const nextPageData = await loadAboutPage()
      setPageData(nextPageData)
      setLoading(false)
    } catch (err) {
      setPageData(FALLBACK_PUBLIC_ABOUT)
      setLoading(false)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [])

  const value = useMemo(
    () => ({
      page: pageData.page,
      sections: pageData.sections,
      seo: pageData.seo,
      loading,
      error,
      refresh,
    }),
    [pageData, loading, error, refresh]
  )

  return React.createElement(AboutPageContext.Provider, { value }, children)
}

/**
 * Read cached About page CMS content.
 * @returns {{
 *   page: ReturnType<typeof buildPublicAboutPage>['page'],
 *   sections: ReturnType<typeof buildPublicAboutPage>['sections'],
 *   seo: ReturnType<typeof buildPublicAboutPage>['seo'],
 *   loading: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useAboutPage() {
  const context = useContext(AboutPageContext)

  if (!context) {
    throw new Error('useAboutPage must be used within an AboutPageProvider.')
  }

  return context
}
