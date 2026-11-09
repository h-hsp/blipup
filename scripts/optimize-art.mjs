// Shrinks Higgsfield art (≈1MB 1024px PNG/WebP) into small WebP for phones.
// Run after adding new art:  npm run art
import { readdir, readFile, writeFile, rm } from 'node:fs/promises'
import sharp from 'sharp'

const jobs = [
  { dir: 'public/blips', size: 512 },
  { dir: 'public/art', size: 1080 },
]

for (const { dir, size } of jobs) {
  for (const f of await readdir(dir)) {
    if (!/\.(png|webp)$/i.test(f) || f === 'icon.png') continue
    const path = `${dir}/${f}`
    const input = await readFile(path) // read fully first so we can overwrite in place
    if (input.length < 300_000 && f.endsWith('.webp')) continue // already optimised
    const out = await sharp(input).resize(size, size, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 90 }).toBuffer()
    const target = path.replace(/\.png$/i, '.webp')
    await writeFile(target, out)
    if (target !== path) await rm(path)
    console.log(`${target}  ${(input.length / 1024) | 0}KB → ${(out.length / 1024) | 0}KB`)
  }
}
