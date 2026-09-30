/**
 * Exact canonical + og:url tags.
 * Next Metadata API normalizes away a trailing slash on the home origin;
 * these tags preserve `https://flairestack.com/` when required.
 */
export default function PublicCanonicalTags({ canonical }: { canonical: string }) {
  const href = String(canonical || '').trim()
  if (!href) return null

  return (
    <>
      <link rel="canonical" href={href} />
      <meta property="og:url" content={href} />
    </>
  )
}
