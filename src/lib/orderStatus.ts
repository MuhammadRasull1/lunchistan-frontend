import type { Lang } from '../types'
import { t } from '../locales/translations'
import type { OrderStatus } from './api'

/** Локализованная подпись статуса заказа. */
export function statusLabel(lang: Lang, status: string): string {
  return t(lang, `status_${status}`)
}

/** Цвет-подсказка статуса (CSS-переменная / hex) для бейджа. */
export function statusColor(status: string): string {
  switch (status) {
    case 'new': return 'var(--brand)'
    case 'confirmed': return '#2563eb'
    case 'in_progress': return '#7c3aed'
    case 'delivered': return '#0891b2'
    case 'paid': return '#22a058'
    case 'cancelled': return 'var(--destructive)'
    default: return 'var(--text-muted)'
  }
}

/** Следующие разумные статусы для ручного перевода владельцем. */
export function nextStatuses(current: string): OrderStatus[] {
  switch (current) {
    case 'new': return ['confirmed', 'cancelled']
    case 'confirmed': return ['in_progress', 'cancelled']
    case 'in_progress': return ['delivered', 'cancelled']
    case 'delivered': return ['paid']
    case 'paid': return []
    case 'cancelled': return ['new']
    default: return []
  }
}

export function formatMoney(n: number, lang: Lang): string {
  const suffix = lang === 'uz' ? "so'm" : 'сум'
  return `${Math.round(n).toLocaleString('ru-RU')} ${suffix}`
}

export function dateChip(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][new Date(y, m - 1, d).getDay()]
  const wdUz = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][new Date(y, m - 1, d).getDay()]
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')} · ${lang === 'uz' ? wdUz : wd}`
}
