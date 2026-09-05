# ⚙️ Управление состоянием (State Management)

> Версия: 2.3  \
> Последнее обновление: 05.09.2026  \
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
| `employeeCount`  | `number`   | `1` (из localStorage, clamp [1, 500]) | Множитель стоимости (сотрудники)      |
| `cartState`      | `CartState`| `{}` (0 дней)      | Выбранные даты (`YYYY-MM-DD`) с настройками дня; **прошедшие даты исключаются** |
| `lang`           | `Lang`     | из localStorage (`lunchistan_lang`) | Текущий язык интерфейса (RU/UZ), персистится |

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

Сопоставление дата → сет меню — глобальная порядковая привязка (`getSetForDate`: `MONTHLY_SETS[(ordinal-1) % 56]`, ordinal = счёт дней от 1-го числа текущего месяца), см. [[ARCHITECTURE#6-привязка-дата-→-сет-и-правила-выбора-дат]]. Детерминировано — сет даты не зависит от выбора других дат.

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
| `handleToggleDate(date)`        | Включить/выключить день (используется корзиной: удаление строки). **Защитный слой:** прошедшие даты не включаются (`isPastDate`), удаление всегда разрешено. Резка «сегодня после 10:00» — на уровне UI ([[COMPONENTS#35-calendarmodaltsx—модалка-выбора-дат-v22]]) через `canSelectDate` |
| `handleApplySelectedDates(dates)` | 🆆 Применить подтверждённый выбор из календарной модалки: новые даты получают дефолтный конфиг, конфиги остающихся дат сохраняются, снятые — удаляются. Прошедшие даты отфильтровываются (`isPastDate`) |
| `handleBeverageChange(date, bev)` | Сменить напиток для даты                        |
| `handleSaladChange(date, salad)` | Сменить салат для даты                           |
| `handlePortionsChange(date, n)` | Увеличить/уменьшить порции для даты (мин. 1)     |
| `handleApplyBeverageToAll(bev)` | Применить напиток ко всем выбранным датам         |
| `handleApplySaladToAll(salad)`  | Применить салат ко всем выбранным датам           |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (clamp в [1, EMPLOYEE_MAX=500]) |
| `handlePlaceOrder(method)`      | Оформить заказ → POST /api/orders с массивом `days[]` → **сброс заказа** (cartState={}, employeeCount=1, `clearSavedOrder()`) → screen = 'success' c `successInfo` |
| `handleNewOrder()`              | Сбросить всё → screen = 'catalog'                   |
| `handleLangChange(newLang)`     | Сменить язык интерфейса и **сохранить в localStorage** (`lunchistan_lang`) |

### 4.1. Черновой выбор и календарная модалка (v2.1) 🆆

- Выбор дат происходит **только в модалке [[COMPONENTS#35-calendarmodaltsx—модалка-выбора-дат-v21]]** через временный `draftSelectedDays` (локальный `Set<string>` внутри модалки).
- При каждом открытии модалка монтируется заново и инициализируется текущим выбором заказа — при повторном открытии существующий выбор отображается.
- Изменения черновика не влияют на основной state заказа. Только кнопка «Подтвердить» вызывает `handleApplySelectedDates()`.
- Кнопки «Выбрать дни» и «Сбросить все» на главном экране **только открывают одну и ту же модалку**.

### 4.2. Пресеты (v2.2)

- **«Вся рабочая неделя»** — выбирает Пн–Пт конкретной недели (кнопка у строки недели; повторное нажатие снимает).
- Глобальные пресеты `2/2`, `5/2`, `6/1`, `full` работают как **toggle** (v2.2): первое нажатие добавляет даты пресета в **черновик видимого месяца** (другие месяцы не затрагиваются), повторное — снимает **ровно пресетные даты** (`togglePreset()` в CalendarModal). Вручную добавленные/снятые дни сохраняются.
- **Индикация активного пресета** (v2.2): `isPresetActive()` — set-равенство между выбором видимого месяца и результатом пресета; активная кнопка получает `.calendar__preset--active` + `aria-pressed`.
- Паттерн начинается от 1-го числа видимого месяца и применяется к последовательности Пн-Пт (реализация `buildPresetDates()` в [[ARCHITECTURE#3-типы-данных-srctypests]] / `src/lib/calendar.ts`):

```typescript
'2/2'  → работа 2 дня / выход 2 дня (цикл 4)
'5/2'  → работа 5 дней / выход 2 дня (цикл 7)
'6/1'  → работа 6 дней / выход 1 день (цикл 7)
'full' → все Пн-Пт даты видимого месяца
```

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
  │     ├──→ CalendarModal — draftSelectedDays, пресеты, навигация по месяцам, onConfirm → handleApplySelectedDates
  │     ├──→ SetCard (×MONTHLY_SETS — полное меню) — read-only display + lang
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
