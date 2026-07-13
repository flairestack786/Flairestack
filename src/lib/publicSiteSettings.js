import {
  COMPANY_DESCRIPTION,
  COMPANY_EMAIL,
  COMPANY_LOCATION,
  COMPANY_LOCATION_SUB,
  COMPANY_NAME,
  COMPANY_TAGLINE,
  PHONE_DISPLAY,
  PHONE_TEL,
} from '../config/contact'
import { getPublicUrl } from './media'

/** @typedef {{ href: string, label: string, Icon: import('react').ComponentType<{ size?: number, 'aria-hidden'?: boolean }> }} SocialLink */

const SOCIAL_ICON_IMPORTS = [
  { key: 'facebook_url', label: 'Facebook', iconName: 'SiFacebook' },
  { key: 'instagram_url', label: 'Instagram', iconName: 'SiInstagram' },
  { key: 'linkedin_url', label: 'LinkedIn', iconName: 'SiLinkedin' },
  { key: 'x_url', label: 'X', iconName: 'SiX' },
  { key: 'youtube_url', label: 'YouTube', iconName: 'SiYoutube' },
  { key: 'github_url', label: 'GitHub', iconName: 'SiGithub' },
]

/**
 * @param {string} phone
 * @returns {string}
 */
export function toTelHref(phone) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return `tel:+${digits}`
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {Record<string, unknown>}
 */
export function buildPublicSiteSettings(row) {
  const company_name = String(row?.company_name ?? '').trim() || COMPANY_NAME
  const tagline = String(row?.tagline ?? '').trim() || COMPANY_TAGLINE
  const description = String(row?.default_meta_description ?? '').trim() || COMPANY_DESCRIPTION
  const phone = String(row?.phone ?? '').trim() || PHONE_DISPLAY
  const email = String(row?.email ?? '').trim() || COMPANY_EMAIL
  const address =
    String(row?.address ?? '').trim() ||
    [COMPANY_LOCATION, COMPANY_LOCATION_SUB].filter(Boolean).join('\n')
  const copyright_text =
    String(row?.copyright_text ?? '').trim() || `© ${company_name}. All rights reserved.`

  const logo_path = String(row?.logo_url ?? '').trim()
  const logo_url = logo_path ? getPublicUrl(logo_path) : null

  const addressLines = address
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const phoneTel = toTelHref(phone) || toTelHref(PHONE_TEL)

  return {
    company_name,
    tagline,
    description,
    phone,
    phoneTel,
    email,
    emailMailto: `mailto:${email}`,
    address,
    addressLines,
    copyright_text,
    logo_path,
    logo_url,
    website_name: String(row?.website_name ?? '').trim() || company_name,
    default_meta_title: String(row?.default_meta_title ?? '').trim(),
    default_meta_description: String(row?.default_meta_description ?? '').trim() || description,
    default_og_image: String(row?.default_og_image ?? '').trim(),
    default_twitter_image: String(row?.default_twitter_image ?? '').trim(),
    canonical_base_url: String(row?.canonical_base_url ?? '').trim(),
    default_robots: String(row?.default_robots ?? '').trim() || 'index,follow',
    gsc_verification: String(row?.gsc_verification ?? '').trim(),
    bing_verification: String(row?.bing_verification ?? '').trim(),
    google_analytics_id: String(row?.google_analytics_id ?? '').trim(),
    google_tag_manager_id: String(row?.google_tag_manager_id ?? '').trim(),
    microsoft_clarity_id: String(row?.microsoft_clarity_id ?? '').trim(),
    meta_pixel_id: String(row?.meta_pixel_id ?? '').trim(),
    organization_jsonld:
      row?.organization_jsonld && typeof row.organization_jsonld === 'object'
        ? row.organization_jsonld
        : {},
    website_jsonld:
      row?.website_jsonld && typeof row.website_jsonld === 'object' ? row.website_jsonld : {},
    seo_templates:
      row?.seo_templates && typeof row.seo_templates === 'object' ? row.seo_templates : {},
    socialLinks: SOCIAL_ICON_IMPORTS.map(({ key, label }) => ({
      key,
      label,
      href: String(row?.[key] ?? '').trim(),
    })),
  }
}

export const FALLBACK_PUBLIC_SETTINGS = buildPublicSiteSettings(null)
