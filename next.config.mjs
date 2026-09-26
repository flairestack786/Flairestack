/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 1: App Router only. Ignore Vite's src/pages/*.jsx so Next does not
  // treat the React Router page components as Pages Router routes.
  pageExtensions: ['tsx', 'ts'],
  reactStrictMode: true,
}

export default nextConfig
