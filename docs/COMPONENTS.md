# 🧩 Компоненты Lunchistan

> Версия: 3.0  \
> Последнее обновление: 06.09.2026  \
> Связанные файлы: [[ARCHITECTURE]], [[STATE_MANAGEMENT]], [[CHECKOUT_FLOW]], [[B2B_RULES]]

---

## 1. Общая архитектура рендеринга

Все состояние — в **`App.tsx`** (State Owner). Дочерние компоненты получают `props` и вызывают колбэки.

```
App (state owner)
  │
  ├──→ Catalog
  │     ├──→ CalendarModal (модалка выбора дат: черновик → подтверждение)
  │     ├──→ SetCard (×MONTHLY_SETS — полное меню всегда)
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
| `employeeCount`     | `number`   | `1`                | Количество сотрудников (множитель, clamp [1, EMPLOYEE_MAX=500]) |
| `cartState`         | `CartState`| `{}` — 0 дней      | Выбранные даты (`YYYY-MM-DD`) + настройки; прошедшие даты исключаются |
| `lang`              | `Lang`     | из localStorage    | Текущий язык интерфейса (персистится в `lunchistan_lang`) |

> **v2.0:** `workDaysCount` удалён — количество дней = `selectedDates.length` ([[STATE_MANAGEMENT#3-вычисляемые-значения-derived-state]]).

---

## 3. Catalog.tsx — Главный экран

### 3.1. Секции

1. **Шапка** — бренд + переключатель языка (`RU | UZ`) + заголовок + подзаголовок
2. **Подписка: выбор дат** — сводка выбранных дней + кнопки «Выбрать дни» / «Сбросить все» (обе открывают календарную модалку) + счётчик сотрудников
3. **Калькулятор стоимости** — детализация расчёта
4. **Полное меню на месяц** — табы категорий + сетка SetCard × **все** сеты (всегда, независимо от выбора дней)
5. **StickyBar** — фиксированная панель с итогом + кнопка «Оформить» (только при выбранных днях)
6. **SetDetailModal** — выплывающее окно детализации сета (кастомизация дня / read-only предпросмотр)

### 3.2. Props

```typescript
interface CatalogProps {
  days: SelectedDay[]                 // 🆆 выбранные даты с сетами и настройками
  allSetsCount: number
  employeeCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang
  onApplySelectedDates: (dates: string[]) => void // 🆆 применить подтверждённый выбор из календарной модалки
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
- **Меню показывается всегда и полностью** (все `MONTHLY_SETS`), независимо от количества выбранных дней.
- Карточка сета активна, если в выбранных датах есть дата, которой через `getSetForDate` сопоставлен этот сет (глобальная порядковая привязка, [[ARCHITECTURE#6-привязка-дата-→-сет-и-правила-выбора-дат]]): показывается бейдж реальной даты, клик открывает кастомизацию этого дня. Остальные карточки — предпросмотр сета (read-only).
- При отсутствии выбранных дней показывается подсказка «Выберите даты в календаре», а каталог при этом остаётся видимым.
- Все строки интерфейса используют функцию `t(lang, 'key')` из [[translations.ts]].

### 3.4. Табы категорий (v1.3, категории v1.5)

- Под заголовком «Меню на 2 месяца» отображаются табы: «Все», «Горячие блюда», «Салаты», «Гарниры», «Фастфуд», «Закуски», «Супы».
- Табы используют готовые CSS-классы `.tabs`, `.tabs__tab`, `.tabs__tab--active`.
- Локальное состояние `activeCategory` (тип `CategoryFilter = SetCategory | 'all'`), по умолчанию `'all'`.
- Фильтрация влияет **только на сетку карточек**, но НЕ на расчёт статистики (считается по всем видимым дням подписки) и НЕ на заголовок меню (всегда полное число сетов).
- Названия категорий локализованы: `categoryAll`, `categoryHot`, `categorySalad`, `categorySide`, `categoryFastfood`, `categoryAppetizer`, `categorySoup` → [[B2B_RULES#2-1-категории-сетов]].
- **v1.5:** категории соответствуют папкам фото: `hot` / `salad` / `side` / `fastfood` / `appetizer` / `soup`.

### 3.5. CalendarModal.tsx — Модалка выбора дат (v2.2) 🆆

Заменил инлайновый календарь. Кнопки «Выбрать дни» и «Сбросить все» на главном экране **открывают одну и ту же модалку** с текущим выбором.

**Возможности:**
- **Период:** текущий месяц → следующий; граница «назад» = текущий месяц.
- **Черновой выбор (`draftSelectedDays`)**: модалка монтируется заново при каждом открытии и инициализируется текущим выбором заказа. Точечное добавление/удаление дат кликом — только в черновике. В основной state заказа выбор попадает **только после нажатия «Подтвердить»** ([[STATE_MANAGEMENT#4-обработчики-событий]]).
- **Все календарные даты выбираемы**, включая субботу и воскресенье (выходные стилизованы `.calendar__day--weekend`, но кликабельны), **кроме недоступных**: прошлые даты и «сегодня» после временной резки `TODAY_ORDER_CUTOFF_HOUR = 10` отключены (`.calendar__day--disabled`, `disabled` + `pointer-events: none`). Единый предикат `canSelectDate(date)` используется и в клике, и в «Выбрать все», и в пресетах, и в «Вся неделя».
- **Сетка выравнивается по дню недели 1-го числа** (`buildMonthWeeks()` в [[ARCHITECTURE]]/`src/lib/calendar.ts`), пустые ячейки — `.calendar__day--empty`.
- **Подсказка о недоступных датах**: `.calendar-modal__hint` — «Прошедшие даты недоступны; сегодня можно заказать до {n}:00» (ключ `calendarLockedHint`, ru/uz).
- **Пресет «Вся неделя»**: кнопка `CalendarPlus` у каждой строки недели выбирает **все дни Пн..Вс** именно той недели (недоступные отсекает `canSelectDate`; повторное нажатие снимает).
- **Глобальные пресеты** `2/2`, `5/2`, `6/1`, `Весь месяц` — **toggle** (v2.2): первое нажатие добавляет даты пресета в видимый месяц (другие месяцы не затрагиваются), повторное — снимает **ровно пресетные даты**, а вручную добавленные/снятые дни сохраняются. Семантика (v2.4): `6/1` = пн–сб (вс выходной), `5/2` = пн–пт (сб/вс выходные), `2/2` = цикл по **всем** календарным дням месяца (сб/вс в цикле), `full` («Весь месяц») = **все** календарные дни месяца.
- **Индикация активного пресета** (v2.2): кнопка подсвечивается `.calendar__preset--active`, если выбор видимого месяца в точности равен результату пресета (`aria-pressed`).
- **Быстрые действия:** «Выбрать все N дней» (N = число **доступных** дат видимого месяца, включая выходные; недоступные не включаются) / «Сбросить все» (только видимый месяц) — на черновике. Работают независимо от пресетов.
- **Нижняя плашка:** счётчик «Выбрано дней: N» + кнопка «Подтвердить».

**Визуальные состояния:**
- Выбранный день — тёмный круглый акцент (`#1d1d1f`, `.calendar__day--selected`); оранжевый `--brand` остаётся только у главных действий
- Выходной невыбранный — серый фон `--surface` (`.calendar__day--weekend`)
- Сегодня — тонкая оранжевая обводка (`.calendar__day--today`)
- Недоступная дата — заметно приглушена, некликабельна (`.calendar__day--disabled`)
- Пустая ячейка выравнивания — невидима (`.calendar__day--empty`)
- Активный пресет графика — тёмная заливка (`#1d1d1f`)

**Props:**

```typescript
interface CalendarModalProps {
  isOpen: boolean
  initialSelectedDates: string[]      // текущий выбор заказа (YYYY-MM-DD)
  minMonth: Date                      // текущий месяц (граница «назад»)
  maxMonth: Date                      // следующий месяц (граница «вперёд»)
  lang: Lang
  onConfirm: (dates: string[]) => void // подтверждённый черновик → основной state
  onClose: () => void
}
```

**Стили** `.calendar*`, `.calendar-modal*` в `src/App.css` — адаптив под узкие экраны Telegram Mini App.

---

## 4. SetCard.tsx — Карточка дня/сета (Image-first)

### 4.1. Визуальные элементы

- **Hero-изображение (баннер)** — `<img>` во всю ширину (`h-44 = 176px`), `object-fit: cover`, **реальные локальные фото** блюд (`/images/dishes/<категория>/...`, поле `imageUrl` в [[mockMenu.ts]]), `loading="lazy"`, fallback на резервное Unsplash фото при ошибке
- **DayBadge** — «замороженное стекло» белый кружок с номером дня поверх изображения
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
  preview?: boolean     // 🆆 карточка невыбранного дня в полном каталоге (цветная, без бейджа/состава)
  onSelect?: () => void
}
```

> **v2.1:** `preview` — карточка невыбранного сета из полного каталога отображается в обычных цветах (без серой инверсии `.set-card--inactive`), без бейджа дня и чипов состава, но с описанием. Клик по preview открывает SetDetailModal в read-only режиме.

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
  readOnly?: boolean                  // 🆆 предпросмотр сета (без выбора напитка/салата/порций)
  beverage: Beverage
  onBeverageChange: (beverage: Beverage) => void
  excludedIngredients: string[]       // 🆕 исключённые ингредиенты текущего сета
  onToggleExcluded: (name: string) => void  // 🆕 добавить/убрать ингредиент из исключённых
}
```

> **v2.1 (read-only предпросмотр):** в полном каталоге клик по невыбранному сету открывает модалку с `readOnly` — блоки выбор напитка/салата/порций скрыты, кнопка «Выбрать» заменяется на «Закрыть».

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
- 🆆 **Сводка заказа** (`.success__summary`, v2.7): способ оплаты (локализован), «Выбрано дней: N дней · N сотрудников», итоговая сумма (`formatPrice` в валюте языка). Данные приходят из `successInfo` в `App.tsx`, зафиксированные до сброса заказа.
- **Кнопка** — «Сделать новый заказ» / «Yangi buyurtma»

### 7.2. Props (v2.7)

```typescript
interface SuccessProps {
  lang: Lang
  onNewOrder: () => void
  paymentMethod?: PaymentMethod   // способ оплаты заказа
  totalMonthlyPrice?: number      // итоговая сумма
  employeeCount?: number          // число сотрудников
  activeDays?: number             // число выбранных дней
}
```

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

- **Единый CSS-файл**: `src/App.css` (≈2000 строк)
- **Дизайн-токены в `:root`**: палитра apple.com-style (`--bg: #fff`, `--surface: #f5f5f7`, `--text: #1d1d1f`, `--text-muted: #6e6e73`, hairline `rgba(0,0,0,0.06)`), радиусы `--radius-lg: 20px` / `--radius-md: 14px`, единые тени `--shadow-soft` / `--shadow-raise`. Оранжевый `--brand` используется только у главных действий; выделение выбора — тёмным `#1d1d1f` и мягкими `--brand-soft`/`--brand-ring`
- **БЭМ-подобная нотация**: `.set-card__head`, `.pill--active`
- **Стекло**: `backdrop-filter: saturate(180%) blur(20px)` в sticky-bar и нижних плашках модалок
- **Адаптив** (v2.4, ревизия под телефоны): базовые брейкпоинты `@media (max-width: 560px)` (шапка), `480px` (отступы контейнеров) и `360px` (плотная сетка календаря) для Telegram Mini App.
  - `html, body { max-width: 100%; overflow-x: clip }` — жёсткая защита от горизонтального скролла (`clip`, а не `hidden`, чтобы не ломать `position: sticky` у `.view__header`).
  - `AppHeader` (`.catalog__header-top` / `.app-header`): `flex-wrap: wrap`; на `≤560px` вкладки `Каталог | Команды` (`.app-tabs`) уходят на отдельную строку во всю ширину (`order: 3; width: 100%`), бренд `.brand` — `font-size: clamp(20px, 5vw, 26px)`. До правки шапка держала минимальную ширину ~500px и распирала страницу вбок.
  - `≤480px`: `.app` padding `24/20 → 16/14`; «кабинетные» отступы `28px` у `.subscription` / `.cart` → `20px/16px`; `.view__header` / `.view__body` раздела «Команды» больше не добавляют второй слой `24px`.
  - Календарь `≤360px`: `.calendar__presets` в 2 колонки (`presetFull` «Весь месяц» больше не обрезается — убран `white-space: nowrap`), уменьшены `gap`, `.calendar__day` min-height `38 → 34`, `.calendar__week-preset` `30 → 24px`.
  - `img { max-width: 100% }`, `.modal-sheet__bar-btn { flex-shrink: 0 }` + `.modal-sheet__bar-price { min-width: 0 }` (длинная цена не выталкивает кнопку).
- **Пустое состояние**: `.empty-state` (иконка + заголовок + текст) при 0 выбранных дней
- **🆕 Language Switcher**: `.lang-switcher`, `.lang-btn`, `.lang-btn--active` — pill-стиль, активный язык на тёмном `#1d1d1f`
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
- Активный язык: тёмная заливка `#1d1d1f`, белый текст
- 🆆 Хранится в `App.tsx` как `state`, **персистится в localStorage** (`lunchistan_lang`) и инициализируется из него при старте (v2.7)

### 11.3. Область покрытия

Все тексты основного интерфейса переведены: заголовки, кнопки, подписи калькулятора, способ оплаты, экран успеха, детали модалки (включая названия напитков, макронутриентов, категорий и исключённых ингредиентов). Внутренние данные (названия блюд, дни недели) остаются на русском.

---

## 12. Вкладки и раздел «Команды» (v3.1) 🆆

### 12.1. AppHeader.tsx — шапка с вкладками
- Единая шапка: бренд (иконка меняется по вкладке) + pill-вкладки `Каталог | Команды` + переключатель языка.
- Используется и в `Catalog` (внутри `.catalog__header`), и над контентом вкладки «Команды` (внутри `.view__header`).
- Props: `activeTab`, `onTabChange`, `lang`, `onLangChange`. Тип вкладки — `AppTab = 'catalog' | 'teams'`.

### 12.2. TeamsAuth.tsx — вход / создание команды
- Три режима: `login` (телефон+пароль), `create` (Имя + Название команды + Кол-во людей + Телефон + Пароль), `join` (Имя + Телефон + Пароль + Код команды).
- Создание → `registerTeam` (без companyCode) → компания+admin+код 6 символов; присоединение → `joinTeam` (с companyCode). Ошибки через `apiErrorMessage`.

### 12.3. EmployeeView.tsx — мои дни (роль employee)
- `fetchMyDays()` → `MyDay[]` (дата, choice, defaultSet, locked). Кнопка «Выбрать дни» открывает `CalendarModal` → `putMyDays`.
- На день — `SetPicker` → `putMyChoice(date, setId)`. `locked`-дни (прошлые / сегодня после 10:00 TZ) блокируют выбор. Выход — inline-ссылка под именем.

### 12.4. ManagerView.tsx — сводка команды (роль admin)
- Карточка команды `.team-card`: код (копирование в буфер), кол-во людей (`employeesCount / size`).
- Чипы дат `.manager-dates__chip` (активна/закрыта/подтверждена) → `fetchDayReport` → сводка `.stat-tile` + строки `.report-line`; подтверждение → `confirmDay` → Telegram-чек (бекенд), повтор → 409.

### 12.5. SetPicker.tsx — выбор сета (bottom-sheet)
- 56 сетов `MONTHLY_SETS`, локальный поиск, категории (ru/uz), подсветка текущего выбора. `Number(set.id)` — в `LunchSet.id` тип `string | number`.

---

## 13. 🆕 v3 — раздел «Кабинет»: заказы компании и сводка владельца

Вкладка `tabTeams` переименована в **«Кабинет»** (`Кабинет` / `Kabinet`). После входа
(`TeamsAuth`, phone+password) `App.tsx` ветвится по `user.role`:

| role | Экран |
|---|---|
| `owner` | **`OwnerView`** — сводка (деньги, заказы, заявки, лист кухни) |
| `admin` | **`ManagerView`** с под-вкладками «Заказы» (`MyOrdersView`) / «Команда» (прежний функционал) |
| `employee` | `EmployeeView` (без изменений) |

### 13.1. OwnerView.tsx — сводка владельца

- Диапазон: `Неделя` / `2 недели` / `Месяц` (today → today+7/14/30). Перезагрузка через `reloadKey`.
- `GET /api/owner/summary?from&to` → рендер:
  - **Деньги** (`.owner-money`, 3 `.stat-tile`): Заказано / Оплачено (зелёный) / Долг (красный при > 0).
  - **Заказы по статусам** — чипы `.manager-dates__chip` + `.status-dot`; кнопка «Все заказы» → `OrdersListSheet` (`GET /api/owner/orders`).
  - **Новые заявки** — `summary.leads.recent`, кнопка `tel:` «Позвонить».
  - **Лист для кухни** — `summary.byDate` (кликабельные `.day-row--btn`) → `KitchenDaySheet` (`GET /api/owner/kitchen?date=`): порции по сетам с салатом/напитком/исключениями и компанией.
- Вложенные компоненты в файле: `KitchenDaySheet`, `OrdersListSheet` (оба — bottom-sheet с `key`-ами на motion-детях внутри `AnimatePresence`).

### 13.2. MyOrdersView.tsx — заказы моей компании

`GET /api/my/orders` → список `.day-row--btn` (номер, дата, сумма, бейдж статуса `.status-badge`) → `OrderDetailSheet` (read-only).

### 13.3. OrderDetailSheet.tsx — карточка заказа (bottom-sheet)

Props: `orderId`, `owner?` (можно менять статус), `preset?` (заказ уже под рукой из списка).
Владельцу — блок «Сменить статус» (`nextStatuses(current)` из `lib/orderStatus.ts`),
`POST /api/owner/orders/:id/status`. Контакты клиента, состав (`report-line`), сумма, оплата.

### 13.4. Новые стили (`App.css`)

`.status-badge`, `.status-dot`, `.status-actions`, `.owner-money` (3-колоночная сетка, `1fr` на ≤400px), `.day-row--btn` (сброс `button` + hover).

### 13.5. `src/lib/orderStatus.ts`

`statusLabel(lang, status)`, `statusColor(status)`, `nextStatuses(current)`, `formatMoney(n, lang)`, `dateChip(date, lang)`.
