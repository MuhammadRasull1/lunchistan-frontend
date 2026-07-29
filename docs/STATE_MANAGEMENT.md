# ⚙️ Управление состоянием (State Management)

> Версия: 1.0  
> Последнее обновление: 29.07.2026  
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
| `workDaysCount`  | `number`   | `22`               | Отображаемое количество рабочих дней  |
| `cartState`      | `CartState`| Все `active: true`, `portions: 1`, `beverage: 'Вода'` | Состояние корзины |

### 2.2. CartState — детальная структура

```typescript
type CartState = Record<string | number, CartItem>

interface CartItem {
  beverage: Beverage          // 'Вода' | 'Компот в ассортименте'
  active: boolean             // включён ли день в подписку
  portions: number            // порций на одного сотрудника
}

// Пример для 22 дней:
{
  "1":  { beverage: "Вода",                   active: true,  portions: 2 },
  "2":  { beverage: "Компот в ассортименте",   active: true,  portions: 1 },
  "3":  { beverage: "Вода",                   active: false, portions: 0 },
  // ...
}
```

---

## 3. Вычисляемые значения (Derived State)

```typescript
activeDays            = Object.values(cartState).filter(item => item.active).length
totalPortionsFromActive = activeItems.reduce(sum of portions)
totalItems            = totalPortionsFromActive × employeeCount
totalMonthlyPrice     = totalPortionsFromActive × employeeCount × SET_PRICE
visibleSets           = MONTHLY_SETS.slice(0, workDaysCount)
```

---

## 4. Обработчики событий

| Функция                         | Действие                                           |
| ------------------------------- | -------------------------------------------------- |
| `handleWorkDaysChange(delta)`   | Изменить количество отображаемых дней (1..22)      |
| `handleBeverageChange(id, bev)` | Сменить напиток для дня                             |
| `handleToggleDay(id)`           | Включить/выключить день                             |
| `handlePortionChange(id, delta)`| Увеличить/уменьшить порции для дня (мин. 1)        |
| `handleSelectAll()`             | Включить все дни                                    |
| `handleDeselectAll()`           | Выключить все дни                                   |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (мин. 1)          |
| `handlePlaceOrder(method)`      | Оформить заказ → screen = 'success'                 |
| `handleNewOrder()`              | Сбросить всё → screen = 'catalog'                   |

---

## 5. SetDetailModal — локальное состояние

Модальное окно детализации сета ([[COMPONENTS#5-setdetailmodaltsx]]) управляется **локальным состоянием в Catalog.tsx**:

```typescript
// Catalog.tsx
const [selectedSetId, setSelectedSetId] = useState<string | number | null>(null)
```

- `setSelectedSetId(id)` — открыть модалку для сета
- `setSelectedSetId(null)` — закрыть модалку
- При закрытии: beverage не сохраняется в cartState до нажатия «Подтвердить» (ленивое обновление)

---

## 6. Поток данных (Props drilling)

```
App (state owner — useState)
  │
  ├──→ Catalog
  │     ├──→ SetCard (×N) — read-only display + callbacks
  │     └──→ SetDetailModal — локальный state + колбэк onConfirm
  │
  ├──→ Cart — read-only display + onPlaceOrder
  └──→ Success — onNewOrder callback → полный reset
```

**Роутинг**: условный рендеринг (`screen === 'catalog' && <Catalog />`).  
React Router не используется → [[ARCHITECTURE#7-маршрутизация]]

---

## 7. Сброс состояния (New Order)

```typescript
const handleNewOrder = () => {
  const reset: CartState = {}
  MONTHLY_SETS.forEach(set => {
    reset[set.id] = { beverage: 'Вода', active: true, portions: 1 }
  })
  setCartState(reset)
  setEmployeeCount(1)
  setWorkDaysCount(MAX_WORK_DAYS)
  setScreen('catalog')
}
```

**Что сбрасывается:**
- `cartState` → все дни активны, напиток «Вода», 1 порция
- `employeeCount` → 1
- `workDaysCount` → 22 (максимум)
- `screen` → `'catalog'`
