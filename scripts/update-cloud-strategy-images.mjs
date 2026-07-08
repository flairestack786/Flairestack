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
const SLUG = 'cloud-strategy'

/** Pexels + Unsplash — royalty-free photography only (no AI-generated art). */
const CURATED = {
  hero: { source: 'unsplash', id: '1558494949-ef010cbdcc31' },
  overview: { source: 'unsplash', id: '1580894732444-8ecded7900cd' },
  banner: { source: 'unsplash', id: '1451187580459-43490279c0fa' },
  features: { source: 'pexels', id: 6466141 },
  tech: { source: 'unsplash', id: '1518770660439-4636190af475' },
  process: { source: 'unsplash', id: '1504384308090-c894fdcc538d' },
  benefits: { source: 'pexels', id: 2148217 },
  cta: { source: 'unsplash', id: '1531297484001-80022131f5a1' },
  framework1: { source: 'unsplash', id: '1573164713988-8665fc963095' },
  framework2: { source: 'unsplash', id: '1544197150-b99a580bb7a8' },
  framework3: { source: 'unsplash', id: '1607799279861-4dd421887fb3' },
  framework4: { source: 'pexels', id: 2881232 },
  framework5: { source: 'unsplash', id: '1487058792275-0ad4aaf24ca7' },
  clientBenefits: { source: 'unsplash', id: '1498050108023-c5249f4df085' },
  implementationApproach: { source: 'unsplash', id: '1508830524289-0adcbe822b40' },
  businessOutcomes: { source: 'pexels', id: 4508751 },
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
console.log('Cloud Strategy: 16 images updated')
