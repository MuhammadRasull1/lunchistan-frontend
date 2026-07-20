export interface Dish {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  /** Day of week this dish is available. If omitted, it's available every day. */
  day?: WeekDay
}

export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт'

export const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']

export type Screen = 'catalog' | 'cart' | 'success'

export type PaymentMethod = 'corporate' | 'card'

/** Map of dishId -> quantity */
export type CartState = Record<number, number>

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('ru-RU').format(value) + ' сум'
