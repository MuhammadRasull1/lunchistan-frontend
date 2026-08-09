import { MONTHLY_SETS } from '../data/mockMenu'

export interface SaladOption {
  value: string
  imageUrl: string
}

/** Все салаты меню — выведены динамически из реальных фото public/images/dishes/salads/ */
export const SALAD_OPTIONS: SaladOption[] = MONTHLY_SETS
  .filter(set => set.category === 'salad')
  .map(set => ({ value: set.name, imageUrl: set.imageUrl ?? '' }))

/** Салат по умолчанию — первый из доступных */
export const DEFAULT_SALAD = SALAD_OPTIONS[0]?.value ?? ''
