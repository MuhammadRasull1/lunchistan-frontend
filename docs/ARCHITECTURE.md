# 🏗️ Архитектура Lunchistan Frontend

> Версия: 2.3  \
> Последнее обновление: 05.08.2026  \
> Связанные файлы: [[COMPONENTS]], [[STATE_MANAGEMENT]], [[B2B_RULES]], [[CHECKOUT_FLOW]]

---

## 1. Полный стек проекта

| Компонент        | Технология                          | Версия     |
| ---------------- | ----------------------------------- | ---------- |
| **Ядро**         | React (с хуками, useState)          | ^19.2.7    |
| **Сборка**       | Vite                                | ^8.1.1     |
| **Типизация**    | TypeScript                          | ~6.0.2     |
| **Стилизация**   | Pure CSS (CSS Custom Properties) + Glassmorphism | —          |
| **Анимации**     | Framer Motion (framer-motion)       | ^12.x      |
| **Иконки**       | Lucide React (lucide-react)         | ^0.x       |
| **Линтер**       | ESLint + typescript-eslint          | ^10.6.0    |
| **Линтер (alt)** | oxlint (конфиг .oxlintrc.json)      | —          |
| **Интернационализация** | Кастомный словарь (src/locales/translations.ts) | —          |
| **HTTP**         | axios (установлен, в проекте не используется) | ^1.18.1 |
| **Бэкенд**       | Отсутствует (заглушка mockMenu.ts)  | —          |
| **Telegram Bot** | Отсутствует                         | —          |

> **Примечание:** На данный момент проект является чистым фронтендом. Данные берутся из `src/data/mockMenu.ts`. Бэкенд и Telegram Bot не реализованы. Изображения сетов — локальные JPG-файлы в `/images/sets/day-N.jpg` с fallback на [[Unsplash]] при ошибке загрузки (подробнее → [[COMPONENTS]]). Добавлена мультиязычность RU/UZ через `src/locales/translations.ts` (подробнее → [[COMPONENTS#11-мультиязычность-ruuz]]).

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
│   ├── COMPONENTS.md                 #   Детали компонентов и анимаций → [[COMPONENTS]]
│   ├── STATE_MANAGEMENT.md           #   Управление состоянием → [[STATE_MANAGEMENT]]
│   ├── B2B_RULES.md                  #   Бизнес-правила → [[B2B_RULES]]
│   └── CHECKOUT_FLOW.md              #   Процесс оформления → [[CHECKOUT_FLOW]]
│
├── src/
│   ├── main.tsx                      # Точка входа React (StrictMode + App)
│   ├── App.tsx                       # Главный компонент, состояние, маршрутизация
│   ├── App.css                       # Все стили проекта (single CSS)
│   ├── index.css                     # Пустой (резерв)
│   ├── types.ts                      # TypeScript-типы + formatPrice() + Lang
│   │
│   ├── locales/
│   │   └── translations.ts           # 🆕 Словарь RU/UZ с функцией t() и localizeIngredient()
│   │
│   ├── data/
│   │   └── mockMenu.ts               # Мок-данные: 24 обеда на месяц + категории + КБЖУ (400 г)
│   │
│   └── components/
│       ├── Catalog.tsx               # Главный экран: калькулятор + табы категорий + сетка сетов
│       ├── SetCard.tsx               # Карточка дня/сета (премиум B2B, lucide-иконки)
│       ├── SetDetailModal.tsx        # Выплывающее окно детализации сета (+ исключение ингредиентов)
│       ├── Stepper.tsx               # 🆕 Счётчик «− / input / +» с ручным вводом чисел
│       ├── Cart.tsx                  # Экран корзины/оформления заказа (glassmorphism)
│       ├── Success.tsx               # Экран успешного оформления
│       └── AnimatedCount.tsx         # Плавная анимация числовых значений
│
└── README.md                         # Описание шаблона (Vite + React + TS)
```

---

## 3. Типы данных (src/types.ts)

Подробное описание типов → [[COMPONENTS#4-setcardtsx]] и [[STATE_MANAGEMENT#2-структура-apptsx]].

Ключевые экспорты:

| Тип / Функция        | Назначение                              |
| -------------------- | --------------------------------------- |
| `Screen`             | `'catalog' | 'cart' | 'success'`       |
| `WeekDay`            | `'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт'`    |
| `Beverage`           | `'Вода' | 'Компот в ассортименте'`     |
| `PaymentMethod`      | `'corporate' | 'card' | 'cash'`        |
| `Lang`               | `'ru' | 'uz'` — языки интерфейса     |
| `SetCategory`        | `'meat' | 'chicken' | 'poultry' | 'fish'` — категория сета (табы меню) |
| `LunchSet`           | Сет с KBJU + composition + category     |
| `CartItem`           | Элемент корзины (active, portions, excludedIngredients) |
| `CartState`          | `Record<string | number, CartItem>`    |
| `formatPrice(n)`     | `"55 000 сум"`                         |

---

## 4. Маршрутизация

**Роутинг отсутствует.** Используется условный рендеринг на основе `screen`:

```tsx
{screen === 'catalog' && <Catalog ... />}
{screen === 'cart'    && <Cart ... />}
{screen === 'success' && <Success ... />}
```

Для перехода в полноценную SPA-маршрутизацию — установить `react-router-dom` и заменить условный рендеринг на `<Routes>`.

---

## 5. Начало работы

```bash
npm install        # Установка зависимостей
npm run dev        # Запуск дев-сервера (Vite HMR)
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run preview    # Превью продакшн-сборки
```

---

## 6. Известные ограничения (TODOs)

1. ❌ Нет бэкенда — данные из `mockMenu.ts`
2. ❌ Нет интеграции с Telegram Bot
3. ❌ Нет react-router — условный рендеринг
4. ❌ Нет сохранения состояния (localStorage отсутствует)
5. ❌ Нет Tailwind — pure CSS
6. ❌ Нет тестов
7. ❌ Checkout-форма минимальна (только способ оплаты, без полей ввода)
