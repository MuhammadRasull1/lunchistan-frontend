# 🧩 Компоненты Lunchistan

> Версия: 2.0  \
> Последнее обновление: 13.08.2026  \
> Связанные файлы: [[ARCHITECTURE]], [[STATE_MANAGEMENT]], [[CHECKOUT_FLOW]], [[B2B_RULES]]

---

## 1. Общая архитектура рендеринга

Все состояние — в **`App.tsx`** (State Owner). Дочерние компоненты получают `props` и вызывают колбэки.

```
App (state owner)
  │
  ├──→ Catalog
  │     ├──→ Calendar (календарь рабочих дней + пресеты)
  │     ├──→ SetCard (×selectedDates)
  │     ├──→ SetDetailModal (Bottom Sheet, при клике на SetCard)
  │     ├──→ Stepper (×1: сотрудники)
  │     └──→ Language Switcher (в шапке)
  │
  ├──→ Cart
  └──→ Success
```

Подробнее об управлении состоянием → [[STATE_MANAGEMENT]]

---

## 2. App.tsx — Корневой компонент

| Пропс / Стейт       | Тип        | Начальное значение | Описание                          |
| ------------------- | ---------- | ------------------ | --------------------------------- |
| `screen`            | `Screen`   | `'catalog'`        | Текущий экран                     |
| `employeeCount`     | `number`   | `1`                | Количество сотрудников (множитель)|
| `cartState`         | `CartState`| `{}` — 0 дней      | Выбранные даты (`YYYY-MM-DD`) + настройки |
| `lang`              | `Lang`     | `'ru'`             | Текущий язык интерфейса           |

