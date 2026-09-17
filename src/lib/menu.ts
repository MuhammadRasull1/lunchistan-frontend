// Раньше здесь была ещё getSetForDate() — детерминированная «ротация»
// MONTHLY_SETS[(ordinal-1) % length], назначавшая блюдо дню по номеру дня месяца.
// 17.09.2026: выяснилось, что блюда бизнеса не повторяются день в день — ротация
// была неверной моделью реальности и удалена. Блюдо на дату теперь приходит с
// бэкенда (fetchDayMenu(date), src/lib/api.ts) и либо выбирается клиентом
// (item.setId), либо назначается автоматически, если на дату предложено ровно
// одно блюдо (см. App.tsx, ensureDayMenu).
import type { LunchSet } from '../types'

/** Сет по id (выбор клиента). undefined — если id не из текущего меню. */
export function getSetById(sets: LunchSet[], id: number | string | null | undefined): LunchSet | undefined {
  if (id == null) return undefined
  return sets.find(set => Number(set.id) === Number(id))
}
