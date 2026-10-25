import React from 'react'
import { ArrowRight, Search } from 'lucide-react'
import EditorSection from '../home/EditorSection'

/**
 * Service editor SEO tab: redirect only. Per-service SEO is edited in the SEO module.
 *
 * @param {{
 *   serviceId: string,
 *   panelId: string,
 *   labelledBy: string,
 *   LinkComponent?: React.ComponentType<{ href: string, className?: string, children?: React.ReactNode }>,
 * }} props
 */
export default function SeoEditor({ serviceId, panelId, labelledBy, LinkComponent }) {
  const seoPath = serviceId ? `/admin/seo/service/${serviceId}` : '/admin/seo'
  const linkClassName = 'admin-settings-retry admin-seo-module-redirect-cta'
  const linkChildren = (
    <>
      Edit SEO
      <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
    </>
  )

  const Link = LinkComponent ?? (({ href, className, children }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ))

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="SEO"
      description="SEO settings are managed in the SEO module."
    >
      <div className="admin-seo-module-redirect">
        <span className="admin-seo-module-redirect-icon" aria-hidden>
          <Search size={22} strokeWidth={1.75} />
        </span>
        <div className="admin-seo-module-redirect-copy">
          <p className="admin-seo-module-redirect-title">Service SEO</p>
          <p className="admin-seo-module-redirect-text">
            Edit meta tags, social cards, images, structured data, keywords, and SEO score in the
            full SEO editor. This service tab no longer duplicates those fields.
          </p>
        </div>
        <Link href={seoPath} className={linkClassName}>
          {linkChildren}
        </Link>
      </div>
    </EditorSection>
  )
}
