/**
 * Optional Next root. The Vite SPA still serves `/` in the current deployment.
 * This page exists so `next build` has a root App Router entry.
 */
export default function NextHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto', lineHeight: 1.5 }}>
      <p style={{ color: '#ff7a00', fontWeight: 600, letterSpacing: '0.04em' }}>NEXT.JS PHASE 1</p>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0 1rem' }}>FlaireStack scaffold</h1>
      <p style={{ color: 'rgba(245,245,245,0.75)' }}>
        The Next.js App Router is running beside the existing Vite application. Use{' '}
        <code>npm run dev</code> for Vite (auth, CMS, public site) and{' '}
        <code>npm run dev:next</code> for this scaffold.
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        <a href="/admin/login" style={{ color: '#ff7a00' }}>
          Open Next smoke-test: /admin/login
        </a>
      </p>
    </main>
  )
}
