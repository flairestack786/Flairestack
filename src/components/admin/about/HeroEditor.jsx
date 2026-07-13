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
export default function HeroEditor({ section, onFieldChange, panelId, labelledBy }) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Hero"
      description="About page headline and lead paragraph."
    >
      <EditorField id="about-hero-eyebrow" label="Eyebrow">
        <input
          id="about-hero-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-hero-title" label="Title">
        <input
          id="about-hero-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-hero-title-accent" label="Title accent">
        <input
          id="about-hero-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="about-hero-intro" label="Lead">
        <textarea
          id="about-hero-intro"
          className="admin-settings-textarea"
          rows={4}
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>
    </EditorSection>
  )
}
