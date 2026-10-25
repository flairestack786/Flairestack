import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  FALLBACK_HERO_SLIDE_CONTENT,
  buildFallbackHeroSlides,
  buildPublicHeroSlides,
  resolvePublicHeroSlides,
  sanitizeCtaUrl,
} from './heroSlides.js'

const resolveUrl = (path) => `https://cdn.example/${path}`

test('preserves exact first-slide fallback wording from legacy hero', () => {
  const [slide] = buildFallbackHeroSlides(null)
  assert.equal(slide.title, FALLBACK_HERO_SLIDE_CONTENT.title)
  assert.equal(slide.titleAccent, FALLBACK_HERO_SLIDE_CONTENT.titleAccent)
  assert.equal(slide.intro, FALLBACK_HERO_SLIDE_CONTENT.intro)
  assert.equal(slide.body, FALLBACK_HERO_SLIDE_CONTENT.body)
  assert.equal(slide.ctaLabel, FALLBACK_HERO_SLIDE_CONTENT.ctaLabel)
  assert.equal(slide.ctaUrl, FALLBACK_HERO_SLIDE_CONTENT.ctaUrl)
})

test('filters disabled slides and orders by sort_order', () => {
  const slides = buildPublicHeroSlides(
    [
      {
        id: 'b',
        media_type: 'image',
        media_path: 'hero/b.jpg',
        title: 'Second',
        sort_order: 2,
        is_enabled: true,
      },
      {
        id: 'a',
        media_type: 'video',
        media_path: 'hero/a.mp4',
        title: 'First',
        title_accent: 'accent',
        intro: 'intro',
        body: 'body',
        cta_primary_label: 'Book Consultation',
        cta_primary_url: '#contact',
        sort_order: 0,
        is_enabled: true,
      },
      {
        id: 'c',
        media_type: 'image',
        media_path: 'hero/c.jpg',
        title: 'Hidden',
        sort_order: 1,
        is_enabled: false,
      },
    ],
    resolveUrl
  )

  assert.equal(slides.length, 2)
  assert.equal(slides[0].id, 'a')
  assert.equal(slides[0].mediaType, 'video')
  assert.equal(slides[0].mediaUrl, 'https://cdn.example/hero/a.mp4')
  assert.equal(slides[0].title, 'First')
  assert.equal(slides[0].ctaLabel, 'Book Consultation')
  assert.equal(slides[1].id, 'b')
})

test('mixed image and video slides normalize correctly', () => {
  const slides = buildPublicHeroSlides(
    [
      {
        id: '1',
        media_type: 'video',
        media_path: 'hero/skyline.mp4',
        poster_path: 'hero/poster.jpg',
        title: 'Building intelligent',
        title_accent: 'digital experiences',
        intro: 'for the future.',
        body: 'body',
        cta_primary_label: 'Book Consultation',
        cta_primary_url: '#contact',
        sort_order: 0,
        is_enabled: true,
      },
      {
        id: '2',
        media_type: 'image',
        media_path: 'hero/office.jpg',
        media_alt: 'Office skyline',
        title: 'Scale faster',
        sort_order: 1,
        is_enabled: true,
      },
    ],
    resolveUrl
  )

  assert.equal(slides[0].mediaType, 'video')
  assert.equal(slides[0].posterUrl, 'https://cdn.example/hero/poster.jpg')
  assert.equal(slides[1].mediaType, 'image')
  assert.equal(slides[1].mediaAlt, 'Office skyline')
  assert.equal(slides[1].title, 'Scale faster')
  // Optional fields must stay empty — never inherit homepage fallback copy
  assert.equal(slides[1].titleAccent, '')
  assert.equal(slides[1].intro, '')
  assert.equal(slides[1].body, '')
  assert.equal(slides[1].ctaLabel, '')
  assert.equal(slides[1].ctaUrl, '')
})

