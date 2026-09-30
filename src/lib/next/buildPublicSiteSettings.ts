import {
  COMPANY_DESCRIPTION,
  COMPANY_EMAIL,
  COMPANY_LOCATION,
  COMPANY_LOCATION_SUB,
  COMPANY_NAME,
  COMPANY_TAGLINE,
  PHONE_DISPLAY,
  PHONE_TEL,
} from '@/config/contact'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'

const SOCIAL_KEYS = [
  { key: 'facebook_url', label: 'Facebook' },
  { key: 'instagram_url', label: 'Instagram' },
  { key: 'linkedin_url', label: 'LinkedIn' },
  { key: 'x_url', label: 'X' },
  { key: 'youtube_url', label: 'YouTube' },
  { key: 'github_url', label: 'GitHub' },
] as const

export type PublicSocialLink = {
  key: string
  label: string
  href: string
}

export type PublicSiteSettings = {
  company_name: string
  tagline: string
  description: string
  phone: string
  phoneTel: string
  email: string
  emailMailto: string
  address: string
  addressLines: string[]
  copyright_text: string
  logo_path: string
  logo_url: string | null
  favicon_path: string
  favicon_url: string | null
  website_name: string
  default_meta_title: string
  default_meta_description: string
  default_og_image: string
  default_twitter_image: string
  canonical_base_url: string
  default_robots: string
  gsc_verification: string
  bing_verification: string
  google_analytics_id: string
  google_tag_manager_id: string
  microsoft_clarity_id: string
  meta_pixel_id: string
  socialLinks: PublicSocialLink[]
  /** CMS Organization JSON-LD object (may be empty). */
  organization_jsonld: Record<string, unknown> | null
  /** CMS Website JSON-LD object (may be empty). */
  website_jsonld: Record<string, unknown> | null
}

function toTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return `tel:+${digits}`
}

/**
 * Mirror of Vite `buildPublicSiteSettings` using Next public media URLs.
 * Does not import the Vite Supabase client.
 */
export function buildNextPublicSiteSettings(
  row: Record<string, unknown> | null | undefined
): PublicSiteSettings {
  const company_name = String(row?.company_name ?? '').trim() || COMPANY_NAME
  const tagline = String(row?.tagline ?? '').trim() || COMPANY_TAGLINE
  const description =
    String(row?.default_meta_description ?? '').trim() || COMPANY_DESCRIPTION
  const phone = String(row?.phone ?? '').trim() || PHONE_DISPLAY
  const email = String(row?.email ?? '').trim() || COMPANY_EMAIL
  const address =
    String(row?.address ?? '').trim() ||
    [COMPANY_LOCATION, COMPANY_LOCATION_SUB].filter(Boolean).join('\n')
  const copyright_text =
    String(row?.copyright_text ?? '').trim() || `© ${company_name}. All rights reserved.`

  const logo_path = String(row?.logo_url ?? '').trim()
  const logo_url = logo_path ? getPublicMediaUrl(logo_path) : null

  const favicon_path = String(row?.favicon_url ?? '').trim()
  const favicon_url = favicon_path ? getPublicMediaUrl(favicon_path) : null

  const addressLines = address
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const phoneTel = toTelHref(phone) || toTelHref(PHONE_TEL)

  const organization_jsonld =
    row?.organization_jsonld &&
    typeof row.organization_jsonld === 'object' &&
    !Array.isArray(row.organization_jsonld)
      ? (row.organization_jsonld as Record<string, unknown>)
      : null
  const website_jsonld =
    row?.website_jsonld &&
    typeof row.website_jsonld === 'object' &&
    !Array.isArray(row.website_jsonld)
      ? (row.website_jsonld as Record<string, unknown>)
      : null

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
    favicon_path,
    favicon_url,
    website_name: String(row?.website_name ?? '').trim() || company_name,
    default_meta_title: String(row?.default_meta_title ?? '').trim(),
    default_meta_description:
      String(row?.default_meta_description ?? '').trim() || description,
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
    socialLinks: SOCIAL_KEYS.map(({ key, label }) => ({
      key,
      label,
      href: String(row?.[key] ?? '').trim(),
    })).filter((link) => Boolean(link.href)),
    organization_jsonld:
      organization_jsonld && Object.keys(organization_jsonld).length > 0
        ? organization_jsonld
        : null,
    website_jsonld:
      website_jsonld && Object.keys(website_jsonld).length > 0 ? website_jsonld : null,
  }
}

export const FALLBACK_NEXT_PUBLIC_SETTINGS = buildNextPublicSiteSettings(null)
