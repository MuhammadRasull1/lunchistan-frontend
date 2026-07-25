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

export interface CartItem {
  beverage: Beverage;
  /** День включён в подписку (true) или пропущен (false) */
  active: boolean;
}

export type CartState = Record<string | number, CartItem>;

export type Screen = 'catalog' | 'cart' | 'success';

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' сум';
}
