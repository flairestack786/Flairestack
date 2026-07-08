import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { serviceImageDescriptions } from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCES = path.join(__dirname, 'service-image-sources.json')
const MANIFEST = path.join(ROOT, 'src', 'data', 'serviceImages.manifest.json')
const ALTS = path.join(ROOT, 'src', 'data', 'serviceImageAlts.json')
const SLUG = 'game-development'
const SLOT = 'process'
const ENTRY = { source: 'pexels', id: 7915434 }

const alts = {}
for (const [slug, slots] of Object.entries(serviceImageDescriptions)) {
  alts[slug] = { ...slots }
}
await fs.writeFile(ALTS, JSON.stringify(alts, null, 2))

const sources = JSON.parse(await fs.readFile(SOURCES, 'utf8'))
const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'))
sources[SLUG][SLOT] = { ...ENTRY, alt: serviceImageDescriptions[SLUG][SLOT] }

const url = `https://images.pexels.com/photos/${ENTRY.id}/pexels-photo-${ENTRY.id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`
const res = await fetch(url, { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
if (!res.ok) throw new Error(`HTTP ${res.status}`)

const dest = path.join(ROOT, 'public', 'images', 'services', SLUG, `${SLOT}.webp`)
await sharp(Buffer.from(await res.arrayBuffer()))
  .resize(1920, 1080, { fit: 'cover', position: 'attention' })
  .modulate({ brightness: 0.88, saturation: 0.82 })
  .linear(1.08, -(102 * 0.08))
  .webp({ quality: 88 })
  .toFile(dest)

manifest[SLUG][SLOT] = { path: `/images/services/${SLUG}/${SLOT}.webp`, ...sources[SLUG][SLOT] }
await fs.writeFile(SOURCES, JSON.stringify(sources, null, 2))
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log(`✓ ${SLOT} (pexels:${ENTRY.id})`)
