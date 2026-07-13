import React from 'react'

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   hint?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function EditorField({ id, label, hint, children }) {
  return (
    <div className="admin-settings-field">
      <label htmlFor={id} className="admin-settings-label">
        {label}
      </label>
      {children}
      {hint && <p className="admin-settings-hint">{hint}</p>}
    </div>
  )
}
