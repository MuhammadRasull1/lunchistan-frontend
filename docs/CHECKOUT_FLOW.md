# 🛒 Процесс оформления заказа (Checkout Flow)

> Версия: 3.3 — дневное меню вместо ротации; заказать можно только даты с внесённым меню  \
> Последнее обновление: 17.09.2026  \
> Связанные файлы: [[B2B_RULES]], [[COMPONENTS]], [[STATE_MANAGEMENT]]

---

## 1. Общая схема

```
Catalog (Выбор сетов)
  │ onGoToCart()
  ▼
Cart (Оформление)
  │ onPlaceOrder(method)
  ▼
Success (Подтверждение)
  │ onNewOrder()
  ▼
Catalog (Новый заказ, сброс)
```

---

## 2. Экран Catalog → Cart

### 2.1. Условия перехода

- Хотя бы один день активен (`activeDays > 0`)
- Хотя бы одна порция выбрана (`totalPortions > 0`)
- 🆆 **v3.2:** на **каждый** выбранный день выбрано блюдо (`allDishesChosen`) — иначе кнопка «Оформить» (и Telegram `MainButton`) заблокирована с подсказкой `chooseDishForEveryDay`. Выбор блюда — секция «Выбранные дни» → `SetPicker` (если на дату больше одного блюда; если ровно одно — назначается автоматически, см. ниже).
- 🆆 **v3.3 (17.09.2026):** день можно добавить в подписку, только если на его дату внесено меню — `CalendarModal` блокирует остальные даты через `fetchAvailableDates` (см. [[ARCHITECTURE#62-доступность-дат-в-календаре-v33]]). Бэкенд дублирует это правило: `POST /api/orders` отклоняет (400) строки с датой/`setId`, где блюдо не было предложено именно на эту дату.
- Кнопка «Оформить предзаказ» / «Buyurtma berish» в **StickyBar**

### 2.2. StickyBar (фиксированная панель)

- Позиция: `fixed`, снизу экрана
- Содержит: количество дней, сотрудников, порций + итоговая цена
- 🆆 Текст полностью локализован: `t(lang, 'stickyBarLabel', { active, total, employees, portions })`
- Адаптация под Telegram Mini App: `flex-direction: column` на < 480px
- `backdrop-filter: blur(16px)` для полупрозрачности

---

## 3. Экран Cart (Оформление)

### 3.1. Что отображается

- **Список выбранных сетов**: день, неделя, напиток, порции на сотрудника, цена
- **Способ оплаты**: 3 варианта (локализованные названия)
- **Итоговая сумма**: жирный оранжевый текст
- **Кнопка оплаты**: «Оплатить {price}» / «{price} to'lash»

### 3.2. Детализация строки сета (v2.0)

```
🍱 Аджахури с курицей
    03.08 · Пн · 2 порц./сотр.           ← реальная дата + день недели (formatDayLabel)
    Греческий салат · Вода
                      2 × 55 000 сум
                      110 000 сум
```

- Строка строится для каждой **выбранной даты** календаря ([[STATE_MANAGEMENT#3-вычисляемые-значения-derived-state]]).
- Напиток и салат локализуются через `t()`.
- Кнопка «Удалить» (`×`) отключает день в календаре и удаляет его настройки из state.

### 3.3. Анимации (framer-motion)

- Весь блок: fade-in + slide-up (`y: 30 → 0`)
- Список сетов: stagger 0.05s
- Секции (способ оплаты, итог, кнопка): нарастающая задержка 0.1–0.4s

---

## 4. Способы оплаты (PaymentMethod)

| Метод          | Значение      | Описание (RU)              | Описание (UZ)                  | Эмодзи | По умолчанию |
| -------------- | ------------- | -------------------------- | ------------------------------ | ------ | ------------ |
| Перечислением  | `'corporate'` | Для юридических лиц        | Yuridik shaxslar uchun         | 🏢     | ✅ Да        |
| Перевод на карту| `'card'`     | P2P перевод                | Kartaga o'tkazma               | 💳     | ❌           |
| Наличными      | `'cash'`      | Наличными курьеру          | Naqd pul                       | 💵     | ❌           |

UI: три кнопки с иконками, `payment__option--active` для выбранного варианта.

---

## 5. Экран Success (Подтверждение)

### 5.1. Элементы

1. **SVG-анимация галочки** — круг рисуется за 0.6s, затем галочка за 0.4s
2. **Заголовок**: «Заказ оформлен!» / «Buyurtma qabul qilindi!»
3. **Текст**: «Спасибо! Мы уже передали заказ на кухню Lunchistan.» / «Rahmat! Buyurtmangiz Lunchistan oshxonasiga topshirildi.»
4. **Номер заказа**: `#ORD-NNNN` (случайный 4-значный, генерируется при монтировании)
5. 🆆 **Сводка заказа** (v2.7): способ оплаты, число дней × сотрудников, итоговая сумма (`paymentMethod`, `activeDays`, `employeeCount`, `totalMonthlyPrice` из `successInfo`)
6. **Кнопка**: «Сделать новый заказ» / «Yangi buyurtma» → полный сброс ([[STATE_MANAGEMENT#7-сброс-состояния-new-order]])

### 5.2. Обработка заказа (v2.0, сброс v2.7)

Главный источник данных — массив дней. Каждый выбранный день из календаря гарантированно попадает в `days[]`:

```
selectedDates (ключи cartState)
        ↓
day configuration (set + salad + beverage + portions)
        ↓
days[] (массив OrderLine с date)
        ↓
order payload
        ↓
POST /api/orders
        ↓
фиксация successInfo (method, total, employees, days)
        ↓
СБРОС ЗАКАЗА: cartState = {}, employeeCount = 1, clearSavedOrder()   ← 🆆 v2.7
        ↓
screen = 'success'
```

```typescript
const handlePlaceOrder = async (method: PaymentMethod) => {
  const lines = orderDays.map(({ date, set, item }) => {
    const portions = item?.portions ?? 1
    const totalPortions = portions * employeeCount
    const mainDish = set?.composition.find(c => c.optional !== true)?.name ?? set?.name ?? ''
    return {
      date,                       // реальная дата YYYY-MM-DD
      day: Number(date.slice(8, 10)),
      setName: set?.name,
      mainDish,
      salad: item?.salad ?? DEFAULT_SALAD,
      beverage: item?.beverage ?? 'Вода',
      portions,
      unitPrice: set?.price ?? SET_PRICE,
      lineTotal: (set?.price ?? SET_PRICE) * totalPortions,
    }
  })
  const payload = { ... }
  await submitOrder(payload)
  // 🆆 v2.7: фиксируем данные для Success ДО сброса
  setSuccessInfo({ method, total: totalMonthlyPrice, employees: employeeCount, days: lines.length })
  // 🆆 v2.7: очищаем заказ после успешной отправки — оплаченный заказ
  // не восстанавливается автоприсейвом и не может быть оплачен повторно
  setCartState({})
  setEmployeeCount(1)
  clearSavedOrder()
  setScreen('success')
}
```

> **🆆 v2.0:** вместо абстрактного `workDaysCount: 24` фронтенд отправляет **конкретные даты** (`days[].date`). Поле `workDaysCount` в payload теперь производное (`lines.length`). Каждый день в календаре имеет полный объект `{ date, mainDish, salad, beverage, portions }` — день не может быть выбран в календаре и отсутствовать в `days[]`.
>
> **🆆 v2.7:** после успешной отправки заказ принудительно очищается; экран Success получает зафиксированную сводку (`successInfo`). `isSubmitting`-гард против двойной отправки сохранён.

⚠️ **Важно:** отправка на сервер через `submitOrder()` ([[ARCHITECTURE]] / `src/lib/api.ts`), `axios.post(API_BASE_URL + '/api/orders')`.

---

## 6. Поля, ожидающие реализации

Форма заказа в `Cart.tsx` **минимальна**. Бизнес-логика подразумевает следующие поля:

| Поле                     | Описание                              | Статус       |
| ------------------------ | ------------------------------------- | ------------ |
| Имя / ФИО контактного лица | Кто оформляет заказ                  | ❌ Не реализовано |
| Телефон                  | Контактный номер телефона             | ❌ Не реализовано |
| Адрес доставки           | Куда доставлять обеды                 | ❌ Не реализовано |
| Окно времени доставки    | Желаемое время доставки               | ❌ Не реализовано |
| ИНН / Название компании  | Для юрлиц (при оплате перечислением)  | ❌ Не реализовано |
| Комментарий              | Дополнительные пожелания              | ❌ Не реализовано |

---

## 7. Потенциальные улучшения

- 🟡 Хранение способа оплаты в `App.tsx` (сейчас локальный `useState` в Cart)
- 🟢 Онлайн-оплата (сейчас — только фиксация способа, статус ведётся вручную владельцем)

---

## 8. 🆕 v3 — заказ сохраняется в БД + контакты

Бэкенд `lunchistan-backend` переведён на PostgreSQL (Neon). `POST /api/orders` теперь
**создаёт запись** `orders` + `order_lines`, а не только шлёт чек в Telegram.

### 8.1. Два режима (по наличию токена компании)

| | С входом (компания в кабинете) | Без входа (гость) |
|---|---|---|
| `Authorization: Bearer` | есть (интерсептор `api.ts` из `getToken()`) | нет |
| В БД | `orders.is_lead = false`, `source = 'bulk'`, привязка к `company_id` | `is_lead = true`, `source = 'lead'`, без компании |
| Обязательно в форме | ничего (данные из аккаунта) | `contactName` + `contactPhone` |
| Экран Success | «Заказ оформлен» + номер `ORD-NNNN` + бейдж статуса | «Заявка принята» — «менеджер свяжется» |

### 8.2. Контактная форма (`Cart.tsx`)

Секция «Контакты для доставки» перед способом оплаты: `contactName`, `contactPhone`
(гостю обязательны), `companyName`, `address`, `comment` (всегда необязательны).
Для вошедшей компании имя/телефон/компания предзаполняются из `user` (пропс из `App.tsx`).
`canCheckout` дополнительно требует `contactOk` (гость: имя ≥ 2 симв., телефон ≥ 5 симв.) 🆆 и `allDishesChosen` (на каждый день `item.setId !== null`).

### 8.3. Payload и ответ

```
POST /api/orders
  { employeeCount, paymentMethod, totalMonthlyPrice,
    lines: [{ date, setId, setName, mainDish, salad, beverage, portions, unitPrice, lineTotal }],
    contactName?, contactPhone?, companyName?, address?, comment? }
→ { success, orderId, orderNumber: "ORD-0007", status: "new", isLead, telegramSent }
```

`App.tsx` кладёт `orderNumber` / `status` / `isLead` в `successInfo` → экран Success
([[COMPONENTS#7-successtsx]]).

### 8.4. Статусы заказа

`new → confirmed → in_progress → delivered → paid` (+ `cancelled`).
Меняет владелец в разделе «Сводка» (`OrderDetailSheet`, [[COMPONENTS#13-раздел-сводка-владельца]]).
Хелперы — `src/lib/orderStatus.ts` (`statusLabel`, `statusColor`, `nextStatuses`).

### 8.5. Заказы компании

`GET /api/my/orders` → раздел «Заказы» в кабинете компании (`MyOrdersView`, read-only).

### 8.6. 🆆 Отклонение заказа с «протухшей» строкой (17.09.2026)

`POST /api/orders` возвращает 400, если строка ссылается на дату/`setId`, которых нет в дневном
меню этой даты (например, владелец убрал блюдо из дня уже после того, как клиент его выбрал, но
до отправки заказа). Специального текста ошибки на фронте нет — `handlePlaceOrder` (`App.tsx`)
ловит любую ошибку `submitOrder` единым `catch` и показывает `orderError` (`showTelegramAlert`),
`cartState` при этом не сбрасывается — клиент может переоткрыть `SetPicker` и выбрать другое
блюдо. UI не ломается ни при каком статусе ответа.

## Изменения 25.09.2026
- **Кнопка «Оформить предзаказ»** прячется только внутри настоящего Telegram (`isInsideTelegram()` в `lib/telegram.ts` — непустая `initData`), где её заменяет MainButton. Раньше пряталась везде, где загружен скрипт Telegram, и в обычном браузере оформить заказ было нельзя. См. [[COMPONENTS]].
- **Телефон в корзине** не подставляется из профиля, если это служебный `user_<hex>` (регистрация без номера). Сервер тоже не пишет его в `contact_phone`.
- **Склонения** в сводке корзины и экране успеха — через `countLabel()` из `locales/translations.ts`.
- **Пароль** — минимум 6 символов (как `MIN_PASSWORD` на сервере).
