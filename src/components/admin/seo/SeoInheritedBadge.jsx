import React from 'react'

/**
 * Label badge when a field value is inherited from global SEO.
 * @param {{ inherited?: boolean, source?: string }} props
 */
export default function SeoInheritedBadge({ inherited = false, source = 'global' }) {
  if (!inherited) return null
  return (
    <span className="admin-seo-inherited-pill" title={`Using ${source} default until overridden`}>
      Inherited from {source === 'page_description' ? 'page description' : 'global'}
    </span>
  )
}
