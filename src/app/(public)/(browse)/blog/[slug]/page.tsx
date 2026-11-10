import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogArticleView from '@/components/next/public/blog/BlogArticleView'
import PublicCanonicalTags from '@/components/next/public/PublicCanonicalTags'
import { publicBlogPath } from '@/lib/contentSlug'
import {
  getPublishedBlogPostBySlug,
  getRelatedBlogPosts,
} from '@/lib/next/publicBlogServer'
import { getPublicSiteSettings } from '@/lib/next/publicSiteSettingsServer'
import { resolvePublicCanonicalUrl } from '@/lib/next/publicSiteUrl'
import '@/blog-careers.css'

export const revalidate = 60

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string }
}

async function resolveParams(params: PageProps['params']) {
  return await Promise.resolve(params)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params)
  const [article, settings] = await Promise.all([
    getPublishedBlogPostBySlug(slug),
    getPublicSiteSettings(),
  ])
  if (!article) return { title: 'Article not found' }

  const path = publicBlogPath(article.slug)
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: path,
    cmsCanonicalUrl: article.canonicalUrl,
  })
  const title = article.seoTitle || `${article.title} | FlaireStack Blog`
  const description = article.metaDescription || article.excerpt || undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: article.ogImageUrl ? [{ url: article.ogImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicBlogArticlePage({ params }: PageProps) {
  const { slug } = await resolveParams(params)
  const article = await getPublishedBlogPostBySlug(slug)
  if (!article) notFound()

  const [related, settings] = await Promise.all([
    getRelatedBlogPosts(article),
    getPublicSiteSettings(),
  ])

  const path = publicBlogPath(article.slug)
  const canonical = resolvePublicCanonicalUrl({
    settings,
    routePath: path,
    cmsCanonicalUrl: article.canonicalUrl,
  })

  return (
    <>
      <PublicCanonicalTags canonical={canonical} />
      <BlogArticleView article={article} related={related} />
    </>
  )
}
