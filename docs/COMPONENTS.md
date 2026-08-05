# 🧩 Компоненты Lunchistan

> Версия: 1.2  \
> Последнее обновление: 05.08.2026  \
> Связанные файлы: [[ARCHITECTURE]], [[STATE_MANAGEMENT]], [[CHECKOUT_FLOW]], [[B2B_RULES]]

---

## 1. Общая архитектура рендеринга

Все состояние — в **`App.tsx`** (State Owner). Дочерние компоненты получают `props` и вызывают колбэки.

```
App (state owner)
  │
  ├──→ Catalog
  │     ├──→ SetCard (×N)
  │     ├──→ SetDetailModal (Bottom Sheet, при клике на SetCard)
  │     ├──→ Stepper (×2: рабочие дни / сотрудники)
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
| `workDaysCount`     | `number`   | `22`               | Отображаемое количество дней      |
| `cartState`         | `CartState`| Все дни active     | Состояние корзины                 |
| `lang`              | `Lang`     | `'ru'`             | Текущий язык интерфейса           |

---

## 3. Catalog.tsx — Главный экран

### 3.1. Секции

1. **Шапка** — бренд + переключатель языка (`RU | UZ`) + заголовок + подзаголовок
2. **Калькулятор стоимости** — счётчики рабочих дней и сотрудников
3. **Быстрые действия** — «Выбрать все» / «Сбросить все»
4. **Детализация расчёта** — порции, множители, итоговая цена
5. **Сетка SetCard × workDaysCount** — карточки дней (Image → Name → Chips → Price)
6. **StickyBar** — фиксированная панель с итогом + кнопка «Оформить»
7. **SetDetailModal** — выплывающее окно детализации сета

### 3.2. Props

```typescript
interface CatalogProps {
  sets: LunchSet[]
  allSetsCount: number
  cartState: CartState
  employeeCount: number
  workDaysCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang                          // 🆕 текущий язык
  onToggleDay: (setId: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEmployeeCountChange: (count: number) => void
  onWorkDaysSet: (count: number) => void   // 🆕 устанавливает кол-во дней напрямую (заменил onWorkDaysChange)
  onBeverageChange: (setId: string | number, beverage: Beverage) => void
  onExcludeIngredients: (setId: string | number, excluded: string[]) => void  // 🆕 сохранение исключённых
  onGoToCart: () => void
  onLangChange: (lang: Lang) => void  // 🆕 смена языка
}
```

### 3.3. Фикс калькулятора (v1.2)

- `activeDays` и `totalPortions` считаются **только по видимым сетам** (в пределах `workDaysCount`), а не по всем 22 дням в `cartState`.
- При уменьшении `workDaysCount` — дни за пределами лимита **деактивируются** в `cartState`.
- При увеличении `workDaysCount` — **новые дни автоматически активируются** (подгружаются в подписку, цена мгновенно растёт) → [[STATE_MANAGEMENT#4-обработчики-событий]].
- «Выбрать все N дней» активирует строго N дней; «Сбросить все» деактивирует только видимые дни.
- Все строки интерфейса используют функцию `t(lang, 'key')` из [[translations.ts]].

### 3.4. Табы категорий (v1.2)

- Под заголовком «Меню на месяц» отображаются 4 таба: «Все», «Мясо», «Курица», «Птица».
- Табы используют готовые CSS-классы `.tabs`, `.tabs__tab`, `.tabs__tab--active`.
- Локальное состояние `activeCategory` (тип `CategoryFilter = SetCategory | 'all'`), по умолчанию `'all'`.
- Фильтрация влияет **только на сетку карточек**, но НЕ на расчёт статистики (считается по всем видимым дням подписки).
- Названия категорий локализованы: `categoryAll`, `categoryMeat`, `categoryChicken`, `categoryPoultry` → [[B2B_RULES#2-1-категории-сетов]].

---

## 4. SetCard.tsx — Карточка дня/сета (Image-first)

### 4.1. Визуальные элементы

- **Hero-изображение (баннер)** — `<img>` во всю ширину (`h-44 = 176px`), `object-fit: cover`, уникальные Unsplash-фото для каждого из 22 блюд (прямые ссылки `UNSPLASH_IMAGES` в [[mockMenu.ts]]), `loading="lazy"`, fallback на резервное Unsplash фото при ошибке
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
  onSelect?: () => void
}
```

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

Заменяет прежний счётчик «− / число / +»: число стало **кликабельным инпутом** (`input type="number"`). Пользователь может кликнуть по цифре и сразу вписать нужное значение с клавиатуры. Кнопки «−» и «+» остаются по бокам.

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

- **Применяется в Catalog** для «Рабочих дней» (`min=1, max=allSetsCount`) и «Количество сотрудников» (`min=1`).
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
- Поддержка параметров: `t(lang, 'menuTitle', { n: 22 })` → `"Меню на месяц (22 дней)"`
- 🆕 Хелпер `localizeIngredient(lang, name)`: локализует стандартные ингредиенты (Салат → Salat, Лепёшка → Non, Напиток → Ichimlik); названия блюд остаются как есть.

### 11.2. Переключатель языка

- Расположение: в шапке `Catalog`, справа от бренда `.catalog__header-top`
- Стиль: два pill-переключателя `RU | UZ` с разделителем
- Активный язык: оранжевый фон (`--brand`), белый текст
- Хранится в `App.tsx` как `state`, передаётся через `props`

### 11.3. Область покрытия

Все тексты основного интерфейса переведены: заголовки, кнопки, подписи калькулятора, способ оплаты, экран успеха, детали модалки (включая названия напитков, макронутриентов, категорий и исключённых ингредиентов). Внутренние данные (названия блюд, дни недели) остаются на русском.
