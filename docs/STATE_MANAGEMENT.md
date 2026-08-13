# ⚙️ Управление состоянием (State Management)

> Версия: 2.0  \
> Последнее обновление: 13.08.2026  \
> Связанные файлы: [[ARCHITECTURE]], [[COMPONENTS]], [[B2B_RULES]]

---

## 1. Принцип

**Единый источник истины (Single Source of Truth)** — всё состояние хранится в `App.tsx`.  
Дочерние компоненты — stateless, получают данные через `props` и сообщают о действиях через колбэки.

> **v2.0 (календарь дат):** количество рабочих дней определяется **исключительно** набором выбранных дат (`selectedDates` = ключи `cartState`). Абстрактный счётчик `workDaysCount` удалён. Выбранная дата хранит полный конфиг дня; отключение дня удаляет его настройки из state.

---

## 2. Структура `App.tsx`

### 2.1. Основные переменные состояния

| Переменная       | Тип        | Начальное значение | Описание                              |
| ---------------- | ---------- | ------------------ | ------------------------------------- |
| `screen`         | `Screen`   | `'catalog'`        | Текущий экран (`catalog` / `cart` / `success`) |
| `employeeCount`  | `number`   | `1`                | Множитель стоимости (сотрудники)      |
| `cartState`      | `CartState`| `{}` (0 дней)      | Выбранные даты (`YYYY-MM-DD`) с настройками дня |
| `lang`           | `Lang`     | `'ru'`             | Текущий язык интерфейса (RU/UZ)       |

### 2.2. CartState — детальная структура

Ключом дня является **дата** в формате `YYYY-MM-DD` (наличие ключа = день выбран).

```typescript
type CartState = Record<string, CartItem>

interface CartItem {
  active: boolean             // всегда true для выбранных дней
  portions: number            // порций на одного сотрудника
  beverage: Beverage          // 'Вода' | 'Компот в ассортименте'
  salad: Salad                // выбранный салат
}

// Пример:
{
  "2026-08-03": { active: true, portions: 2, beverage: "Вода",                   salad: "Греческий салат" },
  "2026-08-04": { active: true, portions: 1, beverage: "Компот в ассортименте",   salad: "Оливье с мясом" },
  "2026-08-07": { active: true, portions: 1, beverage: "Вода",                   salad: "Морковча" }
}
```

Сопоставление дата → сет меню стабильно по числу месяца (`MONTHLY_SETS[день-1]`), см. [[COMPONENTS#calendartsx]].

---

## 3. Вычисляемые значения (Derived State)

```typescript
selectedDates            = Object.keys(cartState).sort()            // единственный источник количества дней
orderDays: SelectedDay[] = selectedDates.map(date => ({ date, set: getSetForDate(date), item: cartState[date] }))
activeDays               = selectedDates.length
totalPortionsFromActive  = Σ(portions каждого выбранного дня)
totalItems               = totalPortionsFromActive × employeeCount
totalMonthlyPrice        = totalPortionsFromActive × employeeCount × SET_PRICE
```

> **v2.0:** цена рассчитывается от `selectedDates.length` (количество выбранных дней) × порции × сотрудники × цена сета. Старый источник `workDaysCount` удалён.

---

## 4. Обработчики событий

| Функция                         | Действие                                           |
| ------------------------------- | ------------------------------------------------- |
| `handleToggleDate(date)`        | Включить/выключить день; при отключении настройки дня (салат/напиток/порции) удаляются из state |
| `handleBeverageChange(date, bev)` | Сменить напиток для даты                        |
| `handleSaladChange(date, salad)` | Сменить салат для даты                           |
| `handlePortionsChange(date, n)` | Увеличить/уменьшить порции для даты (мин. 1)     |
| `handleApplyBeverageToAll(bev)` | Применить напиток ко всем выбранным датам         |
| `handleApplySaladToAll(salad)`  | Применить салат ко всем выбранным датам           |
| `handleSelectAllInMonth(monthKey)` | Выбрать все допустимые даты (Пн-Пт) видимого месяца |
| `handleDeselectAllInMonth(monthKey)` | Удалить выбор только в пределах видимого месяца |
| `handleApplyPreset(pattern, monthKey)` | Очистить весь выбор и построить график по пресету (2/2, 5/2, 6/1, full) от 1-го числа видимого месяца |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (мин. 1)          |
| `handlePlaceOrder(method)`      | Оформить заказ → POST /api/orders с массивом `days[]` → screen = 'success' |
| `handleNewOrder()`              | Сбросить всё → screen = 'catalog'                   |
| `handleLangChange(newLang)`     | Сменить язык интерфейса                          |

### 4.1. Пресеты графика (v2.0)

Паттерн начинается от **даты начала подписки** = 1-е число видимого месяца (день №1) и применяется к последовательности допустимых дней (Пн-Пт). Выходные не выбираются. Реализация — `buildPresetDates()` в [[ARCHITECTURE#3-типы-данных-srctypests]] (фактически `src/lib/calendar.ts`):

```typescript
'2/2'  → работа 2 дня / выход 2 дня (цикл 4)
'5/2'  → работа 5 дней / выход 2 дня (цикл 7)
'6/1'  → работа 6 дней / выход 1 день (цикл 7)
'full' → все допустимые даты месяца
```

Применение пресета **очищает текущий список выбранных дат целиком** и строит новый график в видимом месяце.

---

## 5. SetDetailModal — локальное состояние

Модальное окно детализации сета ([[COMPONENTS#5-setdetailmodaltsx]]) управляется **локальным состоянием в Catalog.tsx**:

```typescript
// Catalog.tsx
const [selectedDate, setSelectedDate] = useState<string | null>(null)
```

- `setSelectedDate(date)` — открыть модалку для даты; конфиг читается из `orderDays` (по дате)
- `setSelectedDate(null)` — закрыть модалку
- Изменения салата/напитка/порций применяются к дате немедленно (через колбэки в App)

---

## 6. Поток данных (Props drilling)

```
App (state owner — useState)
  │  lang → Catalog, Cart, Success
  │
  ├──→ Catalog
  │     ├──→ Calendar — selectedDates, пресеты, навигация по месяцам
  │     ├──→ SetCard (×selectedDates) — read-only display + lang
  │     ├──→ SetDetailModal — lang + dateLabel + настройки даты
  │     └──→ Stepper (×1: сотрудники)
  │
  ├──→ Cart — lang + orderDays + onPlaceOrder
  └──→ Success — lang + onNewOrder callback → полный reset
```

**Роутинг**: условный рендеринг (`screen === 'catalog' && <Catalog />`).  
React Router не используется → [[ARCHITECTURE#4-маршрутизация]]

---

## 7. Сброс состояния (New Order)

```typescript
const handleNewOrder = () => {
  setCartState({})   // 0 выбранных дней
  setEmployeeCount(1)
  setScreen('catalog')
  clearSavedOrder()
}
```

**Что сбрасывается:**
- `cartState` → `{}` (первый запуск/новый заказ — ни один день не выбран)
- `employeeCount` → 1
- `screen` → `'catalog'`
- `lang` **не сбрасывается** (язык сохраняется между заказами)
