import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'
import SectionHeaderFields from './SectionHeaderFields'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | boolean) => void,
 *   onChooseImage: (configKey: string) => void,
 *   onRemoveImage: (configKey: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function FinalCtaEditor({
  section,
  onFieldChange,
  onChooseImage,
  onRemoveImage,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const backgroundPath =
    typeof config.background_image_path === 'string' ? config.background_image_path : ''

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Final CTA"
      description="Closing call-to-action band and optional background image."
    >
      <SectionHeaderFields section={section} onFieldChange={onFieldChange} showEyebrow={false} />

      <EditorField id="final-cta-label" label="Button label">
        <input
          id="final-cta-label"
          type="text"
          className="admin-settings-input"
          value={section.cta_label}
          onChange={(e) => onFieldChange('cta_label', e.target.value)}
        />
      </EditorField>

      <EditorField id="final-cta-url" label="Button URL">
        <input
          id="final-cta-url"
          type="text"
          className="admin-settings-input"
          value={section.cta_url}
          onChange={(e) => onFieldChange('cta_url', e.target.value)}
          placeholder="#contact"
        />
      </EditorField>

      <SettingsImageField
        label="Background image"
        field="background_image_path"
        path={backgroundPath}
        emptyLabel="No background image selected"
        onChoose={() => onChooseImage('background_image_path')}
        onRemove={() => onRemoveImage('background_image_path')}
      />
    </EditorSection>
  )
}
