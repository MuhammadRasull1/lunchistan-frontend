# ⚙️ Управление состоянием (State Management)

> Версия: 2.5 — дневное меню вместо ротации (`dayMenus`, авто-назначение при 1 блюде)  \
> Последнее обновление: 17.09.2026  \
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
| `cartState`      | `CartState`| `{}` (0 дней)      | Выбранные даты (`YYYY-MM-DD`) с настройками дня; **прошедшие даты и даты без внесённого меню исключаются** |
| 🆆 `dayMenus`     | `Record<string, LunchSet[]>` | `{}` | Кеш «меню по датам» (`fetchDayMenu`), подгружается по каждой дате из `cartState` |
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
  setId: number | null        // 🆆 v3.2 выбранное клиентом блюдо; null — не выбрано («токен» не потрачен)
}

// Пример:
{
  "2026-08-03": { active: true, portions: 2, beverage: "Вода", salad: "Греческий салат", setId: 5 },
  "2026-08-04": { active: true, portions: 1, beverage: "Компот в ассортименте", salad: "Оливье с мясом", setId: null },
}
```

🆆 **v3.2:** блюдо дня — это `item.setId` (выбор клиента через `SetPicker`), резолвится `getSetById`. `makeDefaultDay()` создаёт день с `setId: null`. Сохранёнка — `lunchistan:order:v3` ([[STATE_MANAGEMENT#7-сброс-состояния-new-order]]).

🆆 **v2.5 (17.09.2026):** блюда бизнеса не повторяются день в день — ротация `getSetForDate` (`MONTHLY_SETS[(ordinal-1) % 56]`) была неверной моделью реальности и **удалена** из `src/lib/menu.ts`. Вместо неё:
- `dayMenus[date]` (кеш в `App.tsx`, подгружается `fetchDayMenu(date)` при появлении даты в `cartState`) — блюда, реально предложенные на эту дату.
- Если `dayMenus[date].length === 1` — единственное блюдо назначается автоматически: `cartState[date].setId` проставляется этим id, как только кеш пришёл (`ensureDayMenu` в `App.tsx`), без похода в `SetPicker`.
- Если блюд несколько — прежний флоу ручного выбора, но `SetPicker` показывает только `dayMenus[date]`, а не весь каталог.
- Плейсхолдер `SelectedDay.set` для ещё не выбранного дня — теперь `dayMenus[date]?.[0] ?? menu[0]` (первое блюдо дневного меню, если уже загружено).

---

## 3. Вычисляемые значения (Derived State)

```typescript
selectedDates            = Object.keys(cartState).sort()            // единственный источник количества дней
orderDays: SelectedDay[] = selectedDates.map(date => {              // 🆆 v2.5
  const chosenSet = getSetById(menu, cartState[date].setId)
  return { date, set: chosenSet ?? dayMenus[date]?.[0] ?? menu[0], chosen: chosenSet !== undefined, item: cartState[date] }
})
allDishesChosen          = orderDays.length > 0 && orderDays.every(d => d.chosen)   // 🆆 v3.2 gate оформления
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
| `handleToggleDate(date)`        | Включить/выключить день (используется корзиной: удаление строки). **Защитный слой:** прошедшие даты не включаются (`isPastDate`), даты с уже известным пустым дневным меню (`dayMenus[date]?.length === 0`) не включаются, удаление всегда разрешено. Резка «сегодня после 10:00» и доступность меню — на уровне UI ([[COMPONENTS#35-calendarmodaltsx—модалка-выбора-дат-v22]]) через `canPick` |
| `handleApplySelectedDates(dates)` | 🆆 Применить подтверждённый выбор из календарной модалки: новые даты получают дефолтный конфиг, конфиги остающихся дат сохраняются, снятые — удаляются. Прошедшие даты и даты с известным пустым дневным меню отфильтровываются (`isPastDate`, `dayMenus`) |
| 🆆 `ensureDayMenu(date)`         | Подгружает `dayMenus[date]` через `fetchDayMenu` (дедуп через `fetchingDaysRef`); если пришло ровно 1 блюдо — сразу проставляет его `setId` в `cartState[date]` (если ещё не выбрано) |
| `handleBeverageChange(date, bev)` | Сменить напиток для даты                        |
| `handleSaladChange(date, salad)` | Сменить салат для даты                           |
| 🆆 `handleSetChange(date, setId)` | Клиент выбрал блюдо на день («потратил токен») — `cartState[date].setId = setId` |
| `handlePortionsChange(date, n)` | Увеличить/уменьшить порции для даты (мин. 1)     |
| `handleApplyBeverageToAll(bev)` | Применить напиток ко всем выбранным датам         |
| `handleApplySaladToAll(salad)`  | Применить салат ко всем выбранным датам           |
| `handleEmployeeCountChange(n)`  | Установить количество сотрудников (clamp в [1, EMPLOYEE_MAX=500]) |
| `handlePlaceOrder(method)`      | 🆆 v3.2: гард `allDishesChosen` (иначе alert + выход). Оформить → POST /api/orders (`lines[].setId` — выбранное блюдо) → **сброс заказа** (cartState={}, employeeCount=1, `clearSavedOrder()`) → screen = 'success' c `successInfo` |
| `handleNewOrder()`              | Сбросить всё → screen = 'catalog'                   |
| `handleLangChange(newLang)`     | Сменить язык интерфейса и **сохранить в localStorage** (`lunchistan_lang`) |

### 4.1. Черновой выбор и календарная модалка (v2.1) 🆆

- Выбор дат происходит **только в модалке [[COMPONENTS#35-calendarmodaltsx—модалка-выбора-дат-v21]]** через временный `draftSelectedDays` (локальный `Set<string>` внутри модалки).
- При каждом открытии модалка монтируется заново и инициализируется текущим выбором заказа — при повторном открытии существующий выбор отображается.
- Изменения черновика не влияют на основной state заказа. Только кнопка «Подтвердить» вызывает `handleApplySelectedDates()`.
- Кнопки «Выбрать дни» и «Сбросить все» на главном экране **только открывают одну и ту же модалку**.

### 4.2. Пресеты (v2.2)

- **«Вся неделя»** — выбирает **все дни Пн..Вс** конкретной недели (кнопка у строки недели; недоступные отсекает `canSelectDate`; повторное нажатие снимает).
- Глобальные пресеты `2/2`, `5/2`, `6/1`, `full` работают как **toggle** (v2.2): первое нажатие добавляет даты пресета в **черновик видимого месяца** (другие месяцы не затрагиваются), повторное — снимает **ровно пресетные даты** (`togglePreset()` в CalendarModal). Вручную добавленные/снятые дни сохраняются.
- **Индикация активного пресета** (v2.2): `isPresetActive()` — set-равенство между выбором видимого месяца и результатом пресета; активная кнопка получает `.calendar__preset--active` + `aria-pressed`.
- Паттерн применяется к **календарным дням** месяца (реализация `buildPresetDates()` в [[ARCHITECTURE#3-типы-данных-srctypests]] / `src/lib/calendar.ts`; `getSelectableDates` удалён, вместо него `allMonthDates()`):

```typescript
'2/2'  → цикл «работа 2 дня / выход 2 дня» по ВСЕМ дням месяца (якорь: 1-е число = день №1; сб/вс в цикле)
'5/2'  → работа пн–пт, выход сб–вс (по дню недели)
'6/1'  → работа пн–сб, выход вс (по дню недели)
'full' → все календарные дни видимого месяца
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
