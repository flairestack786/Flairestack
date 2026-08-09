import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'

/**
 * Settings → SEO tab: redirect only. Global SEO is edited at /admin/seo/global.
 * Settings is admin-only, so this link stays within Admin RBAC.
 *
 * @param {{
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function SeoSettings({ panelId, labelledBy }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 className="admin-settings-section-title">SEO</h2>
        <p className="admin-settings-section-desc">
          Global SEO settings are managed in the SEO module.
        </p>
      </header>

      <div className="admin-seo-module-redirect">
        <span className="admin-seo-module-redirect-icon" aria-hidden>
          <Search size={22} strokeWidth={1.75} />
        </span>
        <div className="admin-seo-module-redirect-copy">
          <p className="admin-seo-module-redirect-title">Global SEO</p>
          <p className="admin-seo-module-redirect-text">
            Edit site-wide defaults, templates, robots, verification tags, social images, and
            JSON-LD from the SEO module. This Settings tab no longer edits those fields.
          </p>
        </div>
        <Link to="/admin/seo/global" className="admin-settings-retry admin-seo-module-redirect-cta">
          Open Global SEO
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
