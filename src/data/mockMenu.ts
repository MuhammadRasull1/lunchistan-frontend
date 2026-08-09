import type { LunchSet, WeekDay, SetCategory } from '../types';

export const SET_PRICE = 55000;

export const WORK_DAYS_COUNT = 24;

const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

const FIXED_COMPOSITION = [
  { name: 'Салат', icon: '🥗', optional: true },
  { name: 'Лепёшка', icon: '🫓', optional: true },
  { name: 'Напиток', icon: '🧃', optional: true },
] as const;

interface MainDish {
  name: string;
  icon: string;
  category: SetCategory;
}

/**
 * Категории сетов:
 * - meat    — «Мясо» (говядина/баранина, красное мясо)
 * - chicken — «Курица» (блюда из курицы)
 * - poultry — «Птица» (блюда из птицы: индейка)
 * - fish    — «Рыба» (блюда из рыбы)
 */
const MAIN_DISHES: MainDish[] = [
  { name: 'Гушт сай с лепёшкой', icon: '🥩', category: 'meat' },
  { name: 'Курица с грибами и рисом', icon: '🍗', category: 'chicken' },
  { name: 'Куриный стейк в кисло-сладком соусе, гречка', icon: '🍗', category: 'chicken' },
  { name: 'Гуляш с картофельным пюре', icon: '🥘', category: 'meat' },
  { name: 'Котлеты по-киевски, картофель фри', icon: '🍟', category: 'chicken' },
  { name: 'Рыба запечённая с рисом', icon: '🐟', category: 'fish' },
  { name: 'Плов свадебный', icon: '🍚', category: 'meat' },
  { name: 'Бефстроганов с гречкой', icon: '🥩', category: 'meat' },
  { name: 'Парамач с фаршем', icon: '🥟', category: 'meat' },
  { name: 'Лагман с мантами', icon: '🍜', category: 'meat' },
  { name: 'Чикен терияки с рисом', icon: '🍗', category: 'chicken' },
  { name: 'Кебаб с овощами гриль', icon: '🥙', category: 'meat' },
  { name: 'Бифштекс с пюре', icon: '🥩', category: 'meat' },
  { name: 'Плов домашний', icon: '🍚', category: 'meat' },
  { name: 'Тефтели в томатном соусе, рис', icon: '🧆', category: 'meat' },
  { name: 'Куриные наггетсы, картофель фри', icon: '🍟', category: 'chicken' },
  { name: 'Говядина по-строгановски, макароны', icon: '🍝', category: 'meat' },
  { name: 'Рыбные котлеты с пюре', icon: '🐟', category: 'fish' },
  { name: 'Манты с мясом', icon: '🥟', category: 'meat' },
  { name: 'Шашлык куриный, овощи гриль', icon: '🥙', category: 'chicken' },
  { name: 'Долма, отварной картофель', icon: '🥬', category: 'meat' },
  { name: 'Азу по-татарски с картофелем', icon: '🥘', category: 'meat' },
  { name: 'Индейка запечённая с овощами', icon: '🦃', category: 'poultry' },
  { name: 'Котлеты из индейки с гречкой', icon: '🦃', category: 'poultry' },
];

/**
 * Реалистичные значения КБЖУ для каждого блюда.
 * Стандарт: общий вес комплексного сета ≈ 400 г
 * (основное блюдо ~280 г + салат ~60 г + лепёшка ~40 г + напиток ~20-50 г).
 * Сытные сеты с пловом/макаронами ≈ 650-850 ккал,
 * лёгкие сеты с птицей/рыбой/салатом ≈ 450-600 ккал.
 */
