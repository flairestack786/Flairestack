import React from 'react'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   service: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | number) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ServiceDetailsEditor({ service, onFieldChange, panelId, labelledBy }) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Service details"
      description="Core catalog fields used across the site and service listing."
    >
      <EditorField id="service-title" label="Title">
        <input
          id="service-title"
          type="text"
          className="admin-settings-input"
          value={service.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="service-slug" label="Slug" hint="URL path: /services/{slug}">
        <input
          id="service-slug"
          type="text"
          className="admin-settings-input"
          value={service.slug}
          onChange={(e) => onFieldChange('slug', e.target.value)}
        />
      </EditorField>

      <EditorField id="service-short-description" label="Short description">
        <textarea
          id="service-short-description"
          className="admin-settings-textarea"
          rows={2}
          value={service.short_description}
          onChange={(e) => onFieldChange('short_description', e.target.value)}
        />
      </EditorField>

      <EditorField id="service-description" label="Description">
        <textarea
          id="service-description"
          className="admin-settings-textarea"
          rows={4}
          value={service.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
        />
      </EditorField>

      <EditorField id="service-icon" label="Icon name" hint="Lucide icon name for cards and navigation.">
        <input
          id="service-icon"
          type="text"
          className="admin-settings-input"
          value={service.icon_name}
          onChange={(e) => onFieldChange('icon_name', e.target.value)}
        />
      </EditorField>

      <EditorField id="service-sort-order" label="Sort order">
        <input
          id="service-sort-order"
          type="number"
          min={0}
          className="admin-settings-input"
          value={service.sort_order}
          onChange={(e) => onFieldChange('sort_order', Number(e.target.value) || 0)}
        />
      </EditorField>
    </EditorSection>
  )
}
