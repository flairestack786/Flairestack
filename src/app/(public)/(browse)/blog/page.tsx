import type { Metadata } from 'next'
import BlogListingView from '@/components/next/public/blog/BlogListingView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import {
  buildPublicPageMetadataWithCanonical,
} from '@/lib/next/buildPublicPageMetadata'
import { listPublishedBlogPosts } from '@/lib/next/publicBlogServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import '@/blog-careers.css'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  return buildPublicPageMetadataWithCanonical({
    seoRow: null,
    settings,
    pageTitle: 'Blog',
    routePath: '/blog',
    entityType: 'page',
    fallbackTitle: 'Blog | FlaireStack',
    fallbackDescription:
      'Insights on product engineering, digital platforms, and technology delivery from FlaireStack.',
  }).metadata
}

export default async function PublicBlogPage() {
  const [posts, settings] = await Promise.all([
    listPublishedBlogPosts(),
    getPublicSiteSettings(),
  ])

  const { canonical } = buildPublicPageMetadataWithCanonical({
    seoRow: null,
    settings,
    pageTitle: 'Blog',
    routePath: '/blog',
    entityType: 'page',
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <BlogListingView posts={posts} />
    </>
  )
}
