import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCES = path.join(__dirname, 'service-image-sources.json')
const MANIFEST = path.join(ROOT, 'src', 'data', 'serviceImages.manifest.json')

const FIXES = [
  ['software-development', 'framework2'],
  ['software-development', 'framework3'],
]

function sourceUrl(entry) {
  if (entry.source === 'unsplash') {
    return `https://images.unsplash.com/${entry.id}?auto=format&fit=crop&w=1920&h=1080&q=88`
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

const sources = JSON.parse(await fs.readFile(SOURCES, 'utf8'))
const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'))

for (const [slug, slot] of FIXES) {
  const entry = sources[slug][slot]
  const dest = path.join(ROOT, 'public', 'images', 'services', slug, `${slot}.webp`)
  const res = await fetch(sourceUrl(entry), {
    headers: { 'User-Agent': 'FlaireStack/1.0' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`${slug}/${slot}: HTTP ${res.status}`)
  await gradeAndSave(Buffer.from(await res.arrayBuffer()), dest)
  manifest[slug][slot] = {
    path: `/images/services/${slug}/${slot}.webp`,
    ...entry,
  }
  console.log(`✓ ${slug}/${slot} (${entry.source}:${entry.id})`)
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log('Manifest updated')
