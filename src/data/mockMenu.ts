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

/**
 * 22 рабочих дня (Пн-Пт) корпоративной подписки на месяц.
 * Каждый день — уникальное основное блюдо + салат + лепёшка + напиток.
 */
export const MONTHLY_SETS: LunchSet[] = MAIN_DISHES.map((main, index) => {
  const dayNumber = index + 1;
  const weekDayIndex = index % 5;
  return {
    id: dayNumber,
    dayNumber,
    weekDay: WEEK_DAYS[weekDayIndex],
    name: `Обед День ${dayNumber} (${WEEK_DAYS[weekDayIndex]})`,
    description: `${main.name} + Салат + Лепёшка + Напиток`,
    price: SET_PRICE,
    composition: [
      { name: main.name, icon: main.icon },
      ...FIXED_COMPOSITION.map(item => ({ name: item.name, icon: item.icon })),
    ],
  };
});
