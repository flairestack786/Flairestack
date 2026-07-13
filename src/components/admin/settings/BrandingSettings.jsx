import React from 'react'
import SettingsImageField from './SettingsImageField'

/**
 * @param {{
 *   values: Record<string, string>,
 *   onChooseImage: (field: string) => void,
 *   onRemoveImage: (field: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function BrandingSettings({
  values,
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
        <h2 className="admin-settings-section-title">Branding</h2>
        <p className="admin-settings-section-desc">
          Logo and favicon assets for the public site and browser chrome.
        </p>
      </header>

      <div className="admin-settings-fields admin-settings-fields--media">
        <SettingsImageField
          label="Company logo"
          field="logo_url"
          path={values.logo_url}
          emptyLabel="No company logo selected"
          onChoose={onChooseImage}
          onRemove={onRemoveImage}
        />

        <SettingsImageField
          label="Favicon"
          field="favicon_url"
          path={values.favicon_url}
          emptyLabel="No favicon selected"
          onChoose={onChooseImage}
          onRemove={onRemoveImage}
        />
      </div>
    </section>
  )
}
