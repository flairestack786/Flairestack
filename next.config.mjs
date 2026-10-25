/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router only. Ignore any residual .jsx under src that is not an App route.
  pageExtensions: ['tsx', 'ts'],
  reactStrictMode: true,
  // Prefer explicit NEXT_PUBLIC_* (documented in .env.example). Temporary fallbacks
  // to legacy VITE_* keys remain so existing .env.local files keep working during cutover.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_EMAILJS_SERVICE_ID:
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || '',
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID:
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || '',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || '',
    NEXT_PUBLIC_EMAILJS_TO_EMAIL:
      process.env.NEXT_PUBLIC_EMAILJS_TO_EMAIL ||
      process.env.VITE_EMAILJS_TO_EMAIL ||
      'info@flairestack.com',
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.VITE_TURNSTILE_SITE_KEY || '',
  },
}

export default nextConfig
