# 🏗️ Архитектура Lunchistan Frontend

> Версия: 2.7  \
> Последнее обновление: 05.09.2026  \
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

> **Примечание:** На данный момент проект является чистым фронтендом. Данные берутся из `src/data/mockMenu.ts`. Бэкенд и Telegram Bot не реализованы. Изображения сетов — **локальные JPG-файлы в `public/images/dishes/<категория>/`** (транслит-папки: hot-dishes, salads, sides, fastfood, appetizers, soups, misc), импортированы скриптом `scripts/import-images.mjs` из `~/Загрузки/Telegram Desktop` со сжатием (1200px, q80). Меню состоит **исключительно из реальных фото** (56 блюд); fallback на [[Unsplash]] срабатывает только при ошибке загрузки файла (подробнее → [[COMPONENTS]]). Категории меню: `hot | salad | side | fastfood | appetizer | soup` (подробнее → [[B2B_RULES]]). Добавлена мультиязычность RU/UZ через `src/locales/translations.ts` (подробнее → [[COMPONENTS#11-мультиязычность-ruuz]]).

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
├── public/
│   └── images/
│       ├── sets/                          # SVG-плейсхолдеры (day-N.svg, устарело)
│       └── dishes/                        # 🆕 Реальные фото блюд по категориям
│           ├── hot-dishes/                #   Горячие блюда (31)
│           ├── salads/                    #   Салаты (11)
│           ├── soups/                     #   Супы (1)
│           ├── appetizers/                #   Закуски (2)
│           ├── sides/                     #   Каши и гарниры (8)
│           ├── fastfood/                  #   Фастфуд (3)
│           └── misc/                      #   Разное (4)
│
├── scripts/
│   └── import-images.mjs                  # 🆕 Импорт+сжатие фото из Загрузок (sharp)
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
│   │   └── mockMenu.ts               # Мок-данные: 56 реальных блюд + категории + КБЖУ
│   │
│   ├── lib/                           # 🆕 Утилиты
│   │   ├── api.ts                     # Отправка заказа на backend (payload с days[])
│   │   ├── calendar.ts                # 🆆 Даты, сетка месяца, недели, пресеты + привязка дата→сет (глобальный порядок, модуль 56) + canSelectDate (запрет прошлых дат и «сегодня» после 10:00)
│   │   ├── orderStorage.ts            # Сохранение конфигурации (v2, ключи — даты)
│   │   └── telegram.ts                # Telegram WebApp, вибрация, алерты
│   │
│   └── components/
│       ├── Catalog.tsx               # Главный экран: сводка выбора дат + калькулятор + табы + полное меню
│       ├── CalendarModal.tsx         # 🆆 Модалка выбора дат (черновик → подтверждение), пресеты + «Вся рабочая неделя»
│       ├── SetCard.tsx               # Карточка дня/сета (премиум B2B, lucide-иконки)
│       ├── SetDetailModal.tsx        # Выплывающее окно детализации сета (+ исключение ингредиентов)
│       ├── Stepper.tsx               # Счётчик «− / input / +» (сотрудники)
│       ├── Cart.tsx                  # Экран корзины/оформления заказа (строки по датам)
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
| `PresetPattern`      | 🆆 `'2/2' | '5/2' | '6/1' | 'full'` — пресеты графика |
| `SelectedDay`        | 🆆 `{ date, set, item }` — выбранная дата с сетом меню и настройками дня |
| `SetCategory`        | `'hot' | 'salad' | 'side' | 'fastfood' | 'appetizer' | 'soup'` — категория сета (табы меню) |
| `LunchSet`           | Сет с KBJU + composition + category     |
| `CartItem`           | Настройки дня (active, portions, salad, beverage) |
| `CartState`          | 🆆 `Record<string, CartItem>` — ключи = даты `YYYY-MM-DD` |
| `formatPrice(n, lang)` | `"55 000 сум"` (ru) / `"55 000 so'm"` (uz) |

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

## 6. Привязка «дата → сет» и правила выбора дат

### 6.1. Глобальная порядковая привязка (все 56 сетов достижимы)

`getSetForDate(date)` (в `src/data/mockMenu.ts`, рядом с данными) детерминированно сопоставляет дату и сет меню:

```
сет = MONTHLY_SETS[(ordinal - 1) % MONTHLY_SETS.length]
ordinal = количество дней с 1-го числа текущего месяца до даты + 1
```

- 1-е число текущего месяца → сет №1, 15-е → №15; даты следующего месяца продолжают счёт (1-е следующего после 31-дневного месяца → №32), далее — модуль 56 (сет повторяется).
- Привязка **глобальная и детерминированная**: выбор/снятие других дат не меняет сет для данной даты.
- Единый способ получения сета используется в `App.tsx` (orderDays) и `Catalog.tsx` (activeDateBySet). Прошлые даты не приводят к выходу за границы массива (двойной модуль безопасен).

### 6.2. Правила дат (P1.2)

- **Прошедшие даты недоступны**: в `CalendarModal` они отключены (`.calendar__day--disabled`) и не попадают в draft ни при клике, ни в пресетах/«Выбрать все». `App.tsx` дублирует защиту на уровне state (фильтр при загрузке из localStorage, в `handleApplySelectedDates` и `handleToggleDate`).
- **Временная резка «сегодня»**: `TODAY_ORDER_CUTOFF_HOUR = 10` — заказ на сегодня возможен только до 10:00. Единый предикат `canSelectDate(date)` (не прошлое И, если сегодня, то до резки) используется во всех путях выбора: клик, «Вся рабочая неделя», пресеты `2/2`/`5/2`/`6/1`/`full` (через `buildPresetDates`), «Выбрать все».
- В модалке выводится подсказка `calendarLockedHint` («Прошедшие даты недоступны; сегодня можно заказать до {n}:00») на языке интерфейса.

### 6.3. Очистка корзины после заказа

После успешной `submitOrder` (см. [[CHECKOUT_FLOW]]) заказ принудительно сбрасывается: `cartState → {}`, `employeeCount → 1`, `clearSavedOrder()`. Данные для экрана Success фиксируются заранее (`successInfo`). Это исключает восстановление уже оплаченного заказа из автоприсейва и повторную оплату после перезагрузки.

---

## 7. Известные ограничения (TODOs)

1. ❌ Нет бэкенда — данные из `mockMenu.ts`
2. ❌ Нет интеграции с Telegram Bot
3. ❌ Нет react-router — условный рендеринг
4. ✅ Реализовано: автоприсейв конфигурации заказа и языка в localStorage (`orderStorage.ts`, `lunchistan_lang`)
5. ❌ Нет Tailwind — pure CSS
6. ❌ Нет тестов
7. ❌ Checkout-форма минимальна (только способ оплаты, без полей ввода)
