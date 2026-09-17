# 🏗️ Архитектура Lunchistan Frontend

> Версия: 3.1 — ежедневное меню вместо ротации 56 сетов  \
> Последнее обновление: 17.09.2026  \
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
| **HTTP**         | axios (`src/lib/api.ts`, интерсептор Bearer) | ^1.18.1 |
| **Бэкенд**       | `lunchistan-backend` — Express 5 + **PostgreSQL (Neon)**, деплой Render, автодеплой из GitHub | — |
| **Telegram Bot** | Уведомления о заказах/заявках (бэкенд шлёт чек в чат) | —          |

> **Каталог/меню на фронте** — по-прежнему `src/data/mockMenu.ts` (56 сетов). Оформление
> заказа, контур «Команды» и раздел «Сводка» владельца работают через `lunchistan-backend`
> (`VITE_API_BASE_URL`, по умолчанию `https://lunchistan-backend.onrender.com`).
> Схема Б, эндпойнты и модель заказов — см. `lunchistan-backend/README.md`;
> клиентские экраны v3 — [[COMPONENTS#13-раздел-кабинет]], [[CHECKOUT_FLOW#8-v3]].
>
> Изображения сетов — **локальные JPG-файлы в `public/images/dishes/<категория>/`** (транслит-папки: hot-dishes, salads, sides, fastfood, appetizers, soups, misc), импортированы скриптом `scripts/import-images.mjs` из `~/Загрузки/Telegram Desktop` со сжатием (1200px, q80). Меню состоит **исключительно из реальных фото** (56 блюд); fallback на [[Unsplash]] срабатывает только при ошибке загрузки файла (подробнее → [[COMPONENTS]]). Категории меню: `hot | salad | side | fastfood | appetizer | soup` (подробнее → [[B2B_RULES]]). Добавлена мультиязычность RU/UZ через `src/locales/translations.ts` (подробнее → [[COMPONENTS#11-мультиязычность-ruuz]]).

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
│   │   └── telegram.ts                # Telegram WebApp: вибрация, алерты, openTelegramLink (t.me — нативно/новая вкладка)
│   │
│   └── components/
│       ├── SupportLink.tsx           # 🆆 Блок «Связаться с техподдержкой» (t.me/burn1ng_sky) — низ вкладки «Кабинет»
│       ├── Catalog.tsx               # Главный экран: сводка выбора дат + калькулятор + табы + полное меню
│       ├── CalendarModal.tsx         # 🆆 Модалка выбора дат (черновик → подтверждение), пресеты + «Вся неделя»
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
| `SelectedDay`        | 🆆 `{ date, set, chosen, item }` — дата + блюдо (выбор клиента или плейсхолдер) + флаг `chosen` + настройки дня; `CartItem.setId: number \| null` |
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

## 6. Привязка «дата → блюдо» и правила выбора дат

> 🆆 **v3.3 (17.09.2026):** выяснилось, что блюда бизнеса **не повторяются день в день** —
> детерминированная ротация `getSetForDate` (`MONTHLY_SETS[(ordinal-1) % 56]`) была неверной
> моделью реальности и **удалена** (была и в `src/lib/menu.ts`, и как fallback в `App.tsx`).
> Меню на дату теперь приходит с бэкенда (`fetchDayMenu(date)`, `src/lib/api.ts`), кешируется
> в `App.tsx` (`dayMenus: Record<string, LunchSet[]>`) и не должно повторяться на другую дату.

### 6.1. Дневное меню и «токен» дня (v3.3)

- `fetchDayMenu(date)` → блюда, предложенные именно на эту дату (`[]` — меню не внесено).
- `App.tsx` держит кеш `dayMenus`, подгружаемый по каждой дате из `cartState` (`ensureDayMenu`,
  дедуп в `fetchingDaysRef`, см. [[STATE_MANAGEMENT#22-cartstate--детальная-структура]]).
- **1 блюдо на дату** → выбирать нечего, `cartState[date].setId` проставляется автоматически,
  как только `dayMenus[date]` пришёл с бэкенда («токен» тратится сам, `SetPicker` не открывается).
- **Несколько блюд на дату** → прежний флоу ручного выбора через `SetPicker`, но список в
  пикере — блюда именно этой даты (`dayMenus[date]`), а не весь каталог `menu` (56 позиций).
- **0 блюд на дату** → дата не должна попасть в `cartState` вовсе — см. 6.2 (календарь).
- `getSetById(sets, id)` (`src/lib/menu.ts`) — резолв блюда по выбору клиента (`item.setId`),
  ищет по полному каталогу `menu` (дневное меню — его подмножество).
- Полный каталог `fetchMenu()` (`/api/menu`, все активные блюда) остаётся источником для:
  списка «Меню на N сетов» внизу `Catalog` (read-only обзор), опций салата (`saladOptions.ts`),
  резолва блюда по id. **Не** используется больше как источник выбора блюда на конкретный день.

### 6.2. Доступность дат в календаре (v3.3)

- `fetchAvailableDates(from, to)` (`/api/menu/available-dates`) → список дат, на которые
  внесено меню. `CalendarModal` подтягивает его при каждом открытии (окно текущий→следующий
  месяц) и блокирует выбор дат вне списка — **не только на checkout, само добавление даты
  в подписку невозможно** (см. [[COMPONENTS#35-calendarmodaltsx—модалка-выбора-дат-v22]]).
- Пока список не загружен — новые даты считаются недоступными (fail-closed); уже подтверждённый
  ранее выбор (`initialSelectedDates`) не отсеивается по этому признаку, чтобы не мигать/не
  терять его, пока запрос летит.
- `App.tsx` дублирует защиту на уровне state: `handleToggleDate`/`handleApplySelectedDates`
  не добавляют дату, если её `dayMenus[date]` уже известен и пуст.

### 6.3. Правила дат (P1.2, не изменились)

- **Прошедшие даты недоступны**: в `CalendarModal` они отключены (`.calendar__day--disabled`) и не попадают в draft ни при клике, ни в пресетах/«Выбрать все». `App.tsx` дублирует защиту на уровне state (фильтр при загрузке из localStorage, в `handleApplySelectedDates` и `handleToggleDate`).
- **Временная резка «сегодня»**: `TODAY_ORDER_CUTOFF_HOUR = 10` — заказ на сегодня возможен только до 10:00. Единый предикат `canSelectDate(date)` (не прошлое И, если сегодня, то до резки) используется во всех путях выбора: клик, «Вся неделя», пресеты `2/2`/`5/2`/`6/1`/`full` (через `buildPresetDates`), «Выбрать все». В `CalendarModal` он скомбинирован с 6.2 в `canPick(date) = canSelectDate(date) && hasMenu(date)`.
- В модалке выводится подсказка `calendarLockedHint` («Прошедшие даты недоступны; сегодня можно заказать до {n}:00») на языке интерфейса; недоступные из-за отсутствия меню даты дополнительно получают тултип `dateMenuNotReady` («Меню на эту дату ещё не готово»).

### 6.3. Очистка корзины после заказа

После успешной `submitOrder` (см. [[CHECKOUT_FLOW]]) заказ принудительно сбрасывается: `cartState → {}`, `employeeCount → 1`, `clearSavedOrder()`. Данные для экрана Success фиксируются заранее (`successInfo`). Это исключает восстановление уже оплаченного заказа из автоприсейва и повторную оплату после перезагрузки.

---

## 6.4. Адаптив под мобильные (v2.4)

Ревизия отзывчивости под Telegram Mini App на телефонах — детали правил в [[COMPONENTS#10-стилизация]]:

- `html, body { max-width: 100%; overflow-x: clip }` — страница больше не скроллится вбок ни на одном экране 320–768px (до правки контент держал ~500–524px минимум из-за шапки и вложенных отступов раздела «Команды»).
- Брейкпоинты: `560px` (шапка — вкладки на отдельную строку), `480px` (отступы `.app` / `.subscription` / `.cart` / `.view__*`), `360px` (плотная сетка `CalendarModal`).
- `AppHeader` переведён на `flex-wrap`, бренд — `clamp()`.

---

## 7. Известные ограничения (TODOs)

1. ❌ Нет бэкенда — данные из `mockMenu.ts`
2. ❌ Нет интеграции с Telegram Bot
3. ❌ Нет react-router — условный рендеринг
4. ✅ Реализовано: автоприсейв конфигурации заказа и языка в localStorage (`orderStorage.ts`, `lunchistan_lang`)
5. ❌ Нет Tailwind — pure CSS
6. ❌ Нет тестов
7. ❌ Checkout-форма минимальна (только способ оплаты, без полей ввода)
