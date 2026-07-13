import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  buildPublicHomePage,
  FALLBACK_PUBLIC_HOME,
  fetchPublishedHomePage,
} from '../lib/publicHomePage'

/** @type {ReturnType<typeof buildPublicHomePage> | null} */
let homePageCache = null

/** @type {Promise<ReturnType<typeof buildPublicHomePage>> | null} */
let homePagePromise = null

/** Drop cached public Home page content (e.g. after CMS save). */
export function clearHomePageCache() {
  homePageCache = null
  homePagePromise = null
}

/**
 * @returns {Promise<ReturnType<typeof buildPublicHomePage>>}
 */
async function loadHomePage() {
  if (homePageCache) {
    return homePageCache
  }

  if (!homePagePromise) {
    homePagePromise = fetchPublishedHomePage()
      .then((result) => {
        homePageCache = result
          ? buildPublicHomePage(result.page, result.sections, result.seo)
          : buildPublicHomePage(null, [], null)
        return homePageCache
      })
      .catch((error) => {
        homePagePromise = null
        throw error
      })
  }

  return homePagePromise
}

const HomePageContext = createContext(null)

/**
 * Provides cached public Home page CMS content to homepage sections.
 * @param {{ children: React.ReactNode }} props
 */
export function HomePageProvider({ children }) {
  const [pageData, setPageData] = useState(() => homePageCache ?? FALLBACK_PUBLIC_HOME)
  const [loading, setLoading] = useState(() => !homePageCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => {
    let cancelled = false

    loadHomePage()
      .then((nextPageData) => {
        if (cancelled) return
        setPageData(nextPageData)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setPageData(FALLBACK_PUBLIC_HOME)
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    homePageCache = null
    homePagePromise = null
    setLoading(true)
    setError(null)

    try {
      const nextPageData = await loadHomePage()
      setPageData(nextPageData)
      setLoading(false)
    } catch (err) {
      setPageData(FALLBACK_PUBLIC_HOME)
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

  return React.createElement(HomePageContext.Provider, { value }, children)
}

/**
 * Read cached Home page CMS content.
 * @returns {{
 *   page: ReturnType<typeof buildPublicHomePage>['page'],
 *   sections: ReturnType<typeof buildPublicHomePage>['sections'],
 *   seo: ReturnType<typeof buildPublicHomePage>['seo'],
 *   loading: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useHomePage() {
  const context = useContext(HomePageContext)

  if (!context) {
    throw new Error('useHomePage must be used within a HomePageProvider.')
  }

  return context
}
