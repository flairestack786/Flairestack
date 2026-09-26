import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import NextProviders from './providers'

export const metadata: Metadata = {
  title: 'FlaireStack (Next.js)',
  description: 'Next.js App Router migration running beside the Vite application.',
}

/**
 * Root layout for the Next.js scaffold.
 * Vite continues to own the production SPA; this layout is only used by `next` scripts.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          fontFamily:
            "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: '#050505',
          color: '#f5f5f5',
        }}
      >
        <NextProviders>{children}</NextProviders>
      </body>
    </html>
  )
}
