import Link from 'next/link'

export default function PublicNotFound() {
  return (
    <main className="public-phase15-main">
      <div className="public-phase15-panel">
        <p className="public-phase15-eyebrow">404</p>
        <h1 className="public-phase15-title">Page not found</h1>
        <p className="public-phase15-copy">
          That page does not exist yet on the Next.js public site, or the link is incorrect.
        </p>
        <p className="public-phase15-actions">
          <Link href="/" className="public-phase15-link">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
