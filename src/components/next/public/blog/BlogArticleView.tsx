'use client'

import Link from 'next/link'
import CmsOptimizedImage from '@/components/next/public/CmsOptimizedImage'
import { publicBlogPath } from '@/lib/contentSlug'
import type { PublicBlogArticle, PublicBlogCard } from '@/lib/next/publicBlogServer'

function formatDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function shareUrl(path: string) {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

export default function BlogArticleView({
  article,
  related,
}: {
  article: PublicBlogArticle
  related: PublicBlogCard[]
}) {
  const path = publicBlogPath(article.slug)

  return (
    <article className="blog-article">
      <header className="blog-article-header">
        <Link href="/blog" className="blog-back-link">
          ← Back to Blog
        </Link>
        <div className="blog-card-meta">
          {article.category ? <span className="blog-chip">{article.category}</span> : null}
          <span>{formatDate(article.publishedAt)}</span>
          <span>{article.readingTimeMinutes} min read</span>
        </div>
        <h1 className="blog-article-title">{article.title}</h1>
        {article.excerpt ? <p className="blog-article-excerpt">{article.excerpt}</p> : null}
      </header>

      {article.featuredImageUrl ? (
        <div className="blog-article-hero-media">
          <CmsOptimizedImage
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt}
            className="blog-article-hero-img"
            preset="banner"
            priority
          />
        </div>
      ) : null}

      <div
        className="blog-article-prose"
        dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
      />

      {article.authorName ? (
        <p className="blog-article-author">By {article.authorName}</p>
      ) : null}

      <div className="blog-article-share">
        <p>Share</p>
        <div className="blog-article-share-actions">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl(path))}`}
            target="_blank"
            rel="noreferrer"
            className="blog-share-btn"
          >
            LinkedIn
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl(path))}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noreferrer"
            className="blog-share-btn"
          >
            X
          </a>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="blog-related" aria-labelledby="blog-related-heading">
          <h2 id="blog-related-heading">Related articles</h2>
          <div className="blog-related-grid">
            {related.map((post) => (
              <article key={post.id} className="blog-related-card">
                <h3>
                  <Link href={publicBlogPath(post.slug)}>{post.title}</Link>
                </h3>
                <p>{post.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
