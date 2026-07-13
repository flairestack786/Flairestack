import React from 'react'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ContactEditor({ section, onFieldChange, panelId, labelledBy }) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Contact CTA"
      description="Closing call-to-action on the About page."
    >
      <EditorField id="about-contact-eyebrow" label="Eyebrow">
        <input
          id="about-contact-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-contact-title" label="Title">
        <input
          id="about-contact-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-contact-title-accent" label="Title accent">
        <input
          id="about-contact-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-contact-body" label="Body">
        <textarea
          id="about-contact-body"
          className="admin-settings-textarea"
          rows={4}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-contact-cta-label" label="CTA label">
        <input
          id="about-contact-cta-label"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_label}
          onChange={(e) => onFieldChange('cta_primary_label', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-contact-cta-url" label="CTA URL">
        <input
          id="about-contact-cta-url"
          type="text"
          className="admin-settings-input"
          value={section.cta_primary_url}
          onChange={(e) => onFieldChange('cta_primary_url', e.target.value)}
          placeholder="/#contact"
        />
      </EditorField>
    </EditorSection>
  )
}
