import type { CartState } from '../types'
import { isValidDateString } from './calendar'

// v3 — у дня появилось выбранное блюдо (setId); старые сохранёнки несовместимы.
const STORAGE_KEY = 'lunchistan:order:v3'

export interface SavedOrder {
  employeeCount: number
  cartState: CartState
}

function isValidCartItem(value: unknown): value is CartState[string] {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const setIdOk = item.setId === null || item.setId === undefined || typeof item.setId === 'number'
  return (
    typeof item.active === 'boolean' &&
    typeof item.portions === 'number' && item.portions >= 1 &&
    (item.beverage === 'Вода' || item.beverage === 'Компот в ассортименте') &&
    typeof item.salad === 'string' &&
    setIdOk
  )
}

/** Считывает и валидирует сохранённую конфигурацию заказа. Некорректные/устаревшие данные — игнорируются. */
export function loadSavedOrder(): SavedOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedOrder> | null
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.employeeCount !== 'number' || parsed.employeeCount < 1) return null
    if (!parsed.cartState || typeof parsed.cartState !== 'object') return null

    const validCartState: CartState = {}
    for (const [date, item] of Object.entries(parsed.cartState)) {
      // Ключом дня является дата YYYY-MM-DD; всё остальное (устаревшие id) отбрасываем.
      if (isValidDateString(date) && isValidCartItem(item)) {
        validCartState[date] = { ...item, setId: typeof item.setId === 'number' ? item.setId : null }
      }
    }
    if (Object.keys(validCartState).length === 0) return null

    return {
      employeeCount: parsed.employeeCount,
      cartState: validCartState,
    }
  } catch {
    return null
  }
}

export function saveOrder(order: SavedOrder): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // localStorage недоступен (приватный режим/квота) — тихо игнорируем
  }
}

export function clearSavedOrder(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
