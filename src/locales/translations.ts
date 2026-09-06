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
    selectedDaysTitle: 'Выбранные дни',
    daySetNotChosen: 'Токен свободен',
    chooseDishForEveryDay: 'Выберите блюдо на каждый выбранный день',
    tokensHint: 'Каждый выбранный день — 1 токен на блюдо из меню',
    tokensFree: 'Свободных токенов: {n}',
    tokensAllSpent: 'Блюда выбраны на все дни ✓',
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

    // Tabs
    tabCatalog: 'Каталог',
    tabTeams: 'Кабинет',

    // Teams — вход / создание
    authTitle: 'Вход',
    registerTitle: 'Команда',
    authSubtitle: 'Корпоративные обеды для вашей команды',
    phone: 'Телефон',
    password: 'Пароль',
    name: 'Имя',
    loginLabel: 'Войти',
    teamName: 'Название команды',
    teamSize: 'Кол-во людей',
    teamSizePlaceholder: 'Например: 10',
    teamSizeHint: 'Столько людей будет в команде',
    companyCode: 'Код команды',
    companyCodePlaceholder: 'Например: ABC123',
    createTeam: 'Создать команду',
    joinTeam: 'Присоединиться',
    createTeamLink: 'Нет команды — создать',
    joinTeamLink: 'У меня есть код команды',
    switchToLogin: 'Уже есть аккаунт — войти',
    registerEmployeeHint: 'Введите код команды, чтобы присоединиться',
    authError: 'Не удалось войти. Проверьте данные',
    logout: 'Выйти',

    // Техподдержка
    supportTitle: 'Нужна помощь?',
    supportDesc: 'Вопросы по заказу, оплате или меню — напишите нам в Telegram.',
    supportButton: 'Связаться с техподдержкой',

    // Employee — мои дни
    myDays: 'Мои дни',
    myDaysSubtitle: 'Сколько дней выбрал — столько токенов на выбор блюда',
    chosenSets: 'выбрано блюд',
    chooseDates: 'Выбрать дни',
    chooseSet: 'Выбрать блюдо',
    changeSet: 'Изменить блюдо',
    setPickTitle: 'Выберите блюдо',
    availableSets: 'Всего в каталоге: {n}',
    defaultSetNote: 'Не выбрано — по умолчанию будет {name}',
    dayLockedBadge: 'День закрыт',
    editingDisabledHint: 'Прошедшие дни и «сегодня» после 10:00 изменять нельзя',
    myDaysEmpty: 'Дни не выбраны. Нажмите «Выбрать дни», чтобы назначить доставку',
    scheduled: 'Запланировано порций',
    closeModal: 'Закрыть',
    searchSets: 'Поиск по каталогу…',
    searchEmpty: 'Ничего не найдено',
    currentSet: 'Выбрано',

    // Manager — сводка команды
    managerTitle: 'Менеджер · подтверждение',
    teamCode: 'Код команды',
    teamMembers: 'Сотрудников',
    copied: 'Скопировано',
    waiting: 'По умолчанию',
    confirmDay: 'Подтвердить заказ на день',
    dayConfirmed: 'День подтверждён',
    reportEmpty: 'На этот день никто не запланирован',
    confirmSuccess: 'Заказ на день подтверждён. Чек отправлен в Telegram.',
    totalSum: 'Итого',

    // ── v3: контакты в чекауте ──────────────────────────────────
    contactSection: 'Контакты для доставки',
    contactName: 'Контактное лицо',
    contactPhone: 'Телефон',
    contactCompany: 'Компания',
    contactAddress: 'Адрес доставки',
    contactComment: 'Комментарий',
    contactRequiredHint: 'Укажите имя и телефон — по ним с вами свяжутся',
    optionalField: 'необязательно',
    loginToTrackHint: 'Войдите в кабинет, чтобы видеть заказ и его статус',

    // ── v3: статусы заказа ──────────────────────────────────────
    orderStatusLabel: 'Статус',
    status_new: 'Новый',
    status_confirmed: 'Подтверждён',
    status_in_progress: 'Готовится',
    status_delivered: 'Доставлен',
    status_paid: 'Оплачен',
    status_cancelled: 'Отменён',

    // ── v3: Success для заявки ──────────────────────────────────
    leadTitle: 'Заявка принята',
    leadText: 'Спасибо! Менеджер Lunchistan свяжется с вами, чтобы подтвердить заказ.',

    // ── v3: Кабинет ─────────────────────────────────────────────
    cabinetLogin: 'Вход в кабинет',
    myOrders: 'Мои заказы',
    myOrdersEmpty: 'Пока нет заказов',
    ordersSection: 'Заказы',
    teamSection: 'Команда',
    orderLinesLabel: 'Состав',
    refresh: 'Обновить',
    loadingLabel: 'Загрузка…',

    // ── v3: Сводка владельца ───────────────────────────────────
    ownerTitle: 'Сводка',
    ownerSubtitle: 'Что происходит с заказами',
    rangeWeek: 'Неделя',
    range2Weeks: '2 недели',
    rangeMonth: 'Месяц',
    moneyOrdered: 'Заказано',
    moneyPaid: 'Оплачено',
    moneyUnpaid: 'Долг',
    ordersByStatus: 'Заказы по статусам',
    leadsNew: 'Новые заявки',
    leadsNoneNew: 'Новых заявок нет',
    callLead: 'Позвонить',
    kitchenSheet: 'Лист для кухни',
    kitchenEmpty: 'На эти даты заказов нет',
    portionsShort: 'порц.',
    orderDetail: 'Заказ',
    changeStatus: 'Сменить статус',
    statusChanged: 'Статус обновлён',
    teamsPlanned: 'Команды · запланировано',
    allOrders: 'Все заказы',
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
    selectedDaysTitle: 'Tanlangan kunlar',
    daySetNotChosen: 'Token bo\'sh',
    chooseDishForEveryDay: 'Har bir tanlangan kun uchun taom tanlang',
    tokensHint: 'Har bir tanlangan kun — menyudan taom uchun 1 token',
    tokensFree: 'Bo\'sh tokenlar: {n}',
    tokensAllSpent: 'Barcha kunlarga taom tanlandi ✓',
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

    // Tabs
    tabCatalog: 'Katalog',
    tabTeams: 'Kabinet',

    // Teams — kirish / yaratish
    authTitle: 'Kirish',
    registerTitle: 'Jamoa',
    authSubtitle: "Jamoangiz uchun korporativ tushliklar",
    phone: 'Telefon',
    password: 'Parol',
    name: 'Ism',
    loginLabel: 'Kirish',
    teamName: 'Jamoa nomi',
    teamSize: 'Odamlar soni',
    teamSizePlaceholder: 'Masalan: 10',
    teamSizeHint: 'Jamoada shuncha odam bo\'ladi',
    companyCode: 'Jamoa kodi',
    companyCodePlaceholder: 'Masalan: ABC123',
    createTeam: 'Jamoa yaratish',
    joinTeam: 'Qo\'shilish',
    createTeamLink: 'Jamoa yo\'q — yaratish',
    joinTeamLink: 'Jamoa kodim bor',
    switchToLogin: 'Akkount bor — kirish',
    registerEmployeeHint: 'Qo\'shilish uchun jamoa kodini kiriting',
    authError: 'Kirish imkoni bo\'lmadi. Ma\'lumotlarni tekshiring',
    logout: 'Chiqish',

    // Texnik yordam
    supportTitle: 'Yordam kerakmi?',
    supportDesc: 'Buyurtma, to\'lov yoki menyu bo\'yicha savollar — Telegram orqali yozing.',
    supportButton: 'Texnik yordam bilan bog\'lanish',

    // Employee — mening kunlarim
    myDays: 'Mening kunlarim',
    myDaysSubtitle: 'Qancha kun tanlangan — shuncha taom tanlash aktivlari',
    chosenSets: 'taom tanlandi',
    chooseDates: 'Kunlar tanlash',
    chooseSet: 'Taom tanlash',
    changeSet: "Taomni o'zgartirish",
    setPickTitle: 'Taomni tanlang',
    availableSets: 'Katalogda jami: {n}',
    defaultSetNote: 'Tanlanmagan — odatda {name} bo\'ladi',
    dayLockedBadge: 'Kun yopilgan',
    editingDisabledHint: "O'tgan kunlar va «bugun» soat 10:00 dan keyin o'zgartirib bo'lmaydi",
    myDaysEmpty: "Kunlar tanlanmagan. Yetkazib berishni belgilash uchun «Kunlar tanlash» tugmasini bosing",
    scheduled: 'Rejalashtirilgan porsiyalar',
    closeModal: 'Yopish',
    searchSets: 'Katalogdan qidirish…',
    searchEmpty: 'Hech narsa topilmadi',
    currentSet: 'Tanlandi',

    // Manager — jamoa hisoboti
    managerTitle: 'Menejer · tasdiqlash',
    teamCode: 'Jamoa kodi',
    teamMembers: 'Xodimlar',
    copied: 'Nusxalandi',
    waiting: 'Odatda',
    confirmDay: "Kun buyurtmasini tasdiqlash",
    dayConfirmed: 'Kun tasdiqlangan',
    reportEmpty: "Bu kunga hech kim rejalashtirilmagan",
    confirmSuccess: "Kun buyurtmasi tasdiqlandi. Chek Telegram-ga yuborildi.",
    totalSum: 'Jami',

    // ── v3: yetkazib berish kontaktlari ────────────────────────
    contactSection: 'Yetkazib berish kontaktlari',
    contactName: 'Aloqa shaxsi',
    contactPhone: 'Telefon',
    contactCompany: 'Kompaniya',
    contactAddress: 'Yetkazib berish manzili',
    contactComment: 'Izoh',
    contactRequiredHint: "Ism va telefon kiriting — shu orqali bog'lanamiz",
    optionalField: 'ixtiyoriy',
    loginToTrackHint: "Buyurtma va uning holatini ko'rish uchun kabinetga kiring",

    // ── v3: buyurtma holatlari ─────────────────────────────────
    orderStatusLabel: 'Holat',
    status_new: 'Yangi',
    status_confirmed: 'Tasdiqlangan',
    status_in_progress: 'Tayyorlanmoqda',
    status_delivered: 'Yetkazilgan',
    status_paid: "To'langan",
    status_cancelled: 'Bekor qilingan',

    // ── v3: ariza uchun Success ────────────────────────────────
    leadTitle: 'Ariza qabul qilindi',
    leadText: "Rahmat! Lunchistan menejeri buyurtmani tasdiqlash uchun siz bilan bog'lanadi.",

    // ── v3: Kabinet ────────────────────────────────────────────
    cabinetLogin: 'Kabinetga kirish',
    myOrders: 'Buyurtmalarim',
    myOrdersEmpty: "Hozircha buyurtma yo'q",
    ordersSection: 'Buyurtmalar',
    teamSection: 'Jamoa',
    orderLinesLabel: 'Tarkib',
    refresh: 'Yangilash',
    loadingLabel: 'Yuklanmoqda…',

    // ── v3: Egasi svodkasi ─────────────────────────────────────
    ownerTitle: 'Svodka',
    ownerSubtitle: "Buyurtmalar bilan nima bo'lyapti",
    rangeWeek: 'Hafta',
    range2Weeks: '2 hafta',
    rangeMonth: 'Oy',
    moneyOrdered: 'Buyurtma qilingan',
    moneyPaid: "To'langan",
    moneyUnpaid: 'Qarz',
    ordersByStatus: 'Holat bo\'yicha buyurtmalar',
    leadsNew: 'Yangi arizalar',
    leadsNoneNew: "Yangi ariza yo'q",
    callLead: "Qo'ng'iroq qilish",
    kitchenSheet: 'Oshxona uchun ro\'yxat',
    kitchenEmpty: "Bu sanalarga buyurtma yo'q",
    portionsShort: 'pors.',
    orderDetail: 'Buyurtma',
    changeStatus: "Holatni o'zgartirish",
    statusChanged: 'Holat yangilandi',
    teamsPlanned: 'Jamoalar · rejalashtirilgan',
    allOrders: 'Barcha buyurtmalar',
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
