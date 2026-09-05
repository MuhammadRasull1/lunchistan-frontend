export type Lang = 'ru' | 'uz'

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    // Brand & Header
    brand: 'Lunchistan',
    headerTitle: 'Корпоративная подписка на месяц',
    headerSubtitle: 'Сбалансированные комплексные обеды для вашей команды — полное меню на 2 месяца ({n} сетов)',

    // Calculator
    calculatorTitle: 'Калькулятор стоимости',
    calendarTitle: 'Календарь рабочих дней',
    calendarSubtitle: 'Отметьте даты доставки обедов в этом месяце',
    preset22: '2/2',
    preset52: '5/2',
    preset61: '6/1',
    presetFull: 'Весь месяц',
    calendarPrevMonth: 'Предыдущий месяц',
    calendarNextMonth: 'Следующий месяц',
    noDatesSelected: 'Выберите даты в календаре, чтобы собрать меню',
    workingDays: 'Рабочих дней в месяце',
    employees: 'Количество сотрудников',
    selectAll: 'Выбрать все {n} дней',
    deselectAll: 'Сбросить все',
    chooseDays: 'Выбрать дни',
    calendarModalTitle: 'Выбор дат доставки',
    calendarLockedHint: 'Прошедшие даты недоступны; сегодня можно заказать до {n}:00',
    weekWorkPreset: 'Вся неделя',
    confirm: 'Подтвердить',
    noDatesTitle: 'Даты ещё не выбраны',
    selectedDays: 'Выбрано дней',
    employeesShort: 'Сотрудников',
    totalPortions: 'Всего порций (на сотр.)',
    totalPortionsAll: 'Всего порций (на всех)',
    pricePerPortion: 'Цена одной порции',
    totalToPay: 'Итого к оплате',
    menuTitle: 'Меню на 2 месяца ({n} сетов)',
    from: 'из',
    stepDecrease: 'Уменьшить',
    stepIncrease: 'Увеличить',
    order: 'Оформить предзаказ',
    customizedDaysLabel: 'Дней с изменениями',

    // Set categories
    categoryAll: 'Все',
    categoryHot: 'Горячие блюда',
    categorySalad: 'Салаты',
    categorySide: 'Гарниры',
    categoryFastfood: 'Фастфуд',
    categoryAppetizer: 'Закуски',
    categorySoup: 'Супы',

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
    chooseSalad: 'Выбрать салат',
    saladModalTitle: 'Выбор салата',
    comingSoon: 'Скоро',

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
    back: 'Назад',
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
    orderTitle: 'Заказ оформлен',
    orderText: 'Спасибо. Мы уже передали заказ на кухню Lunchistan.',
    orderNumber: 'Номер заказа',
    newOrder: 'Сделать новый заказ',

    // Sticky bar label
    stickyBarLabel: '{active} дн. · {employees} чел. · {portions} порц.',

    // Order alert
    orderAlert: 'Предзаказ на {employees} сотрудников оформлен.\nСпособ оплаты: {method}\nОбщая сумма: {price}',
    corporateLabel: 'Перечислением (Для юрлиц)',
    cardLabel: 'Перевод на карту (P2P)',
    cashLabel: 'Наличными курьеру',
    orderError: 'Не удалось оформить заказ. Попробуйте ещё раз.',

    // Language
    langRu: 'RU',
    langUz: 'UZ',

    // Auth
    authTitle: 'Вход в Lunchistan',
    authSubtitle: 'Корпоративные обеды для вашей команды',
    phone: 'Телефон',
    password: 'Пароль',
    name: 'Имя',
    companyName: 'Название компании',
    companyCode: 'Код компании',
    loginLabel: 'Войти',
    registerLabel: 'Зарегистрироваться',
    switchToRegister: 'Нет аккаунта — создать',
    switchToLogin: 'Уже есть аккаунт — войти',
    createCompany: 'Создать компанию (менеджер)',
    createCompanyHint: 'Первый вход создаёт компанию, дальше сотрудники входят по коду компании',
    companyCodeLabel: 'Есть код компании?',
    registerEmployeeHint: 'Введите код компании, чтобы присоединиться к своему коллективу',
    companyCodePlaceholder: 'Например: ABC123',
    logout: 'Выйти',
    authError: 'Не удалось войти. Проверьте данные',

    // Employee — мои дни
    myDays: 'Мои дни',
    myDaysSubtitle: 'Сколько дней выбрал — столько токенов на выбор блюда',
    chosenSets: 'выбрано блюд',
    chooseSet: 'Выбрать блюдо',
    changeSet: 'Изменить блюдо',
    pickSetForDate: 'Блюдо на {date}',
    setPickTitle: 'Выберите блюдо',
    availableSets: 'Всего в каталоге: {n}',
    defaultSetNote: 'Не выбрано — по умолчанию будет {name}',
    dayLocked: 'Этот день уже закрыт',
    editingDisabledHint: 'Прошедшие дни и «сегодня» после 10:00 изменять нельзя',
    myDaysEmpty: 'Дни не выбраны. Нажмите «Выбрать дни», чтобы назначить доставку',
    chooseDates: 'Выбрать дни',
    closeModal: 'Закрыть',
    menu2Months: 'Меню',
    searchSets: 'Поиск по каталогу…',

    // Manager
    managerTitle: 'Менеджер · подтверждение',
    managerSubtitle: 'Сводка заказов на день',
    scheduled: 'Запланировано порций',
    totalEmployees: 'Сотрудников в компании',
    waiting: 'По умолчанию',
    perPortions: '{count} × {name}',
    confirmDay: 'Подтвердить заказ на день',
    dayConfirmed: 'День подтверждён',
    dayLockedBadge: 'День закрыт',
    reportEmpty: 'На этот день никто не запланирован',
    confirmSuccess: 'Заказ на день подтверждён. Чек отправлен в Telegram.',
    totalSum: 'Итого',
  },

  uz: {
    // Brand & Header
    brand: 'Lunchistan',
    headerTitle: 'Bir oylik korporativ obuna',
    headerSubtitle: "Jamoangiz uchun muvozanatli tushliklar — 2 oylik to'liq menyu ({n} set)",

    // Calculator
    calculatorTitle: 'Narx hisoblagichi',
    calendarTitle: 'Ish kunlari taqvimi',
    calendarSubtitle: 'Shu oy uchun tushlik yetkazib berish sanalarini belgilang',
    preset22: '2/2',
    preset52: '5/2',
    preset61: '6/1',
    presetFull: 'Butun oy',
    calendarPrevMonth: 'Oldingi oy',
    calendarNextMonth: 'Keyingi oy',
    noDatesSelected: "Taqvimda sanalarni tanlang, menyu shakllanadi",
    workingDays: 'Oylik ish kunlari',
    employees: 'Xodimlar soni',
    selectAll: 'Barcha {n} kunni tanlash',
    deselectAll: 'Bekor qilish',
    chooseDays: 'Kunlarni tanlash',
    calendarModalTitle: 'Yetkazib berish sanalarini tanlash',
    calendarLockedHint: "O'tgan sanalar mavjud emas; bugun soat {n}:00 gacha buyurtma berish mumkin",
    weekWorkPreset: "To'liq hafta",
    confirm: 'Tasdiqlash',
    noDatesTitle: "Sanalar hali tanlanmagan",
    selectedDays: 'Tanlangan kunlar',
    employeesShort: 'Xodimlar',
    totalPortions: 'Jami porsiyalar (1 xodimga)',
    totalPortionsAll: 'Jami porsiyalar (barchaga)',
    pricePerPortion: 'Bir porsiya narxi',
    totalToPay: "To'lov summasi",
    menuTitle: "2 oylik menyu ({n} set)",
    from: 'dan',
    stepDecrease: 'Kamaytirish',
    stepIncrease: "Oshirish",
    order: 'Buyurtma berish',
    customizedDaysLabel: "O'zgartirilgan kunlar",

    // Set categories
    categoryAll: 'Barchasi',
    categoryHot: 'Issiq taomlar',
    categorySalad: 'Salatlar',
    categorySide: 'Garnirlar',
    categoryFastfood: 'Fastfud',
    categoryAppetizer: 'Gazaklar',
    categorySoup: "Sho'rvalar",

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
    chooseSalad: 'Salat tanlash',
    saladModalTitle: 'Salat tanlovi',
    comingSoon: 'Tez orada',

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
    back: 'Orqaga',
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
    orderTitle: "Buyurtma qabul qilindi",
    orderText: "Rahmat. Buyurtmangiz Lunchistan oshxonasiga topshirildi.",
    orderNumber: "Buyurtma raqami",
    newOrder: 'Yangi buyurtma',

    // Sticky bar label
    stickyBarLabel: '{active} kun · {employees} xodim · {portions} pors.',

    // Order alert
    orderAlert: "{employees} xodim uchun buyurtma rasmiylashtirildi.\nTo'lov usuli: {method}\nUmumiy summa: {price}",
    corporateLabel: "Ko'chirma orqali",
    cardLabel: "Kartaga o'tkazma",
    cashLabel: "Naqd pul",
    orderError: "Buyurtmani rasmiylashtirib bo'lmadi. Qaytadan urinib ko'ring.",

    // Language
    langRu: 'RU',
    langUz: 'UZ',

    // Auth
    authTitle: 'Lunchistan-ga kirish',
    authSubtitle: "Kompaniyangiz uchun korporativ tushliklar",
    phone: 'Telefon',
    password: 'Parol',
    name: 'Ism',
    companyName: 'Kompaniya nomi',
    companyCode: "Kompaniya kodi",
    loginLabel: 'Kirish',
    registerLabel: "Ro'yxatdan o'tish",
    switchToRegister: 'Hisob yo\'q — yaratish',
    switchToLogin: 'Hisob bor — kirish',
    createCompany: 'Kompaniya yaratish (menejer)',
    createCompanyHint: "Birinchi kirish kompaniyani yaratadi, keyin xodimlar kompaniya kodi orqali kiradi",
    companyCodeLabel: "Kompaniya kodi bormi?",
    registerEmployeeHint: "Kollektiv jag'iga qo'shilish uchun kompaniya kodini kiriting",
    companyCodePlaceholder: 'Masalan: ABC123',
    logout: 'Chiqish',
    authError: 'Kirish amalga oshmadi. Ma\'lumotlarni tekshiring',

    // Employee — kunlarim
    myDays: 'Mening kunlarim',
    myDaysSubtitle: 'Qancha kun tanlangan — shuncha taom tanlash aktivlari',
    chosenSets: 'taom tanlandi',
    chooseSet: 'Taom tanlash',
    changeSet: 'Taomni o\'zgartirish',
    pickSetForDate: '{date} kungi taom',
    setPickTitle: 'Taomni tanlang',
    availableSets: 'Katalogda jami: {n}',
    defaultSetNote: 'Tanlanmagan — standart bo\'ladi: {name}',
    dayLocked: 'Bu kun allaqachon yopilgan',
    editingDisabledHint: "O'tgan kunlar va «bugun» soat 10:00 dan keyin o'zgartirib bo'lmaydi",
    myDaysEmpty: 'Kunlar tanlanmagan. Yetkazib berishni belgilash uchun «Kunlar tanlash» tugmasini bosing',
    chooseDates: 'Kunlar tanlash',
    closeModal: 'Yopish',
    menu2Months: 'Menyu',
    searchSets: 'Katalogdan qidirish…',

    // Manager
    managerTitle: 'Menejer · tasdiqlash',
    managerSubtitle: 'Kun bo\'yicha buyurtmalar hisoboti',
    scheduled: 'Rejalashtirilgan porsiyalar',
    totalEmployees: 'Kompaniyadagi xodimlar',
    waiting: 'Standart',
    perPortions: '{count} × {name}',
    confirmDay: 'Kun buyurtmasini tasdiqlash',
    dayConfirmed: 'Kun tasdiqlangan',
    dayLockedBadge: 'Kun yopilgan',
    reportEmpty: 'Bu kunga hech kim rejalashtirilmagan',
    confirmSuccess: "Kun buyurtmasi tasdiqlandi. Chek Telegram-ga yuborildi.",
    totalSum: 'Jami',
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

/** Названия месяцев по индексу 0..11 */
export const MONTHS: Record<Lang, string[]> = {
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
}

/** Короткие названия дней недели по индексу getDay() (0 = Вс ... 6 = Сб) */
export const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  uz: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
}
