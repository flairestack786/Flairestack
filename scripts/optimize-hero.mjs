import sharp from 'sharp'

const source = 'src/assets/hero-cinematic-wide.png'
const outDir = 'src/assets'

await sharp(source)
  .resize(3840, null, { kernel: 'lanczos3', withoutEnlargement: false })
  .sharpen({ sigma: 0.6, m1: 0.4, m2: 2, x1: 2, y2: 10, y3: 20 })
  .modulate({ brightness: 1.01, saturation: 1.04 })
  .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(`${outDir}/hero-4k.jpg`)

await sharp(source)
  .resize(3840, null, { kernel: 'lanczos3', withoutEnlargement: false })
  .sharpen({ sigma: 0.6, m1: 0.4, m2: 2, x1: 2, y2: 10, y3: 20 })
  .modulate({ brightness: 1.01, saturation: 1.04 })
  .webp({ quality: 92, effort: 6 })
  .toFile(`${outDir}/hero-4k.webp`)

console.log('Hero assets written to src/assets/')
