import type { Dish, DishCategory, WeekDay } from '../types'

export interface DayMenu {
  day: WeekDay
  dishes: {
    name: string
    category: DishCategory
    price: number
  }[]
}

// Полное меню на каждый день недели.
export const menu: DayMenu[] = [
  {
    day: 'Пн',
    dishes: [
      { name: 'Гушт сай', category: 'Основное', price: 45000 },
      { name: 'Гарнир рис басмати', category: 'Гарнир', price: 10000 },
      { name: 'Салат капустный', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Вт',
    dishes: [
      {
        name: 'Куриный стейк в кисло-сладком соусе',
        category: 'Основное',
        price: 45000,
      },
      { name: 'Гарнир пюре', category: 'Гарнир', price: 10000 },
      { name: 'Салат Смак', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Ср',
    dishes: [
      { name: 'Котлеты по-киевски', category: 'Основное', price: 45000 },
      { name: 'Гарнир Фри', category: 'Гарнир', price: 10000 },
      { name: 'Салат Кристал', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Чт',
    dishes: [
      { name: 'Плов свадебный', category: 'Основное', price: 45000 },
      { name: 'Салат Весенний', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Пт',
    dishes: [
      { name: 'Суп Борщ', category: 'Основное', price: 45000 },
      { name: 'Парамач с фаршем', category: 'Основное', price: 15000 },
      { name: 'Салат Нежный', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Сб',
    dishes: [
      { name: 'Чикен терияки', category: 'Основное', price: 45000 },
      { name: 'Гарнир рис', category: 'Гарнир', price: 10000 },
      { name: 'Салат Оливье', category: 'Салат', price: 8000 },
    ],
  },
  {
    day: 'Вс',
    dishes: [
      { name: 'Бифштекс', category: 'Основное', price: 45000 },
      { name: 'Салат Винегрет', category: 'Салат', price: 8000 },
    ],
  },
]

// Плоский список блюд со стабильными id (нужны для корзины).
// App.tsx использует именно этот массив как фолбэк для бэкенда.
export const MOCK_MENU: Dish[] = menu.flatMap((dayMenu, dayIndex) =>
  dayMenu.dishes.map((dish, dishIndex) => ({
    id: (dayIndex + 1) * 100 + dishIndex + 1,
    name: dish.name,
    price: dish.price,
    category: dish.category,
    day: dayMenu.day,
  }))
)
