import React from 'react'

/**
 * @param {{
 *   panelId: string,
 *   labelledBy: string,
 *   title: string,
 *   description: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function EditorSection({ panelId, labelledBy, title, description, children }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 id={labelledBy} className="admin-settings-section-title">
          {title}
        </h2>
        <p className="admin-settings-section-desc">{description}</p>
      </header>

      <div className="admin-settings-fields">{children}</div>
    </section>
  )
}
