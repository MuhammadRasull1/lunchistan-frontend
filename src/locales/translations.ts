export type Lang = 'ru' | 'uz'

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    // Brand & Header
    brand: 'Lunchistan',
    headerTitle: 'Корпоративная подписка на месяц',
    headerSubtitle: 'Сбалансированные комплексные обеды для вашей команды — до {n} рабочих дней',

    // Calculator
    calculatorTitle: 'Калькулятор стоимости',
    workingDays: 'Рабочих дней в месяце',
    employees: 'Количество сотрудников',
    selectAll: '✅ Выбрать все {n} дней',
    deselectAll: '❌ Сбросить все',
    selectedDays: 'Выбрано дней',
    employeesShort: 'Сотрудников',
    totalPortions: 'Всего порций (на сотр.)',
    totalPortionsAll: 'Всего порций (на всех)',
    pricePerPortion: 'Цена одной порции',
    totalToPay: 'Итого к оплате',
    menuTitle: 'Меню на месяц ({n} дней)',
    from: 'из',
    stepDecrease: 'Уменьшить',
    stepIncrease: 'Увеличить',
    order: 'Оформить предзаказ',
    customizedDaysLabel: 'Дней с изменениями',

    // Set categories
    categoryAll: 'Все',
    categoryMeat: 'Мясо',
    categoryChicken: 'Курица',
    categoryPoultry: 'Птица',
    categoryFish: 'Рыба',

    // Set card
    perPortion: 'за порцию',

    // Ingredients
    salad: 'Салат',
    flatbread: 'Лепёшка',
    drink: 'Напиток',
    mainDishLocked: 'Основное блюдо нельзя исключить',
    applyBeverageToAll: 'Применить выбранный напиток ко всем дням',
    applySaladToAll: 'Применить выбранный салат ко всем дням',
    incompleteSelectionHint: 'Выберите салат и напиток для каждого дня, чтобы продолжить',

    // Detail modal
    close: 'Закрыть',
    beverage: 'Напиток',
    water: 'Вода',
    compote: 'Компот',
    nutritionalValue: 'Пищевая ценность на порцию',
    proteins: 'Белки',
    fats: 'Жиры',
    carbs: 'Углеводы',
    calories: 'Калории',
    priceLabel: 'Цена за порцию',
    choose: 'Выбрать',

    // Cart
    back: '← Назад',
    cartTitle: 'Оформление заказа',
    noSelectedDays: 'Нет выбранных дней',
    days: 'дней',
    employeesPlural: 'сотрудников',
    portionsPlural: 'порций',
    paymentMethod: 'Способ оплаты',
    corporate: 'Перечислением (Для юрлиц)',
    card: 'Перевод на карту (P2P)',
    cash: 'Наличными курьеру',
    pay: 'Оплатить {price}',
    submitting: 'Отправка…',
    day: 'День',
    portionsPerEmployee: 'порц./сотр.',
    portionsLabel: 'Порций на сотрудника',
    removeFromCart: 'Удалить из корзины',

    // Success
    orderTitle: 'Заказ оформлен!',
    orderText: 'Спасибо! Мы уже передали заказ на кухню Lunchistan.',
    orderNumber: 'Номер заказа',
    newOrder: 'Сделать новый заказ',

    // Sticky bar label
    stickyBarLabel: '{active}/{total} дн. · {employees} чел. · {portions} порц.',

    // Order alert
    orderAlert: 'Предзаказ на {employees} сотрудников оформлен!\nСпособ оплаты: {method}\nОбщая сумма: {price}',
    corporateLabel: 'Перечислением (Для юрлиц)',
    cardLabel: 'Перевод на карту (P2P)',
    cashLabel: 'Наличными курьеру',
    orderError: 'Не удалось оформить заказ. Попробуйте ещё раз.',

    // Language
    langRu: 'RU',
    langUz: 'UZ',
  },

  uz: {
    // Brand & Header
    brand: 'Lunchistan',
    headerTitle: 'Bir oylik korporativ obuna',
    headerSubtitle: 'Jamoangiz uchun muvozanatli tushliklar — {n} ish kunigacha',

    // Calculator
    calculatorTitle: 'Narx hisoblagichi',
    workingDays: 'Oylik ish kunlari',
    employees: 'Xodimlar soni',
    selectAll: '✅ Barcha {n} kunni tanlash',
    deselectAll: '❌ Bekor qilish',
    selectedDays: 'Tanlangan kunlar',
    employeesShort: 'Xodimlar',
    totalPortions: 'Jami porsiyalar (1 xodimga)',
    totalPortionsAll: 'Jami porsiyalar (barchaga)',
    pricePerPortion: 'Bir porsiya narxi',
    totalToPay: "To'lov summasi",
    menuTitle: "Oylik menyu ({n} kun)",
    from: 'dan',
    stepDecrease: 'Kamaytirish',
    stepIncrease: "Oshirish",
    order: 'Buyurtma berish',
    customizedDaysLabel: "O'zgartirilgan kunlar",

    // Set categories
    categoryAll: 'Barchasi',
    categoryMeat: "Go'sht",
    categoryChicken: 'Tovuq',
    categoryPoultry: 'Parranda',
    categoryFish: 'Baliq',

    // Set card
    perPortion: "porsiya uchun",

    // Ingredients
    salad: 'Salat',
    flatbread: 'Non',
    drink: 'Ichimlik',
    mainDishLocked: "Asosiy taomni chiqarib bo'lmaydi",
    applyBeverageToAll: "Tanlangan ichimlikni barcha kunlarga qo'llash",
    applySaladToAll: "Tanlangan salatni barcha kunlarga qo'llash",
    incompleteSelectionHint: "Davom etish uchun har bir kun uchun salat va ichimlik tanlang",

    // Detail modal
    close: 'Yopish',
    beverage: 'Ichimlik',
    water: 'Suv',
    compote: 'Kompot',
    nutritionalValue: "Bir porsiyaning ozuqaviy qiymati",
    proteins: 'Oqsillar',
    fats: "Yog'lar",
    carbs: 'Uglevodlar',
    calories: 'Kaloriyalar',
    priceLabel: 'Porsiya narxi',
    choose: 'Tanlash',

    // Cart
    back: '← Orqaga',
    cartTitle: "Buyurtma rasmiylashtirish",
    noSelectedDays: 'Kunlar tanlanmagan',
    days: 'kun',
    employeesPlural: 'xodim',
    portionsPlural: 'porsiya',
    paymentMethod: "To'lov usuli",
    corporate: "Ko'chirma orqali (Yuridik shaxslar uchun)",
    card: "Kartaga o'tkazma (P2P)",
    cash: "Naqd pul",
    pay: "{price} to'lash",
    submitting: 'Yuborilmoqda…',
    day: 'Kun',
    portionsPerEmployee: 'pors./xod.',
    portionsLabel: 'Xodimga porsiya',
    removeFromCart: "Savatdan o'chirish",

    // Success
    orderTitle: "Buyurtma qabul qilindi!",
    orderText: "Rahmat! Buyurtmangiz Lunchistan oshxonasiga topshirildi.",
    orderNumber: "Buyurtma raqami",
    newOrder: 'Yangi buyurtma',

    // Sticky bar label
    stickyBarLabel: '{active}/{total} kun · {employees} xodim · {portions} pors.',

    // Order alert
    orderAlert: "{employees} xodim uchun buyurtma rasmiylashtirildi!\nTo'lov usuli: {method}\nUmumiy summa: {price}",
    corporateLabel: "Ko'chirma orqali",
    cardLabel: "Kartaga o'tkazma",
    cashLabel: "Naqd pul",
    orderError: "Buyurtmani rasmiylashtirib bo'lmadi. Qaytadan urinib ko'ring.",

    // Language
    langRu: 'RU',
    langUz: 'UZ',
  },
}

export function t(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key]
  if (text === undefined) {
    text = translations.ru[key] ?? key
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

/** Локализация стандартных ингредиентов; названия блюд остаются на русском */
export function localizeIngredient(lang: Lang, name: string): string {
  const map: Record<string, string> = {
    Салат: t(lang, 'salad'),
    Лепёшка: t(lang, 'flatbread'),
    Напиток: t(lang, 'drink'),
  }
  return map[name] ?? name
}
