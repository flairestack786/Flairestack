import React from 'react'
import SettingsImageField from './SettingsImageField'

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
 *   onChooseImage: (field: string) => void,
 *   onRemoveImage: (field: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function SeoSettings({
  values,
  onChange,
  onChooseImage,
  onRemoveImage,
  panelId,
  labelledBy,
}) {
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
          Default metadata used when pages do not define their own SEO values.
        </p>
      </header>

      <div className="admin-settings-fields">
        <SettingsField id="default_meta_title" label="Default meta title">
          <input
            id="default_meta_title"
            type="text"
            className="admin-settings-input"
            value={values.default_meta_title}
            onChange={(e) => onChange('default_meta_title', e.target.value)}
          />
        </SettingsField>

        <SettingsField id="default_meta_description" label="Default meta description">
          <textarea
            id="default_meta_description"
            className="admin-settings-textarea admin-settings-field--full"
            rows={4}
            value={values.default_meta_description}
            onChange={(e) => onChange('default_meta_description', e.target.value)}
          />
        </SettingsField>

        <SettingsField
          id="default_keywords"
          label="Default keywords"
          hint="Comma-separated keywords for fallback SEO."
        >
          <input
            id="default_keywords"
            type="text"
            className="admin-settings-input"
            value={values.default_keywords}
            onChange={(e) => onChange('default_keywords', e.target.value)}
          />
        </SettingsField>

        <SettingsImageField
          label="Default OG image"
          field="default_og_image"
          path={values.default_og_image}
          emptyLabel="No Open Graph image selected"
          onChoose={onChooseImage}
          onRemove={onRemoveImage}
        />
      </div>
    </section>
  )
}
