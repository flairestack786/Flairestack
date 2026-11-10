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

  // #region agent log
  fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'C',location:'blog/page.tsx:PublicBlogPage',message:'Public /blog page received posts',data:{postCount:posts.length,slugs:posts.map((p)=>p.slug),revalidate:60},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
