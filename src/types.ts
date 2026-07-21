export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт';

export type Beverage = 'Вода' | 'Компот в ассортименте';

export type PaymentMethod = 'corporate' | 'card' | 'cash';

export interface LunchSet {
  id: string | number;
  dayNumber: number;
  weekDay: WeekDay;
  name: string;
  description: string;
  price: number;
}

export type MealSet = LunchSet;

export type CartState = Record<string | number, { quantity: number; beverage: Beverage }>;

export type Screen = 'catalog' | 'cart' | 'success';

export const WORK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

export const DRINK_OPTIONS: Beverage[] = ['Вода', 'Компот в ассортименте'];

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' сум';
}
