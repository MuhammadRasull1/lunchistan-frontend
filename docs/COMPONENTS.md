# 🧩 Компоненты Lunchistan

> Версия: 1.0  
> Последнее обновление: 29.07.2026  
> Связанные файлы: [[ARCHITECTURE]], [[STATE_MANAGEMENT]], [[CHECKOUT_FLOW]], [[B2B_RULES]]

---

## 1. Общая архитектура рендеринга

Все состояние — в **`App.tsx`** (State Owner). Дочерние компоненты получают `props` и вызывают колбэки.

```
App (state owner)
  │
  ├──→ Catalog
  │     ├──→ SetCard (×N)
  │     └──→ SetDetailModal (Bottom Sheet, при клике на SetCard)
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

---

## 3. Catalog.tsx — Главный экран

### 3.1. Секции

1. **Шапка** — бренд + заголовок + подзаголовок
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
  onToggleDay: (setId: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEmployeeCountChange: (count: number) => void
  onWorkDaysChange: (delta: number) => void
  onGoToCart: () => void
}
```

---

## 4. SetCard.tsx — Карточка дня/сета (Image-first)

### 4.1. Визуальные элементы

- **Hero-изображение (баннер)** — `<img>` во всю ширину (`h-44 = 176px`), `object-fit: cover`, уникальные Unsplash-фото для каждого из 22 блюд (прямые ссылки `UNSPLASH_IMAGES` в [[mockMenu.ts]]), `loading="lazy"`, fallback на резервное Unsplash фото при ошибке
- **DayBadge** — оранжевый кружок с номером дня поверх изображения
- **Название сета** — с зачёркиванием для неактивных дней
- **Composition chips** — полупрозрачные чипсы с lucide-иконками (`UtensilsCrossed`, `LeafyGreen`, `Croissant`). Чип «Напиток» скрыт в карточке (показан только в модалке)
- **Цена** — `formatPrice(55000)` + подпись «за порцию» (отделена border-top)
- **Обёртка в `motion.article`** — анимация при скролле, клик → модалка
- ❌ **Удалено**: переключатель напитков, счётчик порций, toggle, круглый эмодзи-контейнер, бежевый градиент
- 🆕 **onError**: при отсутствии локального JPG подставляется Unsplash-фото

### 4.2. Props

```typescript
interface SetCardProps {
  set: LunchSet
  index: number
  active: boolean
  onSelect?: () => void  // клик → открыть SetDetailModal
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
Подробнее → [[STATE_MANAGEMENT#setdetailmodal]]

### 5.1. Визуальные элементы

- **Overlay** — полупрозрачный фон с `backdrop-filter: blur(8px)`
- **Bottom Sheet** — панель на половину экрана с скруглёнными верхними углами
- **Кнопка закрытия** — крестик (X) в правом верхнем углу
- **Изображение блюда (обложка)** — `<img>` во всю ширину (`h-52 = 208px`), `object-fit: cover`, локальный JPG `/images/sets/day-N.jpg`, fallback на Unsplash при ошибке
- **Название и день** — заголовок + подзаголовок
- **Состав** — аккуратные плашки с lucide-иконкой и названием (включая «Напиток»)
- **KBJU-блок** — калории, белки, жиры, углеводы в сетке 2×2 с цветными иконками
- **Фиксированная нижняя плашка** — цена слева + кнопка «Выбрать» справа
- ❌ **Удалено**: выбор напитка, вложенная карточка с градиентным фоном и круглой иконкой

### 5.2. Props

```typescript
interface SetDetailModalProps {
  set: LunchSet | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void  // активирует день + закрывает
}
```

### 5.3. Анимации (framer-motion)

- **Enter**: `y: '100%' → y: 0` + overlay fade-in (spring, stiffness 300)
- **Exit**: `y: 0 → y: '100%'` + overlay fade-out
- **Drag-to-close**: `drag="y"` с `dragConstraints={{ top: 0 }}` и `onDragEnd` (при свайпе > 100px)
- **Overlay click**: закрытие по клику на фон

---

## 6. Cart.tsx — Экран корзины/оформления

Подробнее → [[CHECKOUT_FLOW]]

### 6.1. Секции

1. **Шапка** — кнопка «Назад» + заголовок
2. **Список выбранных сетов** — с детализацией порций и напитков
3. **Способ оплаты** — три варианта с визуальным выделением
4. **Итоговая сумма**
5. **Кнопка оплаты**

### 6.2. Анимации

- Весь компонент: fade-in + slide-up
- Список сетов: `staggerChildren: 0.05`
- Секции: нарастающая задержка `delay: 0.1...0.4`

---

## 7. Success.tsx — Экран успеха

### 7.1. Элементы

- **Анимированная галочка** — SVG circle + path с `stroke-dasharray`/`stroke-dashoffset`
- **Заголовок** — «Заказ оформлен!»
- **Текст благодарности**
- **Номер заказа** — `#ORD-NNNN` (генерируется при монтировании)
- **Кнопка** — «Сделать новый заказ» → полный сброс состояния

---

## 8. AnimatedCount.tsx — Числовая анимация

- Использует `useMotionValue` + `useSpring` (stiffness: 120, damping: 24)
- `useTransform` для форматирования числа
- Применён: активные дни, сотрудники, порции, итоговые позиции

---

## 9. Стилизация

- **Единый CSS-файл**: `src/App.css` (≈950 строк)
- **CSS Custom Properties**: брендовый цвет, тени, радиусы (`--brand`, `--shadow-md` и т.д.)
- **БЭМ-подобная нотация**: `.set-card__head`, `.pill--active`
- **Glassmorphism**: `backdrop-filter: blur(12px)` + полупрозрачный фон
- **Адаптив**: `@media (max-width: 480px)` для Telegram Mini App
