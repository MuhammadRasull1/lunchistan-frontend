import type { LunchSet, WeekDay, SetCategory } from '../types';

export const SET_PRICE = 55000;

export const WORK_DAYS_COUNT = 56;

const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

/**
 * Категории меню (соответствуют папкам public/images/dishes/):
 * - hot       — «Горячие блюда»
 * - salad     — «Салаты»
 * - side      — «Гарниры»
 * - fastfood  — «Фастфуд»
 * - appetizer — «Закуски»
 * - soup      — «Супы»
 */
type MenuCategory = SetCategory;

interface Dish {
  name: string;
  icon: string;
  category: MenuCategory;
  imageUrl: string;
}

/** Стандартный состав обеда для полноценных блюд */
const FULL_COMPOSITION = [
  { name: 'Салат', icon: '🥗', optional: true },
  { name: 'Лепёшка', icon: '🫓', optional: true },
  { name: 'Напиток', icon: '🧃', optional: true },
] as const;

/** Облегчённый состав (салаты, гарниры, закуски, супы) */
const LIGHT_COMPOSITION = [
  { name: 'Напиток', icon: '🧃', optional: true },
] as const;

const DISHES: Dish[] = [
  // ── Горячие блюда ──────────────────────────────────────────────
  { name: 'Аджахури с курицей', icon: '🍲', category: 'hot', imageUrl: '/images/dishes/hot-dishes/adzhahuri-s-kuritsey.jpg' },
  { name: 'Бефстроганов с рисом', icon: '🥩', category: 'hot', imageUrl: '/images/dishes/hot-dishes/befstroganov-s-risom.jpg' },
  { name: 'Биточки из курицы с рисом и овощами', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/bitochki-iz-kuritsy-s-risom-i-ovoschami.jpg' },
  { name: 'Деревенский с мясом и грибами', icon: '🥘', category: 'hot', imageUrl: '/images/dishes/hot-dishes/derevenskiy-s-myasom-i-gribami.jpg' },
  { name: 'Драники картофельные с соусом тар-тар', icon: '🥔', category: 'hot', imageUrl: '/images/dishes/hot-dishes/draniki-kartofelnye-s-sousom-tar-tar.jpg' },
  { name: 'Голубцы', icon: '🥬', category: 'hot', imageUrl: '/images/dishes/hot-dishes/golubtsy-kapusta.jpg' },
  { name: 'Говяжья котлета с пюре', icon: '🥩', category: 'hot', imageUrl: '/images/dishes/hot-dishes/govyazhya-kotleta-s-pyure.jpg' },
  { name: 'Гречка по-домашнему с курицей', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/grechka-po-domashnemu-s-kuritsey.jpg' },
  { name: 'Гуль ханум с соусом', icon: '🥟', category: 'hot', imageUrl: '/images/dishes/hot-dishes/gul-hanum-s-sousom.jpg' },
  { name: 'Гуляш из говядины с гречкой', icon: '🥘', category: 'hot', imageUrl: '/images/dishes/hot-dishes/gulyash-iz-govyadiny-s-grechkoy.jpg' },
  { name: 'Куриная грудка с овощами на пару', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-grudka-s-ovoschami-na-parujpg.jpg' },
  { name: 'Куриная грудка с сыром и булгуром с овощами', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-grudka-s-syrom-i-bulgur-s-ovoschami.jpg' },
  { name: 'Куриная котлета на пару с пюре', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-kotleta-na-paru-s-pyure.jpg' },
  { name: 'Куриная котлета по-киевски', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-kotleta-po-kievski.jpg' },
  { name: 'Котлета по-киевски с пюре', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-kotleta-po-kievski-s-pyure.jpg' },
  { name: 'Куриная котлета с пюре', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kurinaya-kotleta-s-pyure.jpg' },
  { name: 'Курица гриль с овощами', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-gril-s-ovoschami.jpg' },
  { name: 'Курица карри с рисом', icon: '🍛', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-karri-s-risom.jpg' },
  { name: 'Курица по-азиатски с рисом', icon: '🍛', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-po-aziatski-s-risom.jpg' },
  { name: 'Курица по-мексикански', icon: '🌮', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-po-meksikanski.jpg' },
  { name: 'Курица с овощами и соусом айоли', icon: '🍗', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-s-ovoschami-ayola.jpg' },
  { name: 'Курица терияки с рисом', icon: '🍛', category: 'hot', imageUrl: '/images/dishes/hot-dishes/kuritsa-teriyaki-s-risom.jpg' },
  { name: 'Люля-кебаб куриный с гречкой', icon: '🥙', category: 'hot', imageUrl: '/images/dishes/hot-dishes/lyulya-kurinye-s-grechkoy.jpg' },
  { name: 'Макароны по-флотски', icon: '🍝', category: 'hot', imageUrl: '/images/dishes/hot-dishes/makarony-po-flotski.jpg' },
  { name: 'Манты с говядиной', icon: '🥟', category: 'hot', imageUrl: '/images/dishes/hot-dishes/manty-s-govyadinoy.jpg' },
  { name: 'Митболы с пюре', icon: '🧆', category: 'hot', imageUrl: '/images/dishes/hot-dishes/mit-boly-s-pyure.jpg' },
  { name: 'Мясо по-французски', icon: '🥩', category: 'hot', imageUrl: '/images/dishes/hot-dishes/myaso-po-frantsuzski.jpg' },
  { name: 'Плов из говядины', icon: '🍚', category: 'hot', imageUrl: '/images/dishes/hot-dishes/plov-iz-govyadiny.jpg' },
  { name: 'Жареные пельмени', icon: '🥟', category: 'hot', imageUrl: '/images/dishes/hot-dishes/zharenye-pelmeni.jpg' },
  { name: 'Жареный рис по-азиатски', icon: '🍚', category: 'hot', imageUrl: '/images/dishes/hot-dishes/zharenyy-ris-po-aziatski.jpg' },
  { name: 'Жареный рис с овощами', icon: '🥘', category: 'hot', imageUrl: '/images/dishes/hot-dishes/zharenyy-ris-s-ovoschami.jpg' },

  // ── Салаты ─────────────────────────────────────────────────────
  { name: 'Баклажаны по-корейски', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/baklazhany-po-koreyski.jpg' },
  { name: 'Греческий салат', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/grecheskiy.jpg' },
  { name: 'Морковча', icon: '🥕', category: 'salad', imageUrl: '/images/dishes/salads/morkovcha.jpg' },
  { name: 'Огурцы по-корейски', icon: '🥒', category: 'salad', imageUrl: '/images/dishes/salads/ogurtsy-po-koreyski.jpg' },
  { name: 'Оливье с колбасой', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/olive-s-kolbasoy.jpg' },
  { name: 'Оливье с мясом', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/olive-s-myasom.jpg' },
  { name: 'Весенний салат', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/vesenniy.jpg' },
  { name: 'Винегрет', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/vinegret.jpg' },
  { name: 'Винегрет с капустой', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/vinegret-s-kapustoy.jpg' },
  { name: 'Витаминка', icon: '🥗', category: 'salad', imageUrl: '/images/dishes/salads/vitaminka.jpg' },
  { name: 'Зелёный салат', icon: '🥬', category: 'salad', imageUrl: '/images/dishes/salads/zelenyy-salat.jpg' },

  // ── Гарниры ────────────────────────────────────────────────────
  { name: 'Гречка отварная', icon: '🍚', category: 'side', imageUrl: '/images/dishes/sides/grechka-otvarnaya.jpg' },
  { name: 'Гречка с капустой', icon: '🥦', category: 'side', imageUrl: '/images/dishes/sides/grechka-s-kapustoy.jpg' },
  { name: 'Картофельное пюре', icon: '🥔', category: 'side', imageUrl: '/images/dishes/sides/kartofelnoe-pyure.jpg' },
  { name: 'Картофельные дольки с сыром', icon: '🍟', category: 'side', imageUrl: '/images/dishes/sides/kartofelnye-dolki-s-syromjpg.jpg' },
  { name: 'Картофель с грибами', icon: '🥔', category: 'side', imageUrl: '/images/dishes/sides/kartofel-s-gribami.jpg' },
  { name: 'Каша овсяная', icon: '🥣', category: 'side', imageUrl: '/images/dishes/sides/kasha-ovsyanaya-1.jpg' },
  { name: 'Каша рисовая', icon: '🍚', category: 'side', imageUrl: '/images/dishes/sides/kasha-risovaya.jpg' },
  { name: 'Каша рисовая на кокосовом молоке', icon: '🥥', category: 'side', imageUrl: '/images/dishes/sides/kasha-risovaya-na-kokosovom-moloke.jpg' },

  // ── Фастфуд ────────────────────────────────────────────────────
  { name: 'Бургер маззали', icon: '🍔', category: 'fastfood', imageUrl: '/images/dishes/fastfood/burger-mazzali.jpg' },
  { name: 'Клаб-сэндвич с курицей', icon: '🥪', category: 'fastfood', imageUrl: '/images/dishes/fastfood/klab-sendvis-s-kuritsey.jpg' },
  { name: 'Клаб-сэндвич с индейкой', icon: '🥪', category: 'fastfood', imageUrl: '/images/dishes/fastfood/klab-sendvich-s-indeykoy.jpg' },

  // ── Закуски ────────────────────────────────────────────────────
  { name: 'Домашняя баклажанная икра', icon: '🍆', category: 'appetizer', imageUrl: '/images/dishes/appetizers/domashnyaya-baklazhannaya-ikra-3.jpg' },
  { name: 'Долма', icon: '🍃', category: 'appetizer', imageUrl: '/images/dishes/appetizers/dolma.jpg' },

  // ── Супы ───────────────────────────────────────────────────────
  { name: 'Куриный бульон с лапшой', icon: '🍜', category: 'soup', imageUrl: '/images/dishes/soups/kurinyy-bulon-s-lapshoy.jpg' },
];

/**
 * КБЖУ по категории с небольшой детерминированной вариацией
 * (чтобы каждое блюдо отличалось в числовых значениях).
 */
const KBJU_BY_CATEGORY: Record<MenuCategory, { calories: number; proteins: number; fats: number; carbs: number }> = {
  hot: { calories: 620, proteins: 30, fats: 22, carbs: 60 },
  salad: { calories: 220, proteins: 8, fats: 12, carbs: 20 },
  side: { calories: 320, proteins: 8, fats: 10, carbs: 50 },
  fastfood: { calories: 540, proteins: 24, fats: 26, carbs: 50 },
  appetizer: { calories: 260, proteins: 12, fats: 16, carbs: 20 },
  soup: { calories: 240, proteins: 12, fats: 10, carbs: 25 },
};

function kbjuFor(index: number, category: MenuCategory) {
  const base = KBJU_BY_CATEGORY[category];
  return {
    calories: base.calories + (index % 5) * 12,
    proteins: base.proteins + (index % 4),
    fats: base.fats + (index % 3),
    carbs: base.carbs + (index % 4) * 3,
  };
}

function compositionFor(dish: Dish) {
  const main = { name: dish.name, icon: dish.icon, optional: false };
  const extras = dish.category === 'hot' || dish.category === 'fastfood' || dish.category === 'soup'
    ? FULL_COMPOSITION
    : LIGHT_COMPOSITION;
  return [main, ...extras.map(item => ({ name: item.name, icon: item.icon, optional: item.optional }))];
}

/**
 * Меню: 56 реальных блюд с локальными фото из public/images/dishes/.
 * Каждый день — одно блюдо + стандартный состав обеда.
 */
export const MONTHLY_SETS: LunchSet[] = DISHES.map((dish, index) => {
  const dayNumber = index + 1;
  const weekDayIndex = index % 5;
  const kbju = kbjuFor(index, dish.category);
  const composition = compositionFor(dish);
  return {
    id: dayNumber,
    dayNumber,
    weekDay: WEEK_DAYS[weekDayIndex],
    category: dish.category,
    name: dish.name,
    description: composition.map(c => c.name).join(' + '),
    price: SET_PRICE,
    imageUrl: dish.imageUrl,
    calories: kbju.calories,
    proteins: kbju.proteins,
    fats: kbju.fats,
    carbs: kbju.carbs,
    composition,
  };
});

/**
 * Глобальная «порядковая» привязка дата → сет меню в пределах видимого окна
 * календаря (текущий + следующий месяц). Даёт возможность заказать все 56 сетов:
 * ordinal = количество дней с 1-го числа текущего месяца до даты + 1
 * (даты следующего месяца продолжают счёт), затем модуль по числу сетов.
 * Детерминировано: выбор/снятие других дат не меняет сет для данной даты.
 */
export function getSetForDate(date: string): LunchSet {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const ordinal = Math.floor((target.getTime() - monthStart.getTime()) / 86400000) + 1
  const idx = ((ordinal - 1) % MONTHLY_SETS.length + MONTHLY_SETS.length) % MONTHLY_SETS.length
  return MONTHLY_SETS[idx]
}
