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

const FRAMEWORK = {
  framework1: { source: 'pexels', id: 7915289 },
  framework2: { source: 'pexels', id: 9071692 },
  framework3: { source: 'pexels', id: 7567535 },
  framework4: { source: 'pexels', id: 3165335 },
}

function sourceUrl(entry) {
  if (entry.source === 'unsplash') {
    return `https://images.unsplash.com/photo-${entry.id}?auto=format&fit=crop&w=1920&h=1080&q=88`
  }
  return `https://images.pexels.com/photos/${entry.id}/pexels-photo-${entry.id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`
}

async function gradeAndSave(buffer, destPath) {
  await sharp(buffer)
    .resize(1920, 1080, { fit: 'cover', position: 'attention' })
    .modulate({ brightness: 0.88, saturation: 0.82 })
    .linear(1.08, -(102 * 0.08))
    .webp({ quality: 88 })
    .toFile(destPath)
}

const alts = {}
for (const [slug, slots] of Object.entries(serviceImageDescriptions)) {
  alts[slug] = { ...slots }
}
await fs.writeFile(ALTS, JSON.stringify(alts, null, 2))

const sources = JSON.parse(await fs.readFile(SOURCES, 'utf8'))
const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'))
const dir = path.join(ROOT, 'public', 'images', 'services', SLUG)

for (const [slot, entry] of Object.entries(FRAMEWORK)) {
  sources[SLUG][slot] = { ...entry, alt: serviceImageDescriptions[SLUG][slot] }
  const dest = path.join(dir, `${slot}.webp`)
  const res = await fetch(sourceUrl(entry), { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status}`)
  await gradeAndSave(Buffer.from(await res.arrayBuffer()), dest)
  manifest[SLUG][slot] = { path: `/images/services/${SLUG}/${slot}.webp`, ...sources[SLUG][slot] }
  console.log(`✓ ${slot} (${entry.source}:${entry.id})`)
}

await fs.writeFile(SOURCES, JSON.stringify(sources, null, 2))
await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log('Game Development: 4 framework images updated')
