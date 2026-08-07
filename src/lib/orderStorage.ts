import type { CartState } from '../types'

const STORAGE_KEY = 'lunchistan:order:v1'

export interface SavedOrder {
  employeeCount: number
  workDaysCount: number
  cartState: CartState
}

function isValidCartItem(value: unknown): value is CartState[string] {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.active === 'boolean' &&
    typeof item.portions === 'number' && item.portions >= 1 &&
    (item.beverage === 'Вода' || item.beverage === 'Компот в ассортименте') &&
    (item.salad === 'Оливье' || item.salad === 'Винегрет' || item.salad === 'Цезарь')
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
    if (typeof parsed.workDaysCount !== 'number' || parsed.workDaysCount < 1) return null
    if (!parsed.cartState || typeof parsed.cartState !== 'object') return null

    const validCartState: CartState = {}
    for (const [id, item] of Object.entries(parsed.cartState)) {
      if (isValidCartItem(item)) validCartState[id] = item
    }
    if (Object.keys(validCartState).length === 0) return null

    return {
      employeeCount: parsed.employeeCount,
      workDaysCount: parsed.workDaysCount,
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
