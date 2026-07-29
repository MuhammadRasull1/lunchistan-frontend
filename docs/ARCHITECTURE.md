# 🏗️ Архитектура Lunchistan Frontend

> Версия: 1.0  
> Последнее обновление: 29.07.2026

---

## 1. Полный стек проекта

| Компонент        | Технология                          | Версия     |
| ---------------- | ----------------------------------- | ---------- |
| **Ядро**         | React (с хуками, useState)          | ^19.2.7    |
| **Сборка**       | Vite                                | ^8.1.1     |
| **Типизация**    | TypeScript                          | ~6.0.2     |
| **Стилизация**   | Pure CSS (CSS Custom Properties) + Glassmorphism | —          |
| **Анимации**     | Framer Motion (framer-motion)       | ^12.x      |
| **Линтер**       | ESLint + typescript-eslint          | ^10.6.0    |
| **Линтер (alt)** | oxlint (конфиг .oxlintrc.json)      | —          |
| **HTTP**         | axios (установлен, в проекте не используется) | ^1.18.1 |
| **Бэкенд**       | Отсутствует (заглушка mockMenu.ts)  | —          |
| **Telegram Bot** | Отсутствует                         | —          |

> **Примечание:** На данный момент проект является чистым фронтендом. Данные берутся из `src/data/mockMenu.ts`. Бэкенд и Telegram Bot не реализованы.

---

## 2. Структура проекта

```
lunchistan-frontend/
├── index.html                        # Точка входа HTML
├── vite.config.ts                    # Конфигурация Vite + React plugin
├── tsconfig.json                     # Корневой tsconfig (ссылки на подпроекты)
├── tsconfig.app.json                 # Конфиг TS для src/ (браузер)
├── tsconfig.node.json                # Конфиг TS для vite.config.ts (Node)
├── eslint.config.js                  # ESLint flat config
├── .oxlintrc.json                    # oxlint config
├── package.json                      # Зависимости и скрипты
│
├── docs/                             # 📁 Хранилище Obsidian-контекста
│   ├── ARCHITECTURE.md               #   Данный файл
│   └── B2B_RULES.md                  #   Бизнес-правила B2B
│
├── src/
│   ├── main.tsx                      # Точка входа React (StrictMode + App)
│   ├── App.tsx                       # Главный компонент, состояние, маршрутизация
│   ├── App.css                       # Все стили проекта (single CSS)
│   ├── index.css                     # Пустой (резерв)
│   ├── types.ts                      # TypeScript-типы + formatPrice()
│   │
│   ├── data/
│   │   └── mockMenu.ts               # Мок-данные: 22 обеда на месяц
│   ││       └── components/
│           ├── Catalog.tsx               # Главный экран: калькулятор + сетка сетов
│           ├── SetCard.tsx               # Карточка одного дня/сета
│           ├── Cart.tsx                  # Экран корзины/оформления заказа (glassmorphism)
│           ├── Success.tsx               # Экран успешного оформления
│           └── AnimatedCount.tsx          # Компонент плавной анимации числовых значений
│
└── README.md                         # Описание шаблона (Vite + React + TS)
```

---

## 3. Структура компонентов и их связи

### 3.1. App.tsx — Корневой компонент (State Owner)

```
App
├── screen: Screen                  # 'catalog' | 'cart' | 'success'
├── employeeCount: number           # Количество сотрудников (множитель)
├── workDaysCount: number           # Рабочих дней в подписке
├── cartState: CartState            # Словарь { id => CartItem }
│
├── Screen === 'catalog'
│   └── <Catalog />
│       ├── Блок «Калькулятор стоимости»
│       │   ├── Счётчик рабочих дней
│       │   ├── Счётчик сотрудников
│       │   ├── Кнопки «Выбрать все» / «Сбросить все»
│       │   └── Детализация расчёта
│       ├── Сетка <SetCard /> × workDaysCount
│       └── StickyBar (итоговая цена + кнопка «Оформить»)
│
├── Screen === 'cart'
│   └── <Cart />
│       ├── Список выбранных сетов
│       ├── Выбор способа оплаты
│       ├── Итоговая сумма
│       └── Кнопка «Оплатить»
│
└── Screen === 'success'
    └── <Success />
        ├── Анимация галочки (SVG)
        ├── Номер заказа
        └── Кнопка «Новый заказ»
```

### 3.2. Props-поток (строго сверху вниз)

Все состояние находится в **`App.tsx`**. Дочерние компоненты ничего не хранят, только получают `props` и вызывают колбэки.

```
App (state owner)
  │
  ├──→ Catalog
  │     ├──→ SetCard (×N)
  │     │     onBeverageChange → App.handleBeverageChange
  │     │     onToggle        → App.handleToggleDay
  │     │     onPortionChange → App.handlePortionChange
  │     │
  │     onSelectAll           → App.handleSelectAll
  │     onDeselectAll         → App.handleDeselectAll
  │     onEmployeeCountChange → App.handleEmployeeCountChange
  │     onWorkDaysChange      → App.handleWorkDaysChange
  │     onGoToCart            → setScreen('cart')
  │
  ├──→ Cart
  │     onBack                → setScreen('catalog')
  │     onPlaceOrder(method)  → App.handlePlaceOrder
  │
  └──→ Success
        onNewOrder            → App.handleNewOrder (сброс + catalog)
```

---

## 4. Типы данных (src/types.ts)

