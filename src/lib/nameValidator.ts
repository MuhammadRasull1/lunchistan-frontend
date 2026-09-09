const CYR_ROW_1 = 'йцукенгшщзхъ'
const CYR_ROW_2 = 'фывапролджэ'
const CYR_ROW_3 = 'ячсмитьбю'
const LAT_ROW_1 = 'qwertyuiop'
const LAT_ROW_2 = 'asdfghjkl'
const LAT_ROW_3 = 'zxcvbnm'
const ROWS = [CYR_ROW_1, CYR_ROW_2, CYR_ROW_3, LAT_ROW_1, LAT_ROW_2, LAT_ROW_3]
const VOWELS = 'аеёиоуыэюяaeiouy'

// + узбекская кириллица (Ў/ў Қ/қ Ғ/ғ Ҳ/ҳ) и апостроф-модификатор (ʻ/ʼ, как в
// "Gʻayrat"/"Oʻktam") — без них реальные узбекские имена не проходили валидацию.
const ALLOWED = /^[a-zA-Zа-яА-ЯёЁЎўҚқҒғҲҳʻʼ\s'’-]+$/

function isAdjacentInRow(a: string, b: string): boolean {
  for (const row of ROWS) {
    const ia = row.indexOf(a)
    const ib = row.indexOf(b)
    if (ia !== -1 && ib !== -1) return Math.abs(ia - ib) === 1
  }
  return false
}

/** Максимальная непрерывная цепочка соседних клавиш в одном ряду («йцукен», «фыва», «qwerty»). */
function maxKeyboardRun(lower: string): number {
  let best = 0
  let run = 0
  for (let i = 0; i < lower.length - 1; i++) {
    if (isAdjacentInRow(lower[i], lower[i + 1])) run += 1
    else run = 0
    if (run > best) best = run
  }
  return best
}

/** Проверка «настоящего имени»: кириллица/латиница, 2–50, есть гласная, не бессмыслица вроде «йцукен». */
export function isValidName(raw: string): boolean {
  const name = (raw || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 50) return false
  if (name.split(/\s+/).some(part => part.length === 1)) return false
  if (!ALLOWED.test(name)) return false
  const letters = name.replace(/[^a-zA-Zа-яА-ЯёЁЎўҚқҒғҲҳ]/g, '')
  if (letters.length < 2) return false
  const lower = letters.toLowerCase()
  if (![...lower].some(ch => VOWELS.includes(ch))) return false
  const distinct = new Set(lower)
  if (distinct.size < 2) return false
  if (maxKeyboardRun(lower) >= 3) return false
  return true
}