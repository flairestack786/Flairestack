import React, { useEffect, useState } from 'react'
import ImagePickerModal from '../ImagePickerModal'
import { useMediaPublicUrl } from '../MediaUrlContext'
import SettingsImageField from '../settings/SettingsImageField'
import { nextMediaApi } from '@/lib/next/mediaBrowser'
import { listServices } from '@/lib/next/servicesBrowser'
import {
  createEmptyShowcaseItem,
  highlightsToEditorText,
  normalizeShowcaseHighlights,
  normalizeShowcaseItem,
  showcaseItemFromCatalogService,
} from '@/lib/homeServicesShowcase'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

/**
 * @param {string} path
 * @param {(path: string) => string} getPublicUrl
 */
function previewUrl(path, getPublicUrl) {
  const trimmed = String(path ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) return trimmed
  try {
    return getPublicUrl(trimmed)
  } catch {
    return ''
  }
}

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
  const getPublicUrl = useMediaPublicUrl()
  const [pickerIndex, setPickerIndex] = useState(/** @type {number | null} */ (null))
  const [catalog, setCatalog] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [catalogStatus, setCatalogStatus] = useState('idle')
  const [importNotice, setImportNotice] = useState('')

  const config = /** @type {Record<string, unknown>} */ (section.config ?? {})
  const details = Array.isArray(config.details) ? config.details : []
  const points = Array.isArray(config.points) ? config.points : []
  const imagePath = typeof config.image_path === 'string' ? config.image_path : ''
  const hasShowcaseKey = Object.prototype.hasOwnProperty.call(config, 'showcase_items')
  const showcaseRaw = Array.isArray(config.showcase_items) ? config.showcase_items : []
  const showcaseItems = showcaseRaw.map((item, index) => normalizeShowcaseItem(item, index))

  useEffect(() => {
    let cancelled = false
    setCatalogStatus('loading')
    void listServices()
      .then((rows) => {
        if (cancelled) return
        setCatalog(rows.filter((row) => String(row.status ?? '') === 'published'))
        setCatalogStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setCatalog([])
        setCatalogStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleStringListChange = (key, items) => {
    onConfigChange(
      key,
      items.map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
    )
  }

  const handleImportPublished = () => {
    if (!catalog.length) {
      setImportNotice('No published services found in the catalog.')
      return
    }
    const imported = catalog.map((row) => showcaseItemFromCatalogService(row))
    onConfigChange('showcase_items', imported)
    setImportNotice(`Imported ${imported.length} published service${imported.length === 1 ? '' : 's'}. Save to publish.`)
  }

  const pickerItem = pickerIndex == null ? null : showcaseItems[pickerIndex]

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Services"
      description="Section header plus the homepage service rows. Add, edit, reorder, or delete showcase services here — they control what visitors see."
    >
      <EditorField id="services-eyebrow" label="Eyebrow">
        <input
          id="services-eyebrow"
          type="text"
          className="admin-settings-input"
          value={String(section.eyebrow ?? '')}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-title" label="Title">
        <input
          id="services-title"
          type="text"
          className="admin-settings-input"
          value={String(section.title ?? '')}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-title-accent" label="Title accent">
        <input
          id="services-title-accent"
          type="text"
          className="admin-settings-input"
          value={String(section.title_accent ?? '')}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-intro" label="Intro line">
        <input
          id="services-intro"
          type="text"
          className="admin-settings-input"
          value={String(section.intro ?? '')}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-body" label="Body">
        <textarea
          id="services-body"
          className="admin-settings-textarea"
          rows={4}
          value={String(section.body ?? '')}
          onChange={(e) => onFieldChange('body', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-cta-label" label="Section CTA label">
        <input
          id="services-cta-label"
          type="text"
          className="admin-settings-input"
          value={String(section.cta_primary_label ?? '')}
          onChange={(e) => onFieldChange('cta_primary_label', e.target.value)}
        />
      </EditorField>

      <EditorField id="services-cta-url" label="Section CTA URL">
        <input
          id="services-cta-url"
          type="text"
          className="admin-settings-input"
          value={String(section.cta_primary_url ?? '')}
          onChange={(e) => onFieldChange('cta_primary_url', e.target.value)}
        />
      </EditorField>

      <div className="admin-home-list" style={{ marginTop: '1.25rem' }}>
        <div className="admin-home-list-header">
          <span className="admin-settings-label">Homepage service rows</span>
          <button
            type="button"
            className="admin-home-list-add"
            onClick={handleImportPublished}
            disabled={catalogStatus === 'loading'}
          >
            Import published services
          </button>
        </div>
        {!hasShowcaseKey ? (
          <p className="admin-settings-hint">
            Not customized yet — the public site currently lists all published catalog services.
            Import or add rows below, then save to take over from the catalog list.
          </p>
        ) : showcaseItems.length === 0 ? (
          <p className="admin-settings-hint">
            Showcase list is empty — the homepage services section will show no service rows until you
            add some.
          </p>
        ) : (
          <p className="admin-settings-hint">
            These rows are the source of truth for the homepage services section.
          </p>
        )}
        {importNotice ? <p className="admin-settings-hint">{importNotice}</p> : null}
        {catalogStatus === 'error' ? (
          <p className="admin-settings-hint">Could not load the services catalog for import.</p>
        ) : null}
      </div>

      <EditorList
        label="Service rows"
        itemLabel="Service"
        items={showcaseItems}
        reorderable
        onChange={(next) => onConfigChange('showcase_items', next)}
        createItem={() => createEmptyShowcaseItem()}
        renderItem={(item, index, onItemChange) => {
          const row = /** @type {ReturnType<typeof normalizeShowcaseItem>} */ (item)
          const imageSrc = previewUrl(row.image_path, getPublicUrl)
          return (
            <>
              <EditorField id={`svc-row-enabled-${index}`} label="Visible on homepage">
                <label className="admin-settings-checkbox">
                  <input
                    id={`svc-row-enabled-${index}`}
                    type="checkbox"
                    checked={row.enabled !== false}
                    onChange={(e) => onItemChange({ ...row, enabled: e.target.checked })}
                  />
                  Show this service row
                </label>
              </EditorField>

              <EditorField
                id={`svc-row-slug-${index}`}
                label="Linked service slug"
                hint="Used for the primary CTA URL (/services/…). Leave blank for a custom/unlinked row."
              >
                <input
                  id={`svc-row-slug-${index}`}
                  type="text"
                  className="admin-settings-input"
                  list={`svc-row-slug-options-${index}`}
                  value={row.service_slug}
                  onChange={(e) => onItemChange({ ...row, service_slug: e.target.value })}
                  placeholder="web-development"
                />
                <datalist id={`svc-row-slug-options-${index}`}>
                  {catalog.map((service) => (
                    <option key={String(service.id)} value={String(service.slug ?? '')}>
                      {String(service.title ?? service.slug ?? '')}
                    </option>
                  ))}
                </datalist>
              </EditorField>

              <EditorField id={`svc-row-title-${index}`} label="Title">
                <input
                  id={`svc-row-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.title}
                  onChange={(e) => onItemChange({ ...row, title: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`svc-row-accent-${index}`}
                label="Title accent"
                hint="Bold second phrase after the title, e.g. “built for conversion”."
              >
                <input
                  id={`svc-row-accent-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.accent}
                  onChange={(e) => onItemChange({ ...row, accent: e.target.value })}
                />
              </EditorField>

              <EditorField id={`svc-row-desc-${index}`} label="Description">
                <textarea
                  id={`svc-row-desc-${index}`}
                  className="admin-settings-textarea"
                  rows={3}
                  value={row.description}
                  onChange={(e) => onItemChange({ ...row, description: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`svc-row-highlights-${index}`}
                label="Checklist items"
                hint="One item per line (up to 8)."
              >
                <textarea
                  id={`svc-row-highlights-${index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={highlightsToEditorText(row.highlights)}
                  onChange={(e) =>
                    onItemChange({
                      ...row,
                      highlights: normalizeShowcaseHighlights(e.target.value),
                    })
                  }
                />
              </EditorField>

              <EditorField id={`svc-row-cta-${index}`} label="Primary CTA label">
                <input
                  id={`svc-row-cta-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.cta_label}
                  onChange={(e) => onItemChange({ ...row, cta_label: e.target.value })}
                />
              </EditorField>

              <EditorField id={`svc-row-secondary-cta-${index}`} label="Secondary CTA label">
                <input
                  id={`svc-row-secondary-cta-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.secondary_cta_label}
                  onChange={(e) => onItemChange({ ...row, secondary_cta_label: e.target.value })}
                />
              </EditorField>

              <EditorField id={`svc-row-secondary-url-${index}`} label="Secondary CTA URL">
                <input
                  id={`svc-row-secondary-url-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.secondary_cta_url}
                  onChange={(e) => onItemChange({ ...row, secondary_cta_url: e.target.value })}
                />
              </EditorField>

              <EditorField id={`svc-row-image-${index}`} label="Image">
                <div className="admin-settings-image-field">
                  {imageSrc ? (
                    <div className="admin-settings-image-preview">
                      <img src={imageSrc} alt="" className="admin-settings-image-preview-img" />
                      <p className="admin-settings-image-preview-path" title={row.image_path}>
                        {row.image_path}
                      </p>
                    </div>
                  ) : (
                    <p className="admin-settings-hint">
                      No custom image — catalog hero art is used when a service slug is set.
                    </p>
                  )}
                  <div className="admin-settings-image-actions">
                    <button
                      type="button"
                      className="admin-settings-image-btn admin-settings-image-btn--choose"
                      onClick={() => setPickerIndex(index)}
                    >
                      Choose image
                    </button>
                    {row.image_path ? (
                      <button
                        type="button"
                        className="admin-settings-image-btn admin-settings-image-btn--remove"
                        onClick={() => onItemChange({ ...row, image_path: '' })}
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                </div>
              </EditorField>

              <EditorField id={`svc-row-alt-${index}`} label="Image alt text">
                <input
                  id={`svc-row-alt-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.image_alt}
                  onChange={(e) => onItemChange({ ...row, image_alt: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />

      <EditorField id="services-panel-label" label="Panel label">
        <input
          id="services-panel-label"
          type="text"
          className="admin-settings-input"
          value={String(config.panel_label ?? '')}
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
          value={String(config.visual_alt ?? '')}
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

      <ImagePickerModal
        isOpen={pickerIndex != null}
        title="Select service image"
        selectedImage={
          pickerItem?.image_path
            ? {
                path: String(pickerItem.image_path),
                publicUrl: previewUrl(String(pickerItem.image_path), getPublicUrl),
                filename: String(pickerItem.image_path).split('/').pop() ?? 'image',
              }
            : null
        }
        api={nextMediaApi}
        onClose={() => setPickerIndex(null)}
        onSelect={(image) => {
          if (pickerIndex == null) return
          const next = showcaseItems.map((row, i) =>
            i === pickerIndex
              ? {
                  ...row,
                  image_path: image.path,
                  image_alt: row.image_alt || row.title || '',
                }
              : row
          )
          onConfigChange('showcase_items', next)
          setPickerIndex(null)
        }}
      />
    </EditorSection>
  )
}
