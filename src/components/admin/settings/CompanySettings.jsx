import React from 'react'

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   hint?: string,
 *   children: React.ReactNode,
 * }} props
 */
function SettingsField({ id, label, hint, children }) {
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

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function CompanySettings({ values, onChange, panelId, labelledBy }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 className="admin-settings-section-title">Company</h2>
        <p className="admin-settings-section-desc">
          Core business identity shown across the public site and admin.
        </p>
      </header>

      <div className="admin-settings-fields">
        <SettingsField id="company_name" label="Company name">
          <input
            id="company_name"
            type="text"
            className="admin-settings-input"
            value={values.company_name}
            onChange={(e) => onChange('company_name', e.target.value)}
            autoComplete="organization"
            required
          />
        </SettingsField>

        <SettingsField id="tagline" label="Tagline">
          <input
            id="tagline"
            type="text"
            className="admin-settings-input"
            value={values.tagline}
            onChange={(e) => onChange('tagline', e.target.value)}
          />
        </SettingsField>

        <SettingsField id="copyright_text" label="Copyright text">
          <input
            id="copyright_text"
            type="text"
            className="admin-settings-input"
            value={values.copyright_text}
            onChange={(e) => onChange('copyright_text', e.target.value)}
          />
        </SettingsField>

        <SettingsField
          id="business_hours"
          label="Business hours"
          hint="Displayed in contact areas and structured data when enabled."
        >
          <input
            id="business_hours"
            type="text"
            className="admin-settings-input"
            value={values.business_hours}
            onChange={(e) => onChange('business_hours', e.target.value)}
            placeholder="Monday–Friday, 9:00 AM – 6:00 PM CT"
          />
        </SettingsField>

        <SettingsField id="timezone" label="Timezone">
          <input
            id="timezone"
            type="text"
            className="admin-settings-input"
            value={values.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            placeholder="America/Chicago"
          />
        </SettingsField>
      </div>
    </section>
  )
}
