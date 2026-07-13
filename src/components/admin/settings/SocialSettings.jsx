import React from 'react'

const SOCIAL_FIELDS = [
  { id: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/…' },
  { id: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { id: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
  { id: 'x_url', label: 'X (Twitter)', placeholder: 'https://x.com/…' },
  { id: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/…' },
  { id: 'github_url', label: 'GitHub', placeholder: 'https://github.com/…' },
]

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function SocialSettings({ values, onChange, panelId, labelledBy }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 className="admin-settings-section-title">Social</h2>
        <p className="admin-settings-section-desc">
          Social profile URLs displayed in the footer and shared metadata.
        </p>
      </header>

      <div className="admin-settings-fields">
        {SOCIAL_FIELDS.map(({ id, label, placeholder }) => (
          <div key={id} className="admin-settings-field">
            <label htmlFor={id} className="admin-settings-label">
              {label}
            </label>
            <input
              id={id}
              type="url"
              className="admin-settings-input"
              value={values[id]}
              onChange={(e) => onChange(id, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
