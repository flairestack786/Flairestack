import { useEffect } from 'react'
import { applyPublicSeo } from '../lib/publicSeo'

/**
 * Apply resolved document SEO to <head> for public pages.
 * @param {Record<string, unknown> | null | undefined} documentSeo
 * @param {Record<string, unknown> | null | undefined} [settings]
 */
export function useDocumentSeo(documentSeo, settings) {
  useEffect(() => {
    if (!documentSeo?.title) return undefined
    return applyPublicSeo(documentSeo, settings)
  }, [documentSeo, settings])
}
