import React from 'react'
import { ImageIcon } from 'lucide-react'
import { getEffectiveDescription, getEffectiveTitle } from '../../../lib/seoAnalysis'

/**
 * Live social share card preview (Facebook / LinkedIn / Twitter variants).
 * @param {{
 *   seo: Record<string, unknown>,
 *   imageUrl?: string | null,
 *   siteName?: string,
 *   variant?: 'facebook' | 'linkedin' | 'twitter',
 * }} props
 */
export default function SeoSocialPreview({
  seo,
  imageUrl = '',
  siteName = 'flairestack.com',
  variant = 'facebook',
}) {
  const title =
    getEffectiveTitle({
      ...seo,
      meta_title:
        variant === 'twitter'
          ? seo.twitter_title || seo.og_title || seo.meta_title
          : seo.og_title || seo.meta_title,
    }) || 'Open Graph title'

  const description =
    getEffectiveDescription({
      ...seo,
      meta_description:
        variant === 'twitter'
          ? seo.twitter_description || seo.og_description || seo.meta_description
          : seo.og_description || seo.meta_description,
    }) || 'Add an Open Graph description for social sharing.'

  const labels = {
    facebook: 'Facebook preview',
    linkedin: 'LinkedIn preview',
    twitter: 'Twitter / X preview',
  }

  return (
    <div className={`admin-seo-preview admin-seo-preview--social admin-seo-preview--${variant}`}>
      <p className="admin-seo-preview-kicker">{labels[variant] ?? 'Social preview'}</p>
      <div className={`admin-seo-social-card admin-seo-social-card--${variant}`}>
        <div className="admin-seo-social-media">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="admin-seo-social-image" />
          ) : (
            <div className="admin-seo-social-placeholder">
              <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
              <span>No image selected</span>
            </div>
          )}
        </div>
        <div className="admin-seo-social-body">
          <p className="admin-seo-social-domain">{siteName}</p>
          <p className="admin-seo-social-title">{title}</p>
          <p className="admin-seo-social-desc">{description}</p>
        </div>
      </div>
    </div>
  )
}
