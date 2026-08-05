# ⚙️ Управление состоянием (State Management)

> Версия: 1.3  \
> Последнее обновление: 05.08.2026  \
> Связанные файлы: [[ARCHITECTURE]], [[COMPONENTS]], [[B2B_RULES]]

---

## 1. Принцип

**Единый источник истины (Single Source of Truth)** — всё состояние хранится в `App.tsx`.  
Дочерние компоненты — stateless, получают данные через `props` и сообщают о действиях через колбэки.

---

## 2. Структура `App.tsx`

### 2.1. Основные переменные состояния

| Переменная       | Тип        | Начальное значение | Описание                              |
| ---------------- | ---------- | ------------------ | ------------------------------------- |
| `screen`         | `Screen`   | `'catalog'`        | Текущий экран (`catalog` / `cart` / `success`) |
| `employeeCount`  | `number`   | `1`                | Множитель стоимости (сотрудники)      |
| `workDaysCount`  | `number`   | `24`               | Отображаемое количество рабочих дней  |
| `cartState`      | `CartState`| Все `active: true`, `portions: 1`, `beverage: 'Вода'` | Состояние корзины |
| `lang`           | `Lang`     | `'ru'`             | 🆕 Текущий язык интерфейса (RU/UZ)   |

### 2.2. CartState — детальная структура

```typescript
type CartState = Record<string | number, CartItem>

interface CartItem {
  beverage: Beverage          // 'Вода' | 'Компот в ассортименте'
  active: boolean             // включён ли день в подписку
  portions: number            // порций на одного сотрудника
  excludedIngredients: string[]  // 🆕 исключённые ингредиенты (Салат, Лепёшка, Напиток)
}

// Пример для 24 дней:
{
  "1":  { beverage: "Вода",                   active: true,  portions: 2, excludedIngredients: [] },
  "2":  { beverage: "Компот в ассортименте",   active: true,  portions: 1, excludedIngredients: ["Салат", "Лепёшка"] },
  "3":  { beverage: "Вода",                   active: false, portions: 1, excludedIngredients: [] },
  // ...
}
```

---

## 3. Вычисляемые значения (Derived State)

```typescript
visibleSets           = MONTHLY_SETS.slice(0, workDaysCount)
activeDays            = Object.values(cartState).filter(item => item.active).length
totalPortionsFromActive = activeItems.reduce(sum of portions)
totalItems            = totalPortionsFromActive × employeeCount
totalMonthlyPrice     = totalPortionsFromActive × employeeCount × SET_PRICE
```

> **Важно (v1.2):** В `Catalog.tsx` `activeDays` и `totalPortions` считаются **только по видимым сетам** (первые `workDaysCount`), чтобы «X из Y» отображалось корректно. При уменьшении `workDaysCount` дни за пределами лимита автоматически деактивируются в `cartState` через `handleWorkDaysSet`. При **увеличении** новые дни автоматически **активируются** (подгружаются в подписку).

---

## 4. Обработчики событий

| Функция                         | Действие                                           |
| ------------------------------- | -------------------------------------------------- |
| `handleWorkDaysSet(count)`      | 🆆 Установить количество дней (1..24); при уменьшении — деактивировать дни за лимитом, при увеличении — активировать новые дни |
| `handleBeverageChange(id, bev)` | Сменить напиток для дня |
| `handleToggleDay(id)`           | Включить/выключить день                             |
| `handleExcludeIngredients(id, list)` | 🆆 Сохранить список исключённых ингредиентов для дня |
| `handlePortionChange(id, delta)`| Увеличить/уменьшить порции для дня (мин. 1)        |
| `handleSelectAll()`             | Включить все дни **в пределах workDaysCount**       |
| `handleDeselectAll()`           | Выключить все дни **в пределах workDaysCount**      |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (мин. 1)          |
| `handlePlaceOrder(method)`      | Оформить заказ → screen = 'success'                 |
| `handleNewOrder()`              | Сбросить всё → screen = 'catalog'                   |
| `handleLangChange(newLang)`     | 🆕 Сменить язык интерфейса                          |

### 4.1. Логика `handleWorkDaysSet` (v1.2)

```typescript
// При уменьшении (clamped < prev): активность снимается с дней numId > clamped
// При увеличении (clamped > prev): дни numId ∈ (prev, clamped] автоматически активируются
// (даже если были деактивированы ранее) → итоговая сумма мгновенно растёт.
```

Ручной ввод чисел реализован в компоненте [[COMPONENTS#9-steppertsx-счётчик-с-ручным-вводом-v12]]: `onWorkDaysSet`/`onEmployeeCountChange` вызываются на каждый валидный ввод.

---

## 5. SetDetailModal — локальное состояние

Модальное окно детализации сета ([[COMPONENTS#5-setdetailmodaltsx]]) управляется **локальным состоянием в Catalog.tsx**:

```typescript
// Catalog.tsx
const [selectedSetId, setSelectedSetId] = useState<string | number | null>(null)
const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])  // 🆕 v1.2
```

- `setSelectedSetId(id)` — открыть модалку для сета; при этом `excludedIngredients` инициализируется из `cartState[id].excludedIngredients`
- `setSelectedSetId(null)` — закрыть модалку
- При закрытии: beverage и исключённые ингредиенты не сохраняются в cartState до нажатия «Выбрать» (ленивое обновление)
- **v1.2:** при подтверждении модалки `handleModalConfirm` активирует день (если неактивен) и вызывает `onExcludeIngredients(setId, excludedIngredients)` → `handleExcludeIngredients` в [[App.tsx]]

---

## 6. Поток данных (Props drilling)

```
App (state owner — useState)
  │  lang → Catalog, Cart, Success
  │
  ├──→ Catalog
  │     ├──→ SetCard (×N) — read-only display + lang
  │     ├──→ SetDetailModal — lang + excludedIngredients (локальный state)
  │     └──→ Stepper (×2) — onSet → handleWorkDaysSet / handleEmployeeCountChange
  │
  ├──→ Cart — lang + read-only display + onPlaceOrder
  └──→ Success — lang + onNewOrder callback → полный reset
```

**Роутинг**: условный рендеринг (`screen === 'catalog' && <Catalog />`).  
React Router не используется → [[ARCHITECTURE#4-маршрутизация]]

---

## 7. Сброс состояния (New Order)

```typescript
const handleNewOrder = () => {
  const reset: CartState = {}
  MONTHLY_SETS.forEach(set => {
    reset[set.id] = { beverage: 'Вода', active: true, portions: 1, excludedIngredients: [] }
  })
  setCartState(reset)
  setEmployeeCount(1)
  setWorkDaysCount(MAX_WORK_DAYS)
  setScreen('catalog')
}
```

**Что сбрасывается:**
- `cartState` → все дни активны, напиток «Вода», 1 порция, исключений нет
- `employeeCount` → 1
- `workDaysCount` → 24 (максимум)
- `screen` → `'catalog'`
- `lang` **не сбрасывается** (язык сохраняется между заказами)
