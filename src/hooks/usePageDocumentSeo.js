import { useMemo } from 'react'
import { useDocumentSeo } from './useDocumentSeo'
import { useSiteSettings } from './useSiteSettings'
import { buildPublicDocumentSeo } from '../lib/publicSeo'

/**
 * Standard public-page SEO hook for FlaireStack.
 * Resolves page SEO → global defaults → fallbacks, then applies document <head>.
 *
 * Use this for every CMS-managed public route so inheritance stays consistent.
 *
 * @param {{
 *   seoRow?: Record<string, unknown> | null,
 *   pageTitle?: string,
 *   routePath?: string,
 *   entityType?: 'page' | 'service',
 *   fallbackTitle?: string,
 *   fallbackDescription?: string,
 *   ready?: boolean,
 * }} options
 */
export function usePageDocumentSeo({
  seoRow = null,
  pageTitle = '',
  routePath = '/',
  entityType = 'page',
  fallbackTitle = '',
  fallbackDescription = '',
  ready = true,
} = {}) {
  const { settings, loading: settingsLoading } = useSiteSettings()

  const documentSeo = useMemo(
    () =>
      buildPublicDocumentSeo(seoRow, settings, {
        pageTitle,
        routePath,
        entityType,
        fallbackTitle,
        fallbackDescription,
      }),
    [seoRow, settings, pageTitle, routePath, entityType, fallbackTitle, fallbackDescription]
  )

  const canApply = ready && !settingsLoading && Boolean(documentSeo?.title)
  useDocumentSeo(canApply ? documentSeo : null, settings)

  return { documentSeo, settings, ready: canApply }
}
