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

/** 24 уникальных Unsplash-фото, подобранных под каждое блюдо */
const UNSPLASH_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',  // 1  Гушт сай — сочный стейк
  'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80',  // 2  Курица с грибами и рисом
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',  // 3  Куриный стейк — мясо на доске
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',  // 4  Гуляш — тушёное мясо в миске
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80',  // 5  Котлеты — еда на тёмной тарелке
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',  // 6  Рыба — фиш/суши-стейк
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=80',  // 7  Плов свадебный — рисовое блюдо
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80',  // 8  Бефстроганов — мясо в тёмном соусе
  'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=800&q=80',  // 9  Парамач — пицца/лепёшка
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',  // 10 Лагман — азиатская лапша
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&q=80',  // 11 Чикен терияки — рис с овощами
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',  // 12 Кебаб — мясо на шампуре
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',  // 13 Бифштекс — мясо с гарниром
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',  // 14 Плов домашний — салат/овощи
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',  // 15 Тефтели — суп/рагу
  'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',  // 16 Наггетсы — запечённое мясо
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80',  // 17 Бефстроганов с макаронами — паста
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',  // 18 Рыбные котлеты — завтрак/блинчики
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',  // 19 Манты — азиатские пельмени/суши
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',  // 20 Шашлык — здоровое блюдо
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',  // 21 Долма — пицца/закуска
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