> **v2.0:** `workDaysCount` удалён — количество дней = `selectedDates.length` ([[STATE_MANAGEMENT#3-вычисляемые-значения-derived-state]]).

---

## 3. Catalog.tsx — Главный экран

### 3.1. Секции

1. **Шапка** — бренд + переключатель языка (`RU | UZ`) + заголовок + подзаголовок
2. **Календарь рабочих дней** — навигация по месяцам, пресеты, сетка дат, «Выбрать все/Сбросить все»
3. **Калькулятор стоимости** — счётчик сотрудников + детализация расчёта
4. **Сетка SetCard × выбранные даты** — карточки дней (Image → Name → Chips → Price)
5. **StickyBar** — фиксированная панель с итогом + кнопка «Оформить»
6. **SetDetailModal** — выплывающее окно детализации сета

### 3.2. Props

```typescript
interface CatalogProps {
  days: SelectedDay[]                 // 🆆 выбранные даты с сетами и настройками
  allSetsCount: number
  employeeCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang
  onToggleDate: (date: string) => void          // 🆆 включить/выключить дату
  onSelectAllInMonth: (monthKey: string) => void // 🆆 выбрать все Пн-Пт видимого месяца
  onDeselectAllInMonth: (monthKey: string) => void // 🆆 сбросить выбор видимого месяца
  onApplyPreset: (pattern: PresetPattern, monthKey: string) => void // 🆆 пресеты 2/2, 5/2, 6/1, full
  onEmployeeCountChange: (count: number) => void
  onBeverageChange: (date: string, beverage: Beverage) => void
  onApplyBeverageToAll: (beverage: Beverage) => void
  onPortionsChange: (date: string, portions: number) => void
  onSaladChange: (date: string, salad: Salad) => void
  onApplySaladToAll: (salad: Salad) => void
  onGoToCart: () => void
  onLangChange: (lang: Lang) => void
}
```

### 3.3. Фикс калькулятора (v2.0)

- `activeDays` и `totalPortions` считаются **только по выбранным датам** (`days.length` и сумма порций).
- Сетка карточек рендерится для выбранных дат; категорийные табы фильтруют её (не влияют на расчёт).
- При отсутствии выбранных дней показывается подсказка «Выберите даты в календаре».
- Все строки интерфейса используют функцию `t(lang, 'key')` из [[translations.ts]].

### 3.4. Табы категорий (v1.3)

- Под заголовком «Меню на месяц» отображаются 5 табов: «Все», «Мясо», «Курица», «Птица», «Рыба».
- Табы используют готовые CSS-классы `.tabs`, `.tabs__tab`, `.tabs__tab--active`.
- Локальное состояние `activeCategory` (тип `CategoryFilter = SetCategory | 'all'`), по умолчанию `'all'`.
- Фильтрация влияет **только на сетку карточек**, но НЕ на расчёт статистики (считается по всем видимым дням подписки).
- Названия категорий локализованы: `categoryAll`, `categoryMeat`, `categoryChicken`, `categoryPoultry`, `categoryFish` → [[B2B_RULES#2-1-категории-сетов]].
- **v1.3:** рыбные сеты вынесены в собственную категорию `'fish'` (рыба ≠ птица).

### 3.5. Calendar.tsx — Календарь рабочих дней (v2.0) 🆆

Новый компонент заменяет абстрактный счётчик «рабочих дней» `− 56 +`.

**Возможности:**
- **Период:** показывается текущий месяц; доступна навигация на следующий месяц (и назад в пределе «текущий → следующий»). Дальше недопустимого периода уйти нельзя.
- **Дата начала подписки** = 1-е число видимого месяца (день №1 паттерна пресетов).
- **Начальное состояние:** при первом открытии ни один день не выбран.
- **Выбор:** клик по допустимой дате (Пн-Пт) — включить/выключить; выходные (Сб/Вс) — некликабельны.
- **Пресеты:** `2/2`, `5/2`, `6/1`, `Весь месяц` — очищают выбор и строят график от 1-го числа видимого месяца по последовательности Пн-Пт (реализация `buildPresetDates()` в [[ARCHITECTURE]] / `src/lib/calendar.ts`).
- **Быстрые действия:** «Выбрать все N дней» / «Сбросить все» — в пределах видимого месяца.

**Визуальные состояния (используются CSS-переменные дизайн-системы):**
- Выбранный рабочий день — оранжевый (`--brand`)
- Нерабочий/не выбранный — серый (`.calendar__day--off`, `#f3f4f6`)
- Сегодня — оранжевая обводка (`.calendar__day--today`)

**Props:**

```typescript
interface CalendarProps {
  month: Date                          // видимый месяц
  minMonth: Date                       // текущий месяц (граница «назад»)
  maxMonth: Date                       // следующий месяц (граница «вперёд»)
  onMonthChange: (month: Date) => void
  selectedDates: string[]              // выбранные даты YYYY-MM-DD
  selectableCount: number              // допустимых дат в видимом месяце
  lang: Lang
  onToggleDate: (date: string) => void
  onApplyPreset: (pattern: PresetPattern) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}
```

**Стили** `.calendar*` в [[ARCHITECTURE#10-известные-ограничения-todos]] (фактически `src/App.css`) — адаптив под узкие экраны Telegram Mini App (`@media max-width: 480px`).

---

## 4. SetCard.tsx — Карточка дня/сета (Image-first)

### 4.1. Визуальные элементы

- **Hero-изображение (баннер)** — `<img>` во всю ширину (`h-44 = 176px`), `object-fit: cover`, **реальные локальные фото** блюд (`/images/dishes/<категория>/...`, поле `imageUrl` в [[mockMenu.ts]]), `loading="lazy"`, fallback на резервное Unsplash фото при ошибке
- **DayBadge** — оранжевый кружок с номером дня поверх изображения
- **Название сета** — с зачёркиванием для неактивных дней
- **Composition chips** — полупрозрачные чипсы с lucide-иконками (`UtensilsCrossed`, `LeafyGreen`, `Croissant`, `Wine`). Чип «Напиток» показан в карточке и модалке
- **Цена** — `formatPrice(55000)` + подпись «за порцию» (локализована через `t(lang, 'perPortion')`)
- **Обёртка в `motion.article`** — анимация при скролле, клик → модалка

### 4.2. Props

```typescript
interface SetCardProps {
  set: LunchSet
  index: number
  active: boolean
  lang: Lang            // 🆕 для локализации «за порцию»
  dateLabel?: string    // 🆆 подпись даты «03.08 · Пн» (иначе день меню)
  onSelect?: () => void
}
```

> **v2.0:** в теге карточки отображается реальная дата календаря (`dateLabel`), а не абстрактный «День N».

### 4.3. Анимации

- **Scroll entrance**: fade-in + slide-up с `whileInView`
- **Stagger**: `delay: (index % 6) * 0.08` — волна появления
- **Hero hover**: при наведении изображение масштабируется (`scale: 1.06`)
- **Inactive**: grayscale-фильтр на hero-изображении для неактивных

---

## 5. SetDetailModal.tsx — Выплывающее окно сета

Создан для премиум-просмотра деталей обеда.  
Подробнее → [[STATE_MANAGEMENT#5-setdetailmodal]]

### 5.1. Визуальные элементы

- **Overlay** — полупрозрачный фон с `backdrop-filter: blur(8px)`
- **Bottom Sheet** — панель на половину экрана с скруглёнными верхними углами
- **Кнопка закрытия** — крестик (X) в правом верхнем углу
- **Изображение блюда (обложка)** — `<img>` во всю ширину (`h-52 = 208px`), `object-fit: cover`
- **Название и день** — заголовок + подзаголовок
- **Состав** — кликабельные чипы ингредиентов (эмодзи-иконки), названия локализованы через `localizeIngredient()`
- **Исключение ингредиентов (v1.2)** — второстепенные компоненты (Салат, Лепёшка, Напиток) кликабельны: при клике серый чип переносится в блок «Без этих ингредиентов» (клик возвращает обратно). Основное блюдо **заблокировано** 🔒 (`disabled` + `title` = `mainDishLocked`)
- **Выбор напитка** — pill-кнопки с локализованными названиями 💧 Suv / 🍷 Kompot
- **KBJU-блок** — калории, белки, жиры, углеводы с локализованными подписями
- **Фиксированная нижняя плашка** — цена слева + кнопка «Выбрать»

### 5.2. Props

```typescript
interface SetDetailModalProps {
  set: LunchSet | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  lang: Lang                          // 🆕 для локализации всего текста
  beverage: Beverage
  onBeverageChange: (beverage: Beverage) => void
  excludedIngredients: string[]       // 🆕 исключённые ингредиенты текущего сета
  onToggleExcluded: (name: string) => void  // 🆕 добавить/убрать ингредиент из исключённых
}
```

> **Логика исключения (v1.2):** `excludedIngredients` — **локальное состояние Catalog.tsx**, инициализируется при открытии модалки из `cartState[setId].excludedIngredients`. При подтверждении (кнопка «Выбрать») список сохраняется в `cartState` через `onExcludeIngredients(setId, list)` → [[STATE_MANAGEMENT#5-setdetailmodal]].

### 5.3. Анимации (framer-motion)

- **Enter**: `y: '100%' → y: 0` + overlay fade-in (spring, stiffness 300)
- **Exit**: `y: 0 → y: '100%'` + overlay fade-out
- **Drag-to-close**: `drag="y"` с `dragConstraints={{ top: 0 }}` и `onDragEnd` (при свайпе > 100px)
- **Overlay click**: закрытие по клику на фон

### 5.4. SaladPickerModal.tsx — динамический выбор салата (v1.5)

- 🆕 Список салатов **не захардкожен** — выводится динамически из `SALAD_OPTIONS` в `src/components/saladOptions.ts`, который фильтрует `MONTHLY_SETS` по `category === 'salad'` (→ реальные фото из `public/images/dishes/salads/`, 11 позиций).
- Каждый слот — карточка с **миниатюрой фото** (`salad-modal__slot-img`) и названием; заглушки «Скоро» (locked) удалены.
- Тип `Salad` в [[ARCHITECTURE#3-типы-данных-srctypests]] изменён на `string`; дефолтный салат — `DEFAULT_SALAD` (первый из списка), используется в [[STATE_MANAGEMENT]] и при оформлении заказа.
- Выбор применяется к конкретному дню; кнопка «Применить ко всем дням» — в родительской модалке.

---

## 6. Cart.tsx — Экран корзины/оформления

Подробнее → [[CHECKOUT_FLOW]]

### 6.1. Секции

1. **Шапка** — кнопка «Назад» + заголовок (локализованы)
2. **Список выбранных сетов** — с детализацией порций, напитков и 🆕 исключённых ингредиентов (`без: ...` / `... siz` через `localizeIngredient`)
3. **Способ оплаты** — три варианта с локализованными подписями
4. **Итоговая сумма**
5. **Кнопка оплаты** — «Оплатить {price}» (локализовано)

### 6.2. Анимации

- Весь компонент: fade-in + slide-up
- Список сетов: `staggerChildren: 0.05`
- Секции: нарастающая задержка `delay: 0.1...0.4`

---

## 7. Success.tsx — Экран успеха

### 7.1. Элементы

- **Анимированная галочка** — SVG circle + path с `stroke-dasharray`/`stroke-dashoffset`
- **Заголовок** — локализован (`Заказ оформлен!` / `Buyurtma qabul qilindi!`)
- **Текст благодарности** — локализован
- **Номер заказа** — `#ORD-NNNN`
- **Кнопка** — «Сделать новый заказ» / «Yangi buyurtma»

---

## 8. AnimatedCount.tsx — Числовая анимация

- Использует `useMotionValue` + `useSpring` (stiffness: 120, damping: 24)
- `useTransform` для форматирования числа
- Применён: активные дни, сотрудники, порции, итоговые позиции

---

## 9. Stepper.tsx — Счётчик с ручным вводом (v1.2)

### 9.1. Назначение

Число — кликабельный `input type="number"`: можно вписать значение с клавиатуры. Кнопки «−» и «+» остаются по бокам.

### 9.2. Props

```typescript
interface StepperProps {
  value: number
  min: number
  max?: number
  onSet: (value: number) => void      // вызывается и кнопками, и при вводе
  ariaDecrease?: string
  ariaIncrease?: string
}
```

### 9.3. Поведение

- **v2.0:** применяется **только** к «Количество сотрудников» (`min=1`). Счётчик «рабочих дней» удалён — количество дней определяется календарём ([[STATE_MANAGEMENT#3-вычисляемые-значения-derived-state]]).
- `onSet` вызывается на каждый валидный ввод → мгновенный пересчёт цены в [[CHECKOUT_FLOW#2-2-stickybar]].
- Кнопки `+`/`−` работают через `onSet(clamp(value ± 1))`.
- Локальное состояние `draft` + флаг `focused`: во время фокуса ввод не перезатирается внешними изменениями; при потере фокуса / Enter значение `clamp`-ится и коммитится.
- Синхронизация с внешним `value` (кнопки, сброс) выполняется **во время рендера** при `value !== prevValue && !focused` (паттерн React без `useEffect`).

### 9.4. Стили

- `.counter__input` — скрыты стрелки спиннера (`appearance: textfield` + `::-webkit-inner-spin-button`), при фокусе — оранжевое кольцо `box-shadow`.

---

## 10. Стилизация

- **Единый CSS-файл**: `src/App.css` (≈1500 строк)
- **CSS Custom Properties**: брендовый цвет, тени, радиусы (`--brand`, `--shadow-md` и т.д.)
- **БЭМ-подобная нотация**: `.set-card__head`, `.pill--active`
- **Glassmorphism**: `backdrop-filter: blur(12px)` + полупрозрачный фон
- **Адаптив**: `@media (max-width: 480px)` для Telegram Mini App
- **🆕 Language Switcher**: `.lang-switcher`, `.lang-btn`, `.lang-btn--active` — pill-стиль с оранжевым акцентом
- **🆕 Табы категорий**: переиспользуют `.tabs`, `.tabs__tab`, `.tabs__tab--active`
- **🆕 Чипы исключения**: `.modal-sheet__chip--clickable` / `--locked` / `--excluded`, блок `.modal-sheet__excluded`

---

## 11. Мультиязычность (RU/UZ)

### 11.1. Механизм

- Файл: `src/locales/translations.ts`
- Тип: `Lang = 'ru' | 'uz'`
- Функция: `t(lang: Lang, key: string, params?: Record<string, string | number>): string`
- Поддержка параметров: `t(lang, 'menuTitle', { n: 24 })` → `"Меню на месяц (24 дней)"`
- 🆕 Хелпер `localizeIngredient(lang, name)`: локализует стандартные ингредиенты (Салат → Salat, Лепёшка → Non, Напиток → Ichimlik); названия блюд остаются как есть.

### 11.2. Переключатель языка

- Расположение: в шапке `Catalog`, справа от бренда `.catalog__header-top`
- Стиль: два pill-переключателя `RU | UZ` с разделителем
- Активный язык: оранжевый фон (`--brand`), белый текст
- Хранится в `App.tsx` как `state`, передаётся через `props`

### 11.3. Область покрытия

Все тексты основного интерфейса переведены: заголовки, кнопки, подписи калькулятора, способ оплаты, экран успеха, детали модалки (включая названия напитков, макронутриентов, категорий и исключённых ингредиентов). Внутренние данные (названия блюд, дни недели) остаются на русском.
