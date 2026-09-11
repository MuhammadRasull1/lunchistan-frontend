import type { LunchSet } from '../types'

export interface SaladOption {
  value: string
  imageUrl: string
}

// До 11.09.2026 это были константы, вычисленные один раз из захардкоженного MONTHLY_SETS.
// Теперь меню приходит с бэкенда асинхронно, поэтому список салатов и салат по умолчанию —
// функции от текущего меню, а не модульные константы.

/** Все салаты меню — выведены динамически из текущего списка блюд. */
export function getSaladOptions(menu: LunchSet[]): SaladOption[] {
  return menu
    .filter(set => set.category === 'salad')
    .map(set => ({ value: set.name, imageUrl: set.imageUrl ?? '' }))
}

/** Салат по умолчанию — первый из доступных; пустая строка, пока меню не загружено. */
export function getDefaultSalad(menu: LunchSet[]): string {
  return getSaladOptions(menu)[0]?.value ?? ''
}