```typescript
type WeekDay       = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт';
type Beverage      = 'Вода' | 'Компот в ассортименте';
type PaymentMethod = 'corporate' | 'card' | 'cash';
type Screen        = 'catalog' | 'cart' | 'success';

interface LunchSet {
  id: string | number;
  dayNumber: number;
  weekDay: WeekDay;
  name: string;
  description: string;
  price: number;        // Фиксировано: 55 000 сум
}

interface CartItem {
  beverage: Beverage;
  active: boolean;      // День включён в подписку?
  portions: number;     // Порций на одного сотрудника
}

type CartState = Record<string | number, CartItem>;

function formatPrice(price: number): string;  // "55 000 сум"
```

---

## 5. Управление состоянием (Cart State)

### 5.1. Структура состояния

```typescript
// Пример cartState для 22 дней:
{
  "1": { beverage: "Вода", active: true,  portions: 2 },
  "2": { beverage: "Компот в ассортименте", active: true,  portions: 1 },
  "3": { beverage: "Вода", active: false, portions: 0 },
  // ... остальные дни
}
```

### 5.2. Ключевые переменные в App.tsx

| Переменная           | Тип        | Начальное значение | Описание                              |
| -------------------- | ---------- | ------------------ | ------------------------------------- |
| `screen`             | `Screen`   | `'catalog'`        | Текущий экран                         |
| `employeeCount`      | `number`   | `1`                | Множитель стоимости (сотрудники)      |
| `workDaysCount`      | `number`   | `22`               | Отображаемое количество рабочих дней  |
| `cartState`          | `CartState` | Все дни active:true, portions:1, beverage:'Вода' | Состояние корзины |

### 5.3. Вычисляемые значения (derived state)

```typescript
activeDays            = cartState.filter(item => item.active).length
totalPortionsFromActive = cartState.active.reduce(sum portions)
totalItems            = totalPortionsFromActive * employeeCount
totalMonthlyPrice     = totalPortionsFromActive * employeeCount * SET_PRICE
visibleSets           = MONTHLY_SETS.slice(0, workDaysCount)
```

### 5.4. Обработчики событий

| Функция                         | Действие                                           |
| ------------------------------- | -------------------------------------------------- |
| `handleWorkDaysChange(delta)`   | Изменить количество отображаемых дней (1..22)      |
| `handleBeverageChange(id, bev)` | Сменить напиток для дня                             |
| `handleToggleDay(id)`           | Включить/выключить день                             |
| `handlePortionChange(id, delta)`| Увеличить/уменьшить порции для дня (мин. 1)        |
| `handleSelectAll()`             | Включить все дни                                    |
| `handleDeselectAll()`           | Выключить все дни                                   |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (мин. 1)          |
| `handlePlaceOrder(method)`      | Оформить заказ → success                            |
| `handleNewOrder()`              | Сбросить всё → catalog                              |

---

## 6. Стилизация и анимации

### 6.1. CSS-стилизация

- **Single CSS-файл:** `src/App.css` (≈850 строк).
- **CSS Custom Properties:** переменные в `:root` для брендового цвета, теней, радиусов.
- **БЭМ-подобная нотация:** `.set-card__head`, `.set-card__toggle-track`, `.pill--active`.
- **Glassmorphism:** `.cart--glass` использует `backdrop-filter: blur(12px)` + полупрозрачный фон с декоративными градиентными орбами через `::before`/`::after`.

### 6.2. Framer Motion анимации

Библиотека **framer-motion** добавлена для трёх типов анимаций:

#### 6.2.1. Scroll-анимация карточек (SetCard.tsx)
- Каждая карточка обеда появляется при скролле с эффектом fade-in + slide-up
- `whileInView` с `viewport: { once: true }` — анимация срабатывает один раз
- Stagger по формуле `delay: (index % 6) * 0.08` — волна появления
- Cubic bezier `[0.25, 0.46, 0.45, 0.94]` для плавности

#### 6.2.2. Entrance-анимация корзины (Cart.tsx)
- Вся карточка корзины появляется с fade-in + slide-up
- Список сетов использует `staggerChildren: 0.05` для последовательного появления
- Кнопки имеют `whileHover` и `whileTap` для тактильной обратной связи
- Все секции (заголовок, способ оплаты, итог, кнопка) появляются с нарастающей задержкой

#### 6.2.3. Анимация цифр калькулятора (AnimatedCount.tsx)
- Новый компонент для плавного изменения чисел в блоке «Калькулятор стоимости»
- Использует `useMotionValue` + `useSpring` (stiffness: 120, damping: 24) для физической анимации
- `useTransform(rounded)` форматирует число в строку для отображения
- Применён к полям: `activeDays`, `employeeCount`, `totalPortions`, `totalItems`

---

## 7. Маршрутизация

**Роутинг отсутствует.** Используется условный рендеринг на основе `screen`:

```tsx
{screen === 'catalog' && <Catalog ... />}
{screen === 'cart'    && <Cart ... />}
{screen === 'success' && <Success ... />}
```

Для перехода в полноценную SPA-маршрутизацию — установить `react-router-dom` и заменить условный рендеринг на `<Routes>`.

---

## 8. Начало работы

```bash
npm install        # Установка зависимостей
npm run dev        # Запуск дев-сервера (Vite HMR)
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run preview    # Превью продакшн-сборки
```

---

## 9. Известные ограничения (TODOs)

1. ❌ Нет бэкенда — данные из `mockMenu.ts`
2. ❌ Нет интеграции с Telegram Bot
3. ❌ Нет react-router — условный рендеринг
4. ❌ Нет сохранения состояния (localStorage отсутствует)
5. ❌ Нет Tailwind — pure CSS
6. ❌ Нет тестов
7. ❌ Checkout-форма минимальна (только способ оплаты, без полей ввода)
