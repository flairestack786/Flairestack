import React from 'react'
import { getEffectiveDescription, getEffectiveTitle } from '../../../lib/seoAnalysis'

/**
 * Live Google SERP-style preview.
 * @param {{
 *   seo: Record<string, unknown>,
 *   siteName?: string,
 *   fallbackPath?: string,
 * }} props
 */
export default function SeoGooglePreview({ seo, siteName = 'FlaireStack', fallbackPath = '/' }) {
  const title = getEffectiveTitle(seo) || 'Page title'
  const description =
    getEffectiveDescription(seo) || 'Add a meta description to control how this page appears in search results.'
  const canonical = String(seo.canonical_url || '').trim()
  let displayUrl = `https://flairestack.com${fallbackPath}`
  try {
    if (canonical) displayUrl = new URL(canonical).href
  } catch {
    /* keep fallback */
  }

  const truncatedTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title
  const truncatedDesc = description.length > 160 ? `${description.slice(0, 157)}…` : description

  return (
    <div className="admin-seo-preview admin-seo-preview--google">
      <p className="admin-seo-preview-kicker">Google Search preview</p>
      <div className="admin-seo-google-card">
        <p className="admin-seo-google-url">{displayUrl}</p>
        <p className="admin-seo-google-title">{truncatedTitle}</p>
        <p className="admin-seo-google-desc">{truncatedDesc}</p>
        <p className="admin-seo-google-site">{siteName}</p>
      </div>
    </div>
  )
}