test('each CMS slide keeps independent copy and CTA without fallback bleed', () => {
  const slides = buildPublicHeroSlides(
    [
      {
        id: 's1',
        media_type: 'video',
        media_path: 'hero/a.mp4',
        title: 'Building intelligent',
        title_accent: 'digital experiences',
        intro: 'for the future.',
        body: FALLBACK_HERO_SLIDE_CONTENT.body,
        cta_primary_label: 'Book Consultation',
        cta_primary_url: '#contact',
        sort_order: 0,
        is_enabled: true,
      },
      {
        id: 's2',
        media_type: 'image',
        media_path: 'hero/b.jpg',
        title: 'Launch products',
        title_accent: 'that scale',
        intro: 'with confidence.',
        body: 'Custom platforms built for growth.',
        cta_primary_label: 'See services',
        cta_primary_url: '/services',
        sort_order: 1,
        is_enabled: true,
      },
    ],
    resolveUrl
  )

  assert.equal(slides[0].ctaUrl, '#contact')
  assert.equal(slides[0].titleAccent, 'digital experiences')
  assert.equal(slides[1].title, 'Launch products')
  assert.equal(slides[1].titleAccent, 'that scale')
  assert.equal(slides[1].intro, 'with confidence.')
  assert.equal(slides[1].body, 'Custom platforms built for growth.')
  assert.equal(slides[1].ctaLabel, 'See services')
  assert.equal(slides[1].ctaUrl, '/services')
})

test('empty or failed CMS rows fall back to legacy hero content', () => {
  const slides = resolvePublicHeroSlides([], resolveUrl, {
    title: 'Building intelligent',
    titleAccent: 'digital experiences',
    intro: 'for the future.',
    body: FALLBACK_HERO_SLIDE_CONTENT.body,
    ctaLabel: 'Book Consultation',
    ctaUrl: '#contact',
    useBundledBackground: true,
  })

  assert.equal(slides.length, 1)
  assert.equal(slides[0].title, 'Building intelligent')
  assert.equal(slides[0].ctaLabel, 'Book Consultation')
  assert.equal(slides[0].useBundledBackground, true)
})

test('sanitizeCtaUrl blocks unsafe schemes', () => {
  assert.equal(sanitizeCtaUrl('javascript:alert(1)'), '#contact')
  assert.equal(sanitizeCtaUrl('https://flairestack.com/contact'), 'https://flairestack.com/contact')
  assert.equal(sanitizeCtaUrl('/services'), '/services')
  assert.equal(sanitizeCtaUrl('#contact'), '#contact')
})

test('maps DB media_path fields to public mediaUrl props for rendering', () => {
  const [slide] = buildPublicHeroSlides(
    [
      {
        id: 'render-1',
        media_type: 'video',
        media_path: 'hero/chicago-skyline.mp4',
        poster_path: 'hero/poster.webp',
        title: 'Building intelligent',
        title_accent: 'digital experiences',
        intro: 'for the future.',
        body: FALLBACK_HERO_SLIDE_CONTENT.body,
        cta_primary_label: 'Book Consultation',
        cta_primary_url: '#contact',
        sort_order: 0,
        is_enabled: true,
      },
    ],
    resolveUrl
  )

  assert.equal(slide.mediaType, 'video')
  assert.equal(slide.mediaUrl, 'https://cdn.example/hero/chicago-skyline.mp4')
  assert.equal(slide.posterUrl, 'https://cdn.example/hero/poster.webp')
  assert.equal(slide.title, 'Building intelligent')
  assert.equal(slide.ctaLabel, 'Book Consultation')
})

test('slides with missing media still keep CMS copy and fall back without crashing', () => {
  const slides = resolvePublicHeroSlides(
    [
      {
        id: 'empty-media',
        media_type: 'video',
        media_path: null,
        title: 'Building intelligent',
        title_accent: 'digital experiences',
        intro: 'for the future.',
        body: FALLBACK_HERO_SLIDE_CONTENT.body,
        cta_primary_label: 'Book Consultation',
        cta_primary_url: '#contact',
        sort_order: 0,
        is_enabled: true,
      },
    ],
    resolveUrl,
    null
  )

  assert.equal(slides.length, 1)
  assert.equal(slides[0].mediaUrl, null)
  assert.equal(slides[0].title, 'Building intelligent')
})
