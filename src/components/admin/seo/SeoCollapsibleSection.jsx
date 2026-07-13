import React, { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Collapsible SEO editor section.
 * @param {{
 *   title: string,
 *   description?: string,
 *   defaultOpen?: boolean,
 *   children: React.ReactNode,
 *   badge?: React.ReactNode,
 * }} props
 */
export default function SeoCollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const buttonId = useId()

  return (
    <section className={`admin-seo-collapse${open ? ' is-open' : ''}`}>
      <button
        id={buttonId}
        type="button"
        className="admin-seo-collapse-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="admin-seo-collapse-copy">
          <span className="admin-seo-collapse-title">{title}</span>
          {description ? <span className="admin-seo-collapse-desc">{description}</span> : null}
        </span>
        <span className="admin-seo-collapse-right">
          {badge}
          <ChevronDown size={18} strokeWidth={1.75} className="admin-seo-collapse-chevron" aria-hidden />
        </span>
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="admin-seo-collapse-body">
          {children}
        </div>
      ) : null}
    </section>
  )
}
