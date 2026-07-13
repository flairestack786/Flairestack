import React from 'react'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   seo: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function SeoEditor({ seo, onFieldChange, panelId, labelledBy }) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="SEO"
      description="Search engine and social metadata for this service page."
    >
      <EditorField id="seo-meta-title" label="Meta title">
        <input
          id="seo-meta-title"
          type="text"
          className="admin-settings-input"
          value={seo.meta_title}
          onChange={(e) => onFieldChange('meta_title', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-meta-description" label="Meta description">
        <textarea
          id="seo-meta-description"
          className="admin-settings-textarea"
          rows={4}
          value={seo.meta_description}
          onChange={(e) => onFieldChange('meta_description', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-canonical-url" label="Canonical URL">
        <input
          id="seo-canonical-url"
          type="text"
          className="admin-settings-input"
          value={seo.canonical_url}
          onChange={(e) => onFieldChange('canonical_url', e.target.value)}
          placeholder="https://flairestack.com/services/..."
        />
      </EditorField>

      <EditorField id="seo-robots" label="Robots">
        <input
          id="seo-robots"
          type="text"
          className="admin-settings-input"
          value={seo.robots}
          onChange={(e) => onFieldChange('robots', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-og-title" label="Open Graph title">
        <input
          id="seo-og-title"
          type="text"
          className="admin-settings-input"
          value={seo.og_title}
          onChange={(e) => onFieldChange('og_title', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-og-description" label="Open Graph description">
        <textarea
          id="seo-og-description"
          className="admin-settings-textarea"
          rows={3}
          value={seo.og_description}
          onChange={(e) => onFieldChange('og_description', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-twitter-title" label="Twitter title">
        <input
          id="seo-twitter-title"
          type="text"
          className="admin-settings-input"
          value={seo.twitter_title}
          onChange={(e) => onFieldChange('twitter_title', e.target.value)}
        />
      </EditorField>

      <EditorField id="seo-twitter-description" label="Twitter description">
        <textarea
          id="seo-twitter-description"
          className="admin-settings-textarea"
          rows={3}
          value={seo.twitter_description}
          onChange={(e) => onFieldChange('twitter_description', e.target.value)}
        />
      </EditorField>
    </EditorSection>
  )
}
