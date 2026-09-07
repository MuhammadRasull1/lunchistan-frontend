export type WeekDay = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт';

export type Beverage = 'Вода' | 'Компот в ассортименте';

export type Salad = string;

export type PaymentMethod = 'corporate' | 'card' | 'cash';

export type SetCategory = 'hot' | 'salad' | 'side' | 'fastfood' | 'appetizer' | 'soup';

export interface CompositionItem {
  name: string
  icon: string
  /** true — второстепенный компонент сета (не основное блюдо); false/undefined — основное блюдо (неизменяемое) */
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
  /** Выбранный салат для этого дня */
  salad: Salad;
  /**
   * Выбранное клиентом блюдо (id сета из MONTHLY_SETS) — «токен» дня.
   * null — блюдо ещё не выбрано; оформить заказ в этом случае нельзя.
   */
  setId: number | null;
}

export type CartState = Record<string | number, CartItem>;

/** Пресет графика рабочих дней. Паттерн строится от даты начала подписки (1-е число видимого месяца). */
export type PresetPattern = '2/2' | '5/2' | '6/1' | 'full';

/** День подписки: конкретная дата + выбранное блюдо + настройки дня */
export interface SelectedDay {
  /** Дата в формате YYYY-MM-DD */
  date: string;
  /**
   * Сет меню для этой даты. Если клиент выбрал блюдо (item.setId) — это оно;
   * иначе сет по ротации (getSetForDate) как визуальный плейсхолдер.
   */
  set: LunchSet;
  /** Клиент выбрал блюдо на этот день (item.setId !== null) */
  chosen: boolean;
  /** Настройки дня (напиток, салат, порции) */
  item: CartItem;
}

export type Lang = 'ru' | 'uz';

/** Поле настройки дня, которое можно применить к остальным дням */
export type ApplyField = 'salad' | 'beverage';

export type Screen = 'catalog' | 'cart' | 'success';

export const EMPLOYEE_MAX = 500;

export function formatPrice(price: number, lang: Lang = 'ru'): string {
  const suffix = lang === 'uz' ? "so'm" : 'сум';
  return price.toLocaleString('ru-RU') + ' ' + suffix;
}
