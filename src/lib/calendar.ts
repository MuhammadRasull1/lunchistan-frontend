import type { Lang, PresetPattern } from '../types'
import { MONTHS, WEEKDAYS_SHORT } from '../locales/translations'

/** Ячейка календаря (один день месяца либо пустая ячейка выравнивания сетки) */
export interface CalendarCell {
  /** Дата в формате YYYY-MM-DD; отсутствует для пустых ячеек */
  date?: string
  /** Число месяца (1..31); 0 для пустых ячеек */
  dayOfMonth: number
  /** День недели по getDay(): 0 = Вс ... 6 = Сб */
  weekday: number
  /** Пустая ячейка выравнивания (день вне видимого месяца) */
  isEmpty?: boolean
  /** Выходной (Сб/Вс) — доступен для выбора, но визуально отличается */
  isWeekend?: boolean
}

/** Неделя месяца — ровно 7 ячеек (Пн..Вс) */
export interface CalendarWeek {
  cells: CalendarCell[]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Валидация строки даты YYYY-MM-DD */
export function isValidDateString(value: string): boolean {
  return DATE_RE.test(value)
}

/** Форматирует Date в YYYY-MM-DD (без timezone-сдвигов, только локальные компоненты) */
export function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Первый день месяца */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Сдвиг на n месяцев (результат — первый день месяца) */
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

/** Ключ месяца YYYY-MM по компонентам даты */
export function monthKeyOf(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

/** Ключ месяца YYYY-MM по строке даты */
export function monthKeyOfDate(date: string): string {
  return date.slice(0, 7)
}

/** Разбор ключа месяца в { year, monthIndex } (monthIndex 0..11) */
export function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, monthIndex: month - 1 }
}

/**
 * Все дни видимого месяца в виде ячеек календаря.
 * Сетка выравнивается по дню недели 1-го числа (колонка «Пн» — первый столбец):
 * перед началом месяца добавляются пустые ячейки, в конце — до конца недели.
 * Все реальные даты доступны для выбора, включая субботу и воскресенье.
 */
export function buildMonthGrid(month: Date): CalendarCell[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: CalendarCell[] = []
  // Ведущие пустые ячейки: сколько «слотов» занимает 1-е число в сетке Пн→Вс
  const leadOffset = (new Date(year, monthIndex, 1).getDay() + 7 - 1) % 7
  for (let i = 0; i < leadOffset; i++) {
    cells.push({ dayOfMonth: 0, weekday: (1 + i) % 7, isEmpty: true })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    const weekday = date.getDay()
    cells.push({
      date: formatDate(date),
      dayOfMonth: day,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
    })
  }
  // Хвостовые пустые ячейки — до конца последней строки недели
  while (cells.length % 7 !== 0) {
    cells.push({ dayOfMonth: 0, weekday: 0, isEmpty: true })
  }
  return cells
}

/** Недели видимого месяца (сетка из buildMonthGrid, разбитая по 7 ячеек) */
export function buildMonthWeeks(month: Date): CalendarWeek[] {
  const cells = buildMonthGrid(month)
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push({ cells: cells.slice(i, i + 7) })
  }
  return weeks
}

/** Пн–Пт конкретной недели (в пределах видимого месяца) — пресет «Вся рабочая неделя» */
export function workWeekDatesOf(week: CalendarWeek): string[] {
  return week.cells
    .filter(cell => !cell.isEmpty && cell.date !== undefined && cell.weekday >= 1 && cell.weekday <= 5)
    .map(cell => cell.date as string)
}

/** Все допустимые (Пн-Пт) даты месяца YYYY-MM */
export function getSelectableDates(monthKey: string): string[] {
  const { year, monthIndex } = parseMonthKey(monthKey)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const dates: string[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    const weekday = date.getDay()
    if (weekday !== 0 && weekday !== 6) dates.push(formatDate(date))
  }
  return dates
}

const PATTERNS: Record<Exclude<PresetPattern, 'full'>, { cycle: number; workPositions: number[] }> = {
  '2/2': { cycle: 4, workPositions: [0, 1] },
  '5/2': { cycle: 7, workPositions: [0, 1, 2, 3, 4] },
  '6/1': { cycle: 7, workPositions: [0, 1, 2, 3, 4, 5] },
}

/**
 * Строит график рабочих дней по пресету для месяца YYYY-MM.
 * Паттерн начинается от даты начала подписки (1-е число месяца) как день №1 и
 * применяется к последовательности допустимых дней (Пн-Пт): выходные не выбираются.
 * 'full' — все допустимые даты месяца.
 */
export function buildPresetDates(monthKey: string, pattern: PresetPattern): string[] {
  const selectable = getSelectableDates(monthKey)
  if (pattern === 'full') return selectable
  const { cycle, workPositions } = PATTERNS[pattern]
  return selectable.filter((_, index) => workPositions.includes(index % cycle))
}

/** Человекочитаемая подпись даты: "03.08 · Пн" */
export function formatDayLabel(date: string, lang: Lang): string {
  const year = Number(date.slice(0, 4))
  const monthIndex = Number(date.slice(5, 7)) - 1
  const day = Number(date.slice(8, 10))
  const d = new Date(year, monthIndex, day)
  const label = `${String(day).padStart(2, '0')}.${String(monthIndex + 1).padStart(2, '0')}`
  return `${label} · ${WEEKDAYS_SHORT[lang][d.getDay()]}`
}

/** Название месяца для заголовка календаря: "Август 2026" */
export function formatMonthLabel(month: Date, lang: Lang): string {
  return `${MONTHS[lang][month.getMonth()]} ${month.getFullYear()}`
}
