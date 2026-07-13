import React from 'react'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function CompanyStoryEditor({
  section,
  onFieldChange,
  onConfigChange,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const stats = Array.isArray(config.stats) ? config.stats : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Company story"
      description="Who we are headline, narrative, and highlight stats."
    >
      <EditorField id="story-eyebrow" label="Eyebrow">
        <input
          id="story-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="story-title" label="Title">
        <input
          id="story-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="story-title-accent" label="Title accent">
        <input
          id="story-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="story-body" label="Body">
        <textarea
          id="story-body"
          className="admin-settings-textarea"
          rows={5}
          value={section.body}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Stats"
        itemLabel="Stat"
        items={stats}
        onChange={(next) => onConfigChange('stats', next)}
        createItem={() => ({ value: '', label: '', description: '', icon_name: 'Briefcase' })}
        renderItem={(item, index, onItemChange) => {
          const stat = /** @type {{ value?: string, label?: string, description?: string, icon_name?: string }} */ (
            item
          )
          return (
            <>
              <EditorField id={`story-stat-value-${index}`} label="Value">
                <input
                  id={`story-stat-value-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={stat.value ?? ''}
                  onChange={(e) => onItemChange({ ...stat, value: e.target.value })}
                  placeholder="60+"
                />
              </EditorField>

              <EditorField id={`story-stat-label-${index}`} label="Label">
                <input
                  id={`story-stat-label-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={stat.label ?? ''}
                  onChange={(e) => onItemChange({ ...stat, label: e.target.value })}
                />
              </EditorField>

              <EditorField id={`story-stat-desc-${index}`} label="Description">
                <textarea
                  id={`story-stat-desc-${index}`}
                  className="admin-settings-textarea"
                  rows={3}
                  value={stat.description ?? ''}
                  onChange={(e) => onItemChange({ ...stat, description: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`story-stat-icon-${index}`}
                label="Icon name"
                hint="Lucide icon name, e.g. Briefcase, Users."
              >
                <input
                  id={`story-stat-icon-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={stat.icon_name ?? ''}
                  onChange={(e) => onItemChange({ ...stat, icon_name: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
