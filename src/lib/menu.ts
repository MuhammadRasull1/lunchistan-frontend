// Раньше это были getSetForDate/getSetById в data/mockMenu.ts, работавшие с глобальной
// константой MONTHLY_SETS. С 11.09.2026 меню приходит с бэкенда (fetchMenu), поэтому те же
// функции принимают список явным параметром — логика ротации не менялась.
import type { LunchSet } from '../types'

/**
 * Глобальная «порядковая» привязка дата → сет меню в пределах видимого окна
 * календаря (текущий + следующий месяц). Даёт возможность заказать все сеты:
 * ordinal = количество дней с 1-го числа текущего месяца до даты + 1
 * (даты следующего месяца продолжают счёт), затем модуль по числу сетов.
 * Детерминировано: выбор/снятие других дат не меняет сет для данной даты.
 */
export function getSetForDate(sets: LunchSet[], date: string): LunchSet | undefined {
  if (!sets.length) return undefined
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const ordinal = Math.floor((target.getTime() - monthStart.getTime()) / 86400000) + 1
  const idx = ((ordinal - 1) % sets.length + sets.length) % sets.length
  return sets[idx]
}

/** Сет по id (выбор клиента). undefined — если id не из текущего меню. */
export function getSetById(sets: LunchSet[], id: number | string | null | undefined): LunchSet | undefined {
  if (id == null) return undefined
  return sets.find(set => Number(set.id) === Number(id))
}
