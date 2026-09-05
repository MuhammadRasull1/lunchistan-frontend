# 🛒 Процесс оформления заказа (Checkout Flow)

> Версия: 2.7  \
> Последнее обновление: 05.09.2026  \
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
- 🟡 Валидация обязательных полей перед отправкой
- 🟢 Отправка данных на бэкенд (REST API)
- 🟢 Telegram-уведомление о заказе
