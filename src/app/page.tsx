/**
 * Optional Next root. The Vite SPA still serves `/` in the current deployment.
 */
export default function NextHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto', lineHeight: 1.5 }}>
      <p style={{ color: '#ff7a00', fontWeight: 600, letterSpacing: '0.04em' }}>NEXT.JS PHASE 2</p>
      <h1 style={{ fontSize: '1.75rem', margin: '0.5rem 0 1rem' }}>FlaireStack auth scaffold</h1>
      <p style={{ color: 'rgba(245,245,245,0.75)' }}>
        Next.js App Router auth foundation is available beside the Vite app. Use{' '}
        <code>npm run dev</code> for the full Vite CMS, or <code>npm run dev:next</code> for Next
        login.
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        <a href="/admin/login" style={{ color: '#ff7a00' }}>
          Open Next admin login
        </a>
      </p>
    </main>
  )
}
