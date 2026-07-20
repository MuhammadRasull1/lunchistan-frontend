export interface MealSet {
  id: number
  name: string
  description: string
  price: number
  /** Day of week this set is available. */
  day?: WeekDay
}

export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс'

export const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export type Screen = 'catalog' | 'cart' | 'success'

export type PaymentMethod = 'corporate' | 'card'

/** Map of setId -> quantity */
export type CartState = Record<number, number>

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('ru-RU').format(value) + ' сум'
