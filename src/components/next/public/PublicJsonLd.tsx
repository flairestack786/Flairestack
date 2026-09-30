/**
 * Server-renderable JSON-LD script for public pages.
 * Values come only from CMS seo_metadata / site_settings — never invented.
 */
export default function PublicJsonLd({ data }: { data: unknown }) {
  if (data == null) return null
  if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data as object).length === 0) {
    return null
  }
  if (Array.isArray(data) && data.length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
