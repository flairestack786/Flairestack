import React from 'react'

const ANALYTICS_FIELDS = [
  {
    id: 'google_analytics_id',
    label: 'Google Analytics ID',
    placeholder: 'G-XXXXXXXXXX',
    hint: 'GA4 measurement ID.',
  },
  {
    id: 'google_tag_manager_id',
    label: 'Google Tag Manager ID',
    placeholder: 'GTM-XXXXXXX',
    hint: 'Container ID for GTM.',
  },
  {
    id: 'meta_pixel_id',
    label: 'Meta Pixel ID',
    placeholder: '123456789012345',
    hint: 'Facebook / Meta Pixel identifier.',
  },
  {
    id: 'microsoft_clarity_id',
    label: 'Microsoft Clarity ID',
    placeholder: 'abcdefghij',
    hint: 'Clarity project ID.',
  },
]

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function AnalyticsSettings({ values, onChange, panelId, labelledBy }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 className="admin-settings-section-title">Analytics</h2>
        <p className="admin-settings-section-desc">
          Tracking and analytics IDs injected into the public site when configured.
        </p>
      </header>

      <div className="admin-settings-fields">
        {ANALYTICS_FIELDS.map(({ id, label, placeholder, hint }) => (
          <div key={id} className="admin-settings-field">
            <label htmlFor={id} className="admin-settings-label">
              {label}
            </label>
            <input
              id={id}
              type="text"
              className="admin-settings-input"
              value={values[id]}
              onChange={(e) => onChange(id, e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              autoComplete="off"
            />
            <p className="admin-settings-hint">{hint}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
