import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { serviceImageDescriptions, IMAGE_SLOTS } from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCES = path.join(__dirname, 'service-image-sources.json')
const MANIFEST = path.join(ROOT, 'src', 'data', 'serviceImages.manifest.json')
const ALTS = path.join(ROOT, 'src', 'data', 'serviceImageAlts.json')
const SLUG = 'ai-development'

const CURATED = {
  hero: { source: 'pexels', id: 8294608 },
  overview: { source: 'pexels', id: 8297478 },
  banner: { source: 'pexels', id: 8297480 },
  features: { source: 'pexels', id: 8386437 },
  tech: { source: 'unsplash', id: '1551288049-bebda4e38f71' },
  process: { source: 'pexels', id: 8438923 },
  benefits: { source: 'pexels', id: 8566474 },
  cta: { source: 'pexels', id: 8386439 },
  framework1: { source: 'unsplash', id: '1635070041078-e363dbe005cb' },
  framework2: { source: 'unsplash', id: '1550751827-4bd374c3f58b' },
  framework3: { source: 'unsplash', id: '1504639725590-34d0984388bd' },
  framework4: { source: 'pexels', id: 8438917 },
  framework5: { source: 'pexels', id: 8386438 },
  clientBenefits: { source: 'pexels', id: 8294609 },
  implementationApproach: { source: 'pexels', id: 8438919 },
  businessOutcomes: { source: 'pexels', id: 8297481 },
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

sources[SLUG] = {}
for (const slot of IMAGE_SLOTS) {
  const entry = CURATED[slot]
  sources[SLUG][slot] = {
    ...entry,
    alt: serviceImageDescriptions[SLUG][slot],
  }
}
await fs.writeFile(SOURCES, JSON.stringify(sources, null, 2))

const dir = path.join(ROOT, 'public', 'images', 'services', SLUG)
await fs.mkdir(dir, { recursive: true })

for (const slot of IMAGE_SLOTS) {
  const entry = sources[SLUG][slot]
  const dest = path.join(dir, `${slot}.webp`)
  const res = await fetch(sourceUrl(entry), { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status}`)
  await gradeAndSave(Buffer.from(await res.arrayBuffer()), dest)
  manifest[SLUG][slot] = { path: `/images/services/${SLUG}/${slot}.webp`, ...entry }
  console.log(`✓ ${slot} (${entry.source}:${entry.id})`)
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log('AI Development: 16 images updated')
