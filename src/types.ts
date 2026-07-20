export type DishCategory = 'Основное' | 'Гарнир' | 'Салат' | 'Суп' | 'Напиток'

export interface Dish {
  id: number
  name: string
  price: number
  category: DishCategory
  description?: string
  imageUrl?: string
  /** Day of week this dish is available. If omitted, it's available every day. */
  day?: WeekDay
}

export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс'

export const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export type Screen = 'catalog' | 'cart' | 'success'

export type PaymentMethod = 'corporate' | 'card'

/** Map of dishId -> quantity */
export type CartState = Record<number, number>

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('ru-RU').format(value) + ' сум'
