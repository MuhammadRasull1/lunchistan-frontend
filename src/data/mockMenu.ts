import type { MealSet, WeekDay } from '../types'

export interface DaySets {
  day: WeekDay
  sets: {
    id: number
    name: string
    description: string
    price: number
  }[]
}

const SET_PRICE = 55000

// Сет-меню на каждый день недели: 2 сета по фиксированной цене.
export const menu: DaySets[] = [
  {
    day: 'Пн',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Гушт сай, Салат капустный, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Курица с грибами, Салат Цезарь, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Вт',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description:
          'Куриный стейк в кисло-сладком соусе, Салат Смак, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Гуляш с пюре, Салат овощной, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Ср',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Котлеты по-киевски, Картофель Фри, Салат Кристал, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Рыба запечённая, Рис, Салат витаминный, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Чт',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Плов свадебный, Салат Весенний, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Бефстроганов, Гречка, Салат греческий, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Пт',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Суп Борщ, Парамач с фаршем, Салат Нежный, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Лагман, Манты, Салат ачичук, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Сб',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Чикен терияки, Рис, Салат Оливье, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Кебаб, Овощи гриль, Салат ачичук, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
  {
    day: 'Вс',
    sets: [
      {
        id: 1,
        name: 'Сет 1',
        description: 'Бифштекс, Пюре, Салат Винегрет, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
      {
        id: 2,
        name: 'Сет 2',
        description: 'Плов, Салат ачичук, Лепёшка, Напиток (Чай/Кола)',
        price: SET_PRICE,
      },
    ],
  },
]

// Плоский список сетов со стабильными глобально-уникальными id (нужны для корзины).
// App.tsx использует именно этот массив как источник данных.
export const MOCK_SETS: MealSet[] = menu.flatMap((daySets, dayIndex) =>
  daySets.sets.map((set) => ({
    id: (dayIndex + 1) * 10 + set.id,
    name: set.name,
    description: set.description,
    price: set.price,
    day: daySets.day,
  }))
)
