export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт';

export type Beverage = 'Вода' | 'Компот в ассортименте';

export type PaymentMethod = 'corporate' | 'card' | 'cash';

export type SetCategory = 'meat' | 'chicken' | 'poultry';

export interface CompositionItem {
  name: string
  icon: string
  /** true — второстепенный ингредиент, который можно исключить; false/undefined — основное блюдо (заблокировано) */
  optional?: boolean
}

export interface LunchSet {
  id: string | number;
  dayNumber: number;
  weekDay: WeekDay;
  category: SetCategory;
  name: string;
  description: string;
  price: number;
  /** Изображение блюда (URL или эмодзи-плейсхолдер) */
  imageUrl?: string;
  /** Калорийность, ккал */
  calories?: number;
  /** Белки, г */
  proteins?: number;
  /** Жиры, г */
  fats?: number;
  /** Углеводы, г */
  carbs?: number;
  /** Разобранный состав обеда для премиум-отображения */
  composition: CompositionItem[];
}

export interface CartItem {
  /** День включён в подписку (true) или пропущен (false) */
  active: boolean;
  /** Количество порций на одного сотрудника для этого дня */
  portions: number;
  /** Выбранный напиток для этого дня */
  beverage: Beverage;
  /** Исключённые второстепенные ингредиенты (Салат, Лепёшка, Напиток) */
  excludedIngredients: string[];
}

export type CartState = Record<string | number, CartItem>;

export type Lang = 'ru' | 'uz';

export type Screen = 'catalog' | 'cart' | 'success';

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' сум';
}
