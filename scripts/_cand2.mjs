import sharp from 'sharp'

const candidates = [
  ['fw2', 5473297],
  ['fw2', 8728382],
  ['fw3', 5380664],
  ['fw3', 7679479],
  ['fw3', 3206177],
  ['fw2', 1181244],
]
const W = 280
const H = 170
const cells = []
for (const [tag, id] of candidates) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=560&h=340&fit=crop`
  const res = await fetch(url, { headers: { 'User-Agent': 'F' } })
  if (!res.ok) continue
  const img = await sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: 'cover' }).png().toBuffer()
  const label = Buffer.from(
    `<svg width="${W}" height="24"><rect width="100%" height="100%" fill="#111"/><text x="8" y="17" font-family="Arial" font-size="12" fill="#0f0">${tag} ${id}</text></svg>`
  )
  cells.push(
    await sharp({ create: { width: W, height: H + 24, channels: 3, background: '#111' } })
      .composite([{ input: img, top: 0, left: 0 }, { input: label, top: H, left: 0 }])
      .png()
      .toBuffer()
  )
}
await sharp({
  create: { width: W * 3, height: (H + 24) * 2, channels: 3, background: '#000' },
})
  .composite(cells.map((input, i) => ({ input, left: (i % 3) * W, top: Math.floor(i / 3) * (H + 24) })))
  .png()
  .toFile('scripts/cand-fw2.png')
console.log('done')
