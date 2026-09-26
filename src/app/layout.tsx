import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'FlaireStack (Next.js scaffold)',
  description: 'Phase 1 Next.js App Router scaffold running beside the Vite application.',
}

/**
 * Minimal root layout for the Next.js scaffold.
 * Vite continues to own the production SPA; this layout is only used by `next` scripts.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          background: '#0b0b0b',
          color: '#f5f5f5',
        }}
      >
        {children}
      </body>
    </html>
  )
}
