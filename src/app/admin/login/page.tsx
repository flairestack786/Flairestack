/**
 * Phase 1 smoke-test route.
 * Confirms Next.js is serving `/admin/login` without wiring Vite auth yet.
 */
export default function AdminLoginSmokePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '1rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#ff7a00',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          NEXT.JS SMOKE TEST
        </p>
        <h1 style={{ margin: '0.75rem 0 0.5rem', fontSize: '1.5rem' }}>/admin/login</h1>
        <p style={{ margin: 0, color: 'rgba(245,245,245,0.7)', lineHeight: 1.5 }}>
          Next.js App Router is running. Authentication, Supabase, and RBAC are not migrated in
          Phase 1 — the Vite app still owns the real CMS login at{' '}
          <code>npm run dev</code> (port 5173).
        </p>
        <p
          style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            color: '#86efac',
            fontSize: '0.875rem',
          }}
        >
          Status: OK — scaffold route loaded.
        </p>
      </div>
    </main>
  )
}
