#!/usr/bin/env node
/**
 * Compress a local hero background video before CMS upload.
 * Requires ffmpeg on PATH. Does not delete the source file.
 *
 * Usage:
 *   node scripts/compress-hero-video.mjs path/to/input.mp4
 *   node scripts/compress-hero-video.mjs path/to/input.mp4 --out path/to/output.mp4
 *
 * Target: ~1920px wide H.264 + AAC-free (muted hero), CRF 28, slow preset.
 * Re-upload the output through CMS Home → Hero Slideshow (unique Storage key).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function printHelp() {
  console.log(`Compress a hero video for FlaireStack CMS upload.

Usage:
  node scripts/compress-hero-video.mjs <input.mp4|webm> [--out <output.mp4>]

Notes:
  - Source file is never deleted.
  - Output is H.264 MP4 suitable for muted looping hero backgrounds.
  - After compress, upload via CMS (do not overwrite the Storage object by hand).
`)
}

function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp()
  process.exit(args.length === 0 ? 1 : 0)
}

const outFlag = args.indexOf('--out')
let outPath = null
const positional = []
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--out') {
    outPath = args[i + 1] ?? null
    i += 1
    continue
  }
  positional.push(args[i])
}

const inputPath = positional[0]
if (!inputPath || outFlag !== -1 && !outPath) {
  printHelp()
  process.exit(1)
}

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`)
  process.exit(1)
}

const resolvedOut =
  outPath ||
  path.join(
    path.dirname(inputPath),
    `${path.basename(inputPath, path.extname(inputPath))}.hero-compressed.mp4`
  )

const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  console.error('ffmpeg was not found on PATH. Install ffmpeg, then re-run this script.')
  process.exit(1)
}

const inputSize = fs.statSync(inputPath).size
console.log(`Input:  ${inputPath} (${formatBytes(inputSize)})`)
console.log(`Output: ${resolvedOut}`)

const result = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    inputPath,
    '-an',
    '-vf',
    "scale='min(1920,iw)':-2",
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'slow',
    '-crf',
    '28',
    '-movflags',
    '+faststart',
    resolvedOut,
  ],
  { stdio: 'inherit' }
)

if (result.status !== 0) {
  console.error('ffmpeg failed.')
  process.exit(result.status ?? 1)
}

const outputSize = fs.statSync(resolvedOut).size
const ratio = inputSize > 0 ? ((1 - outputSize / inputSize) * 100).toFixed(1) : '—'
console.log(`Done. ${formatBytes(inputSize)} → ${formatBytes(outputSize)} (${ratio}% smaller)`)
console.log('Upload the compressed file in CMS Home → Hero Slideshow. Keep a poster image set.')