const KBJU_DATA: { calories: number; proteins: number; fats: number; carbs: number }[] = [
  { calories: 680, proteins: 38, fats: 26, carbs: 62 },
  { calories: 520, proteins: 34, fats: 14, carbs: 58 },
  { calories: 560, proteins: 36, fats: 16, carbs: 60 },
  { calories: 620, proteins: 30, fats: 22, carbs: 68 },
  { calories: 700, proteins: 26, fats: 34, carbs: 62 },
  { calories: 480, proteins: 36, fats: 12, carbs: 52 },
  { calories: 780, proteins: 26, fats: 30, carbs: 92 },
  { calories: 640, proteins: 36, fats: 22, carbs: 66 },
  { calories: 720, proteins: 30, fats: 30, carbs: 72 },
  { calories: 650, proteins: 28, fats: 20, carbs: 88 },
  { calories: 540, proteins: 34, fats: 12, carbs: 68 },
  { calories: 590, proteins: 32, fats: 24, carbs: 54 },
  { calories: 660, proteins: 36, fats: 26, carbs: 58 },
  { calories: 760, proteins: 26, fats: 28, carbs: 90 },
  { calories: 580, proteins: 30, fats: 18, carbs: 66 },
  { calories: 680, proteins: 28, fats: 32, carbs: 64 },
  { calories: 640, proteins: 34, fats: 22, carbs: 68 },
  { calories: 470, proteins: 30, fats: 16, carbs: 50 },
  { calories: 720, proteins: 32, fats: 28, carbs: 74 },
  { calories: 490, proteins: 36, fats: 16, carbs: 40 },
  { calories: 560, proteins: 26, fats: 20, carbs: 60 },
  { calories: 600, proteins: 32, fats: 22, carbs: 60 },
  { calories: 500, proteins: 38, fats: 12, carbs: 46 },
  { calories: 530, proteins: 34, fats: 16, carbs: 54 },
];

/**
 * Фото для каждого блюда.
 * Совпавшие блюда — локальные файлы в /images/dishes/<категория>/,
 * остальные — Unsplash-фото (fallback в SetCard/SetDetailModal).
 */
const UNSPLASH_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',  // 1  Гушт сай — сочный стейк
  'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80',  // 2  Курица с грибами и рисом
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',  // 3  Куриный стейк — мясо на доске
  '/images/dishes/hot-dishes/gulyash-iz-govyadiny-s-grechkoy.jpg',  // 4  Гуляш — тушёное мясо
  '/images/dishes/hot-dishes/kurinaya-kotleta-po-kievski-s-pyure.jpg',  // 5  Котлеты по-киевски
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',  // 6  Рыба — фиш/суши-стейк
  '/images/dishes/hot-dishes/plov-iz-govyadiny.jpg',  // 7  Плов свадебный
  '/images/dishes/hot-dishes/befstroganov-s-risom.jpg',  // 8  Бефстроганов
  'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=800&q=80',  // 9  Парамач — пицца/лепёшка
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',  // 10 Лагман — азиатская лапша
  '/images/dishes/hot-dishes/kuritsa-teriyaki-s-risom.jpg',  // 11 Чикен терияки
  '/images/dishes/hot-dishes/lyulya-kurinye-s-grechkoy.jpg',  // 12 Кебаб — люля-кебаб
  '/images/dishes/hot-dishes/govyazhya-kotleta-s-pyure.jpg',  // 13 Бифштекс — говяжья котлета
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',  // 14 Плов домашний — салат/овощи
  '/images/dishes/hot-dishes/mit-boly-s-pyure.jpg',  // 15 Тефтели — мит-болы
  'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',  // 16 Наггетсы — запечённое мясо
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80',  // 17 Бефстроганов с макаронами — паста
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',  // 18 Рыбные котлеты — завтрак/блинчики
  '/images/dishes/hot-dishes/manty-s-govyadinoy.jpg',  // 19 Манты
  '/images/dishes/hot-dishes/kuritsa-gril-s-ovoschami.jpg',  // 20 Шашлык куриный
  '/images/dishes/appetizers/dolma.jpg',  // 21 Долма
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',  // 22 Азу — пицца/итальянское
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',  // 23 Индейка запечённая — ростбиф с овощами
  'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',  // 24 Котлеты из индейки — мясо с гарниром
];

/**
 * 24 рабочих дня (Пн-Пт) корпоративной подписки на месяц.
 * Каждый день — уникальное основное блюдо + салат + лепёшка + напиток.
 */
export const MONTHLY_SETS: LunchSet[] = MAIN_DISHES.map((main, index) => {
  const dayNumber = index + 1;
  const weekDayIndex = index % 5;
  const kbju = KBJU_DATA[index];
  return {
    id: dayNumber,
    dayNumber,
    weekDay: WEEK_DAYS[weekDayIndex],
    category: main.category,
    name: `Обед День ${dayNumber} (${WEEK_DAYS[weekDayIndex]})`,
    description: `${main.name} + Салат + Лепёшка + Напиток`,
    price: SET_PRICE,
    imageUrl: UNSPLASH_IMAGES[index], // уникальное Unsplash-фото для каждого блюда
    calories: kbju.calories,
    proteins: kbju.proteins,
    fats: kbju.fats,
    carbs: kbju.carbs,
    composition: [
      { name: main.name, icon: main.icon, optional: false },
      ...FIXED_COMPOSITION.map(item => ({ name: item.name, icon: item.icon, optional: item.optional })),
    ],
  };
});
