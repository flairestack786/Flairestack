import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   onChooseImage: (configKey: string) => void,
 *   onRemoveImage: (configKey: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ServicesHeaderEditor({
  section,
  onFieldChange,
  onConfigChange,
  onChooseImage,
  onRemoveImage,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const details = Array.isArray(config.details) ? config.details : []
  const points = Array.isArray(config.points) ? config.points : []
  const imagePath = typeof config.image_path === 'string' ? config.image_path : ''

  const handleStringListChange = (key, items) => {
    onConfigChange(
      key,
      items.map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
    )
  }

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Services header"
      description="Section headline, narrative copy, illustration, bullet points, and CTA for the services block."
    >
      <EditorField id="services-eyebrow" label="Eyebrow">
        <input
          id="services-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-title" label="Title">
        <input
          id="services-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-title-accent" label="Title accent">
        <input
          id="services-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-intro" label="Intro line">
        <input
          id="services-intro"
          type="text"
          className="admin-settings-input"
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-body" label="Body">
        <textarea
          id="services-body"
          className="admin-settings-textarea"
          rows={4}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-cta-label" label="CTA label">
        <input
          id="services-cta-label"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_label}
          onChange={(e) => onFieldChange('cta_primary_label', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-cta-url" label="CTA URL">
        <input
          id="services-cta-url"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_url}
          onChange={(e) => onFieldChange('cta_primary_url', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-panel-label" label="Panel label">
        <input
          id="services-panel-label"
          type="text"
          className="admin-settings-input"
          value={config.panel_label ?? ''}
          onChange={(e) => onConfigChange('panel_label', e.target.value)}
        />
      </EditorField>

      <SettingsImageField
        label="Services illustration"
        field="image_path"
        path={imagePath}
        emptyLabel="No illustration selected — bundled image will be used"
        onChoose={() => onChooseImage('image_path')}
        onRemove={() => onRemoveImage('image_path')}
      />

      <EditorField id="services-visual-alt" label="Visual alt text">
        <input
          id="services-visual-alt"
          type="text"
          className="admin-settings-input"
          value={config.visual_alt ?? ''}
          onChange={(e) => onConfigChange('visual_alt', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Detail paragraphs"
        itemLabel="Paragraph"
        items={details}
        onChange={(items) => handleStringListChange('details', items)}
        createItem={() => ''}
        renderItem={(item, _index, onItemChange) => (
          <textarea
            className="admin-settings-textarea"
            rows={3}
            value={typeof item === 'string' ? item : ''}
            onChange={(e) => onItemChange(e.target.value)}
          />
        )}
      />

      <EditorList
        label="Bullet points"
        itemLabel="Point"
        items={points}
        onChange={(items) => handleStringListChange('points', items)}
        createItem={() => ''}
        renderItem={(item, _index, onItemChange) => (
          <input
            type="text"
            className="admin-settings-input"
            value={typeof item === 'string' ? item : ''}
            onChange={(e) => onItemChange(e.target.value)}
          />
        )}
      />
    </EditorSection>
  )
}
