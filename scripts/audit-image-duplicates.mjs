import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const IMG_ROOT = path.join(ROOT, 'public', 'images', 'services')

async function hashFile(filePath) {
  const buf = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.name.endsWith('.webp')) files.push(full)
  }
  return files
}

const files = await walk(IMG_ROOT)
const byHash = new Map()

for (const file of files) {
  const hash = await hashFile(file)
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  if (!byHash.has(hash)) byHash.set(hash, [])
  byHash.get(hash).push(rel)
}

const dupes = [...byHash.entries()].filter(([, paths]) => paths.length > 1)
console.log(`Total WebP files: ${files.length}`)
console.log(`Unique hashes: ${byHash.size}`)
console.log(`Duplicate groups: ${dupes.length}`)
for (const [hash, paths] of dupes) {
  console.log('\nDUPLICATE:', hash.slice(0, 12))
  paths.forEach((p) => console.log('  ', p))
}
