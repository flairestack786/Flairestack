import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from './EditorField'
import EditorSection from './EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onChooseImage: (configKey: string) => void,
 *   onRemoveImage: (configKey: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function HeroEditor({
  section,
  onFieldChange,
  onChooseImage,
  onRemoveImage,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const backgroundPath = typeof config.background_image_path === 'string' ? config.background_image_path : ''

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Hero"
      description="Main headline, supporting copy, primary CTA, and optional background image."
    >
      <EditorField id="hero-title" label="Title">
        <input
          id="hero-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="hero-title-accent" label="Title accent">
        <input
          id="hero-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="hero-intro" label="Intro line">
        <input
          id="hero-intro"
          type="text"
          className="admin-settings-input"
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField id="hero-body" label="Body">
        <textarea
          id="hero-body"
          className="admin-settings-textarea"
          rows={4}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorField id="hero-cta-label" label="Primary CTA label">
        <input
          id="hero-cta-label"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_label}
          onChange={(e) => onFieldChange('cta_primary_label', e.target.value)}
        />
      </EditorField>

      <EditorField id="hero-cta-url" label="Primary CTA URL">
        <input
          id="hero-cta-url"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_url}
          onChange={(e) => onFieldChange('cta_primary_url', e.target.value)}
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
