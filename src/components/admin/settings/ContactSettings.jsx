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
export default function ContactSettings({ values, onChange, panelId, labelledBy }) {
  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      className="admin-settings-section"
    >
      <header className="admin-settings-section-header">
        <h2 className="admin-settings-section-title">Contact</h2>
        <p className="admin-settings-section-desc">
          Public contact details used in the footer, inquiry flows, and site metadata.
        </p>
      </header>

      <div className="admin-settings-fields">
        <SettingsField id="phone" label="Phone">
          <input
            id="phone"
            type="tel"
            className="admin-settings-input"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            autoComplete="tel"
          />
        </SettingsField>

        <SettingsField id="email" label="Email">
          <input
            id="email"
            type="email"
            className="admin-settings-input"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
            autoComplete="email"
          />
        </SettingsField>

        <SettingsField id="address" label="Address">
          <textarea
            id="address"
            className="admin-settings-textarea admin-settings-field--full"
            rows={3}
            value={values.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </SettingsField>

        <SettingsField
          id="google_maps_url"
          label="Google Maps URL"
          hint="Link to your business location on Google Maps."
        >
          <input
            id="google_maps_url"
            type="url"
            className="admin-settings-input"
            value={values.google_maps_url}
            onChange={(e) => onChange('google_maps_url', e.target.value)}
            placeholder="https://maps.google.com/…"
          />
        </SettingsField>
      </div>
    </section>
  )
}
