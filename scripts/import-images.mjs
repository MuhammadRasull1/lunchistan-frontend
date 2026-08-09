import { readdir, stat, mkdir, copyFile, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const SRC_ROOT = path.join(homedir(), 'Загрузки', 'Telegram Desktop')
const DEST_ROOT = path.resolve('public', 'images', 'dishes')

const CATEGORY_SLUGS = {
  'Горячие блюда': 'hot-dishes',
  'Салаты': 'salads',
  'Супы': 'soups',
  'Закуски': 'appetizers',
  'Каши и гарниры': 'sides',
  'Фастфуд': 'fastfood',
  'Разное': 'misc',
}

const MAX_WIDTH = 1200
const JPEG_QUALITY = 80

function translit(text) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya',
  }
  const lower = text.toLowerCase()
  let out = ''
  for (const ch of lower) {
    if (/[a-z0-9]/.test(ch)) out += ch
    else if (ch in map) out += map[ch]
    else out += '-'
  }
  return out.replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}

function slugify(filename) {
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  return `${translit(base)}.jpg`
}

async function fileExists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

const used = new Map()

async function uniquePath(dir, slug) {
  let candidate = slug
  let n = 2
  while (used.has(candidate)) {
    const ext = path.extname(slug)
    candidate = `${path.basename(slug, ext)}-${n}${ext}`
    n += 1
  }
  used.set(candidate, true)
  return path.join(dir, candidate)
}

async function processFile(src, dest) {
  if (await fileExists(dest)) {
    console.log(`  skip (exists)  ${path.basename(dest)}`)
    return
  }
  const meta = await sharp(src).metadata()
  const width = meta.width || MAX_WIDTH
  const pipeline = sharp(src).rotate()
  if (width > MAX_WIDTH) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(dest)
  console.log(`  ok  ${path.basename(dest)}  (${Math.round((await stat(dest)).size / 1024)} KB)`)
}

const entries = Object.entries(CATEGORY_SLUGS)
for (const [cat, slugDir] of entries) {
  const srcDir = path.join(SRC_ROOT, cat)
  const destDir = path.join(DEST_ROOT, slugDir)
  let files = []
  try {
    files = await readdir(srcDir)
  } catch {
    console.log(`[${cat}] source folder not found, skipped`)
    continue
  }
  const imgs = files.filter((f) => /\.jpe?g$/i.test(f)).sort()
  if (imgs.length === 0) {
    console.log(`[${cat}] no jpg files`)
    continue
  }
  await mkdir(destDir, { recursive: true })
  console.log(`[${cat}] -> ${slugDir} (${imgs.length} files)`)
  for (const f of imgs) {
    const dest = await uniquePath(destDir, slugify(f))
    await processFile(path.join(srcDir, f), dest)
  }
}

console.log('\nDone.')
