import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
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
export default function TestimonialsEditor({
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
      title="Testimonials"
      description="Section header and optional background image. Testimonial cards use the shared testimonials library."
    >
      <SectionHeaderFields section={section} onFieldChange={onFieldChange} />

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
