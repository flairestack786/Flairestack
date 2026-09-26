/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 1+: App Router only. Ignore Vite's src/pages/*.jsx so Next does not
  // treat the React Router page components as Pages Router routes.
  pageExtensions: ['tsx', 'ts'],
  reactStrictMode: true,
  // Prefer explicit NEXT_PUBLIC_* (documented in .env.example). Fall back to the
  // existing Vite keys in .env.local so local Next auth works without duplicating
  // secrets on disk. The Next browser client still reads only NEXT_PUBLIC_*.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  },
}

export default nextConfig
