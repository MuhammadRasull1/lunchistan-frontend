import type { Dish } from '../types'

// Тестовые данные, чтобы верстать и тестировать UI, пока бэкенд не готов.
export const MOCK_MENU: Dish[] = [
  {
    id: 101,
    name: 'Фирменный Плов Lunchistan',
    description: 'Праздничный плов с нежным мясом и ароматными специями.',
    price: 45000,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000',
    day: 'Пн',
  },
  {
    id: 102,
    name: 'Макароны по-флотски',
    description: 'Классические макароны с сочным мясным фаршем.',
    price: 32000,
    imageUrl:
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1000',
    day: 'Пн',
  },
  {
    id: 103,
    name: 'Курица с грибами',
    description: 'Нежное куриное филе в сливочном соусе с шампиньонами.',
    price: 38000,
    imageUrl:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000',
    day: 'Вт',
  },
  {
    id: 104,
    name: 'Борщ украинский',
    description: 'Наваристый борщ со сметаной и свежей зеленью.',
    price: 28000,
    imageUrl:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000',
    day: 'Вт',
  },
  {
    id: 105,
    name: 'Стейк из говядины',
    description: 'Сочный стейк средней прожарки с овощами гриль.',
    price: 62000,
    imageUrl:
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=1000',
    day: 'Ср',
  },
  {
    id: 106,
    name: 'Паста Карбонара',
    description: 'Спагетти с беконом в сливочно-сырном соусе.',
    price: 36000,
    imageUrl:
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000',
    day: 'Ср',
  },
  {
    id: 107,
    name: 'Рыба на пару с рисом',
    description: 'Лёгкое диетическое блюдо из белой рыбы и риса.',
    price: 41000,
    imageUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1000',
    day: 'Чт',
  },
  {
    id: 108,
    name: 'Салат Цезарь с курицей',
    description: 'Свежий салат с курицей, пармезаном и хрустящими гренками.',
    price: 34000,
    imageUrl:
      'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1000',
    day: 'Чт',
  },
  {
    id: 109,
    name: 'Пицца Маргарита',
    description: 'Тонкое тесто, томаты, моцарелла и свежий базилик.',
    price: 39000,
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000',
    day: 'Пт',
  },
  {
    id: 110,
    name: 'Шашлык из баранины',
    description: 'Ароматный шашлык с маринованным луком и лавашом.',
    price: 55000,
    imageUrl:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=1000',
    day: 'Пт',
  },
]
