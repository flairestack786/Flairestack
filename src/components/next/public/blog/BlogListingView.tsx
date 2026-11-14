'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CmsOptimizedImage from '@/components/next/public/CmsOptimizedImage'
import { publicBlogPath } from '@/lib/contentSlug'
import type { PublicBlogCard } from '@/lib/next/publicBlogServer'

const PAGE_SIZE = 9

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

function ArticleCard({ post }: { post: PublicBlogCard }) {
  const href = publicBlogPath(post.slug)

  return (
    <article className="blog-card">
      <Link href={href} className="blog-card-link">
        <div className="blog-card-media">
          {post.featuredImageUrl ? (
            <CmsOptimizedImage
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt}
              className="blog-card-img"
              preset="card"
            />
          ) : (
            <div className="blog-card-media-fallback" aria-hidden />
          )}
        </div>
        <div className="blog-card-body">
          <div className="blog-card-meta">
            {post.category ? <span className="blog-chip">{post.category}</span> : null}
            <span>{formatDate(post.publishedAt)}</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
          <h2 className="blog-card-title">{post.title}</h2>
          {post.excerpt ? <p className="blog-card-excerpt">{post.excerpt}</p> : null}
          {post.authorName ? <p className="blog-card-author">By {post.authorName}</p> : null}
          <span className="blog-card-cta">
            Read article
            <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </article>
  )
}

export default function BlogListingView({ posts }: { posts: PublicBlogCard[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const featured = useMemo(
    () => posts.find((post) => post.isFeatured) ?? posts[0] ?? null,
    [posts]
  )
  const gridPosts = useMemo(
    () => posts.filter((post) => !featured || post.id !== featured.id),
    [featured, posts]
  )
  const shown = gridPosts.slice(0, visible)
  const hasMore = visible < gridPosts.length

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="blog-hero-copy">
          <p className="blog-eyebrow">Insights</p>
          <h1 className="blog-hero-title">
            FlaireStack <span className="text-accent">Blog</span>
          </h1>
          <p className="blog-hero-lead">
            Ideas on product engineering, digital platforms, and building technology that scales.
          </p>
        </div>
      </section>

      {featured ? (
        <section className="blog-featured" aria-labelledby="blog-featured-heading">
          <div className="blog-featured-media">
            {featured.featuredImageUrl ? (
              <CmsOptimizedImage
                src={featured.featuredImageUrl}
                alt={featured.featuredImageAlt}
                className="blog-featured-img"
                preset="banner"
                priority
              />
            ) : (
              <div className="blog-featured-fallback" aria-hidden />
            )}
          </div>
          <div className="blog-featured-copy">
            <p className="blog-eyebrow" id="blog-featured-heading">
              Featured
            </p>
            <div className="blog-card-meta">
              {featured.category ? <span className="blog-chip">{featured.category}</span> : null}
              <span>{formatDate(featured.publishedAt)}</span>
              <span>{featured.readingTimeMinutes} min read</span>
            </div>
            <h2 className="blog-featured-title">
              <Link href={publicBlogPath(featured.slug)}>{featured.title}</Link>
            </h2>
            {featured.excerpt ? <p className="blog-featured-excerpt">{featured.excerpt}</p> : null}
            {featured.authorName ? (
              <p className="blog-card-author">By {featured.authorName}</p>
            ) : null}
            <Link href={publicBlogPath(featured.slug)} className="blog-featured-cta">
              Read article
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      ) : (
        <section className="blog-empty">
          <h2>No published articles yet</h2>
          <p>Check back soon for FlaireStack insights and product stories.</p>
        </section>
      )}

      {shown.length > 0 ? (
        <section className="blog-grid-section" aria-label="All articles">
          <div className="blog-grid">
            {shown.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
          {hasMore ? (
            <div className="blog-load-more">
              <button
                type="button"
                className="blog-load-more-btn"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
              >
                Load more articles
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
