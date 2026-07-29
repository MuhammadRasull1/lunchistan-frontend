import type { LunchSet, WeekDay } from '../types';

export const SET_PRICE = 55000;

export const WORK_DAYS_COUNT = 22;

const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

const FIXED_COMPOSITION = [
  { name: 'Салат', icon: '🥗' },
  { name: 'Лепёшка', icon: '🫓' },
  { name: 'Напиток', icon: '🧃' },
] as const;

interface MainDish {
  name: string;
  icon: string;
}

const MAIN_DISHES: MainDish[] = [
  { name: 'Гушт сай с лепёшкой', icon: '🥩' },
  { name: 'Курица с грибами и рисом', icon: '🍗' },
  { name: 'Куриный стейк в кисло-сладком соусе, гречка', icon: '🍗' },
  { name: 'Гуляш с картофельным пюре', icon: '🥘' },
  { name: 'Котлеты по-киевски, картофель фри', icon: '🍟' },
  { name: 'Рыба запечённая с рисом', icon: '🐟' },
  { name: 'Плов свадебный', icon: '🍚' },
  { name: 'Бефстроганов с гречкой', icon: '🥩' },
  { name: 'Парамач с фаршем', icon: '🥟' },
  { name: 'Лагман с мантами', icon: '🍜' },
  { name: 'Чикен терияки с рисом', icon: '🍗' },
  { name: 'Кебаб с овощами гриль', icon: '🥙' },
  { name: 'Бифштекс с пюре', icon: '🥩' },
  { name: 'Плов домашний', icon: '🍚' },
  { name: 'Тефтели в томатном соусе, рис', icon: '🧆' },
  { name: 'Куриные наггетсы, картофель фри', icon: '🍟' },
  { name: 'Говядина по-строгановски, макароны', icon: '🍝' },
  { name: 'Рыбные котлеты с пюре', icon: '🐟' },
  { name: 'Манты с мясом', icon: '🥟' },
  { name: 'Шашлык куриный, овощи гриль', icon: '🥙' },
  { name: 'Долма, отварной картофель', icon: '🥬' },
  { name: 'Азу по-татарски с картофелем', icon: '🥘' },
];

/** Примерные значения КБАУ для каждого блюда (на 1 порцию ~350-400 г) */
const KBJU_DATA: { calories: number; proteins: number; fats: number; carbs: number }[] = [
  { calories: 520, proteins: 28, fats: 18, carbs: 58 },
  { calories: 480, proteins: 32, fats: 14, carbs: 52 },
  { calories: 510, proteins: 30, fats: 16, carbs: 54 },
  { calories: 540, proteins: 26, fats: 20, carbs: 56 },
  { calories: 590, proteins: 24, fats: 28, carbs: 48 },
  { calories: 440, proteins: 34, fats: 10, carbs: 50 },
  { calories: 610, proteins: 22, fats: 22, carbs: 68 },
  { calories: 500, proteins: 30, fats: 16, carbs: 52 },
  { calories: 560, proteins: 26, fats: 24, carbs: 50 },
  { calories: 470, proteins: 24, fats: 14, carbs: 60 },
  { calories: 490, proteins: 32, fats: 12, carbs: 56 },
  { calories: 530, proteins: 28, fats: 20, carbs: 46 },
  { calories: 550, proteins: 30, fats: 22, carbs: 48 },
  { calories: 600, proteins: 22, fats: 20, carbs: 66 },
  { calories: 460, proteins: 26, fats: 16, carbs: 54 },
  { calories: 580, proteins: 28, fats: 26, carbs: 50 },
  { calories: 510, proteins: 30, fats: 18, carbs: 52 },
  { calories: 430, proteins: 32, fats: 12, carbs: 48 },
  { calories: 540, proteins: 28, fats: 20, carbs: 52 },
  { calories: 470, proteins: 34, fats: 14, carbs: 44 },
  { calories: 490, proteins: 24, fats: 18, carbs: 50 },
  { calories: 520, proteins: 28, fats: 18, carbs: 56 },
];

/**
 * 22 рабочих дня (Пн-Пт) корпоративной подписки на месяц.
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
    name: `Обед День ${dayNumber} (${WEEK_DAYS[weekDayIndex]})`,
    description: `${main.name} + Салат + Лепёшка + Напиток`,
    price: SET_PRICE,
    imageUrl: `/images/sets/day-${dayNumber}.jpg`, // сгенерировано AI или JPG
    calories: kbju.calories,
    proteins: kbju.proteins,
    fats: kbju.fats,
    carbs: kbju.carbs,
    composition: [
      { name: main.name, icon: main.icon },
      ...FIXED_COMPOSITION.map(item => ({ name: item.name, icon: item.icon })),
    ],
  };
});
