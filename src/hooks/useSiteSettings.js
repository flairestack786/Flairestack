import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiLinkedin,
  SiX,
  SiYoutube,
} from 'react-icons/si'
import { getSiteSettings } from '../lib/siteSettings'
import {
  buildPublicSiteSettings,
  FALLBACK_PUBLIC_SETTINGS,
} from '../lib/publicSiteSettings'

/** @type {ReturnType<typeof buildPublicSiteSettings> | null} */
let settingsCache = null

/** @type {Promise<ReturnType<typeof buildPublicSiteSettings>> | null} */
let settingsPromise = null

/** Drop cached public site settings (e.g. after Global SEO / Settings save). */
export function clearSiteSettingsCache() {
  settingsCache = null
  settingsPromise = null
}

const SOCIAL_ICONS = {
  facebook_url: SiFacebook,
  instagram_url: SiInstagram,
  linkedin_url: SiLinkedin,
  x_url: SiX,
  youtube_url: SiYoutube,
  github_url: SiGithub,
}

/**
 * @param {ReturnType<typeof buildPublicSiteSettings>} settings
 * @returns {ReturnType<typeof buildPublicSiteSettings> & { socialLinks: Array<{ href: string, label: string, Icon: typeof SiFacebook }> }}
 */
function withSocialIcons(settings) {
  return {
    ...settings,
    socialLinks: settings.socialLinks
      .filter((link) => link.href)
      .map((link) => ({
        href: link.href,
        label: link.label,
        Icon: SOCIAL_ICONS[link.key],
      })),
  }
}

/**
 * @returns {Promise<ReturnType<typeof buildPublicSiteSettings>>}
 */
async function loadSiteSettings() {
  if (settingsCache) {
    return settingsCache
  }

  if (!settingsPromise) {
    settingsPromise = getSiteSettings()
      .then((row) => {
        settingsCache = withSocialIcons(buildPublicSiteSettings(row))
        return settingsCache
      })
      .catch((error) => {
        settingsPromise = null
        throw error
      })
  }

  return settingsPromise
}

const SiteSettingsContext = createContext(null)

/**
 * Provides cached public site settings to the marketing site.
 * @param {{ children: React.ReactNode }} props
 */
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(
    () => settingsCache ?? withSocialIcons(FALLBACK_PUBLIC_SETTINGS)
  )
  const [loading, setLoading] = useState(() => !settingsCache)
  const [error, setError] = useState(/** @type {Error | null} */ (null))

  useEffect(() => {
    let cancelled = false

    loadSiteSettings()
      .then((nextSettings) => {
        if (cancelled) return
        setSettings(nextSettings)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setSettings(withSocialIcons(FALLBACK_PUBLIC_SETTINGS))
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    settingsCache = null
    settingsPromise = null
    setLoading(true)
    setError(null)

    try {
      const nextSettings = await loadSiteSettings()
      setSettings(nextSettings)
      setLoading(false)
    } catch (err) {
      setSettings(withSocialIcons(FALLBACK_PUBLIC_SETTINGS))
      setLoading(false)
      setError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [])

  const value = useMemo(
    () => ({ settings, loading, error, refresh }),
    [settings, loading, error, refresh]
  )

  return React.createElement(SiteSettingsContext.Provider, { value }, children)
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)

  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider.')
  }

  return context
}
