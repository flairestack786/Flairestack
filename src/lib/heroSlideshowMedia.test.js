import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyMediaReadyState,
  isIncomingMediaReady,
  nextSlideIndex,
  resolveHeroSlideVisual,
  slideMayUseBundledFallback,
  videoHasDisplayFrame,
  videoPreloadForSlot,
} from './heroSlideshowMedia.js'

const bundled = 'https://cdn.example/bundled-hero.jpg'

const slide1Video = {
  id: 's1',
  mediaType: 'video',
  mediaUrl: 'https://cdn.example/hero/chicago.mp4',
  posterUrl: null,
  mediaAlt: '',
  title: 'Building intelligent',
}

const slide2Image = {
  id: 's2',
  mediaType: 'image',
  mediaUrl: 'https://cdn.example/hero/office.jpg',
  posterUrl: null,
  mediaAlt: 'Office',
  title: 'Scale faster',
}

const slideVideoWithPoster = {
  id: 's3',
  mediaType: 'video',
  mediaUrl: 'https://cdn.example/hero/b.mp4',
  posterUrl: 'https://cdn.example/hero/b-poster.jpg',
  mediaAlt: '',
  title: 'Launch',
}

test('CMS video slide never resolves to bundled default while media is valid', () => {
  const visual = resolveHeroSlideVisual(slide1Video, { bundledImageSrc: bundled })
  assert.equal(visual.kind, 'video')
  assert.equal(visual.src, slide1Video.mediaUrl)
  assert.equal(slideMayUseBundledFallback(slide1Video), false)
})

test('returning to first video slide still prefers CMS video over bundled', () => {
  // Simulates wrap: last → first. Even without poster, valid mediaUrl wins.
  const visual = resolveHeroSlideVisual(slide1Video, {
    bundledImageSrc: bundled,
    videoFailed: false,
    reducedMotion: false,
  })
  assert.notEqual(visual.kind, 'bundled')
  assert.equal(visual.kind, 'video')
  assert.equal(visual.src, slide1Video.mediaUrl)
})

test('inactive-equivalent resolution still keeps video src (no bundled flash)', () => {
  // Previously, inactive slides unmounted video and fell through to bundled.
  // resolveHeroSlideVisual is isActive-agnostic — callers must keep video mounted.
  const visual = resolveHeroSlideVisual(slide1Video, { bundledImageSrc: bundled })
  assert.equal(visual.kind, 'video')
  assert.notEqual(visual.src, bundled)
})

test('image slide uses CMS image, never bundled', () => {
  const visual = resolveHeroSlideVisual(slide2Image, { bundledImageSrc: bundled })
  assert.equal(visual.kind, 'image')
  assert.equal(visual.src, slide2Image.mediaUrl)
})

test('failed video uses poster before bundled', () => {
  const visual = resolveHeroSlideVisual(slideVideoWithPoster, {
    bundledImageSrc: bundled,
    videoFailed: true,
  })
  assert.equal(visual.kind, 'image')
  assert.equal(visual.src, slideVideoWithPoster.posterUrl)
})

test('failed video without poster may use bundled last resort', () => {
  const visual = resolveHeroSlideVisual(slide1Video, {
    bundledImageSrc: bundled,
    videoFailed: true,
  })
  assert.equal(visual.kind, 'bundled')
  assert.equal(visual.src, bundled)
  assert.equal(slideMayUseBundledFallback(slide1Video, { videoFailed: true }), true)
})

test('reduced motion prefers poster over playing video', () => {
  const visual = resolveHeroSlideVisual(slideVideoWithPoster, {
    bundledImageSrc: bundled,
    reducedMotion: true,
  })
  assert.equal(visual.kind, 'image')
  assert.equal(visual.src, slideVideoWithPoster.posterUrl)
})

test('explicit legacy fallback slide may use bundled', () => {
  const visual = resolveHeroSlideVisual(
    {
      id: 'fallback-hero',
      mediaType: 'image',
      mediaUrl: null,
      posterUrl: null,
      useBundledBackground: true,
      title: 'Building intelligent',
    },
    { bundledImageSrc: bundled }
  )
  assert.equal(visual.kind, 'bundled')
  assert.equal(visual.src, bundled)
})

test('video readiness requires a displayable frame', () => {
  assert.equal(videoHasDisplayFrame(null), false)
  assert.equal(videoHasDisplayFrame({ readyState: 0 }), false)
  assert.equal(videoHasDisplayFrame({ readyState: 1 }), false)
  assert.equal(videoHasDisplayFrame({ readyState: 2 }), true)
  assert.equal(videoHasDisplayFrame({ readyState: 4 }), true)
})

test('incoming video waits for readiness; images default ready', () => {
  assert.equal(
    isIncomingMediaReady({ kind: 'video', src: 'a.mp4' }, { videoReady: false }),
    false
  )
  assert.equal(
    isIncomingMediaReady({ kind: 'video', src: 'a.mp4' }, { videoReady: true }),
    true
  )
  assert.equal(isIncomingMediaReady({ kind: 'image', src: 'a.jpg' }, {}), true)
  assert.equal(
    isIncomingMediaReady({ kind: 'image', src: 'a.jpg' }, { imageReady: false }),
    false
  )
})

test('stale readiness events do not overwrite current generation', () => {
  const current = { s1: true }
  const stale = applyMediaReadyState(current, 's2', true, 1, 2)
  assert.deepEqual(stale, current)
  const fresh = applyMediaReadyState(current, 's2', true, 2, 2)
  assert.equal(fresh.s2, true)
  assert.equal(fresh.s1, true)
})

test('preload is auto for active, metadata for next, none otherwise', () => {
  assert.equal(videoPreloadForSlot({ isActive: true, isNext: false }), 'auto')
  assert.equal(videoPreloadForSlot({ isActive: false, isNext: true }), 'metadata')
  assert.equal(videoPreloadForSlot({ isActive: false, isNext: false }), 'none')
})

test('nextSlideIndex wraps from last to first', () => {
  assert.equal(nextSlideIndex(1, 2), 0)
  assert.equal(nextSlideIndex(0, 2), 1)
})
