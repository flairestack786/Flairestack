import React from 'react'

export default function AdminPlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        {Icon && (
          <span className="admin-page-icon" aria-hidden>
            <Icon size={22} strokeWidth={1.75} />
          </span>
        )}
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {description && <p className="admin-page-desc">{description}</p>}
        </div>
      </header>
      <div className="admin-page-placeholder">
        <p>Content management for this section is coming soon.</p>
      </div>
    </div>
  )
}
