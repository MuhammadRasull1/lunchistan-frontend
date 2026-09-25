import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import AppHeader from './components/AppHeader'
import type { AppTab } from './components/AppHeader'
import Onboarding from './components/Onboarding'
import EmployeeView from './components/EmployeeView'
import ManagerView from './components/ManagerView'
import SupportLink from './components/SupportLink'
import { getSetById } from './lib/menu'
import type { CartState, Screen, PaymentMethod, Beverage, Salad, Lang, LunchSet, SelectedDay } from './types'
import { EMPLOYEE_MAX } from './types'
import { t } from './locales/translations'
import { showTelegramAlert } from './lib/telegram'
import { loadSavedOrder, saveOrder, clearSavedOrder } from './lib/orderStorage'
import { submitOrder, getToken, setToken, fetchMe, fetchMenu, fetchDayMenu, restoreTokenFromCloud, isNetworkError, fetchAvailableDates } from './lib/api'
import { restoreGeoConsentFromCloud } from './lib/geoConsent'
import type { AuthResponse, AuthUser, OrderContact, OrderView } from './lib/api'
import { getDefaultSalad } from './components/saladOptions'
import { isPastDate, isValidDateString, canSelectDate, formatDate } from './lib/calendar'

// До 11.09.2026 меню было захардкожено в data/mockMenu.ts с единой ценой на все блюда.
// Теперь у каждого блюда своя цена из БД — это лишь запасное значение на случай,
// когда set ещё не определён (меню не загрузилось / идёт загрузка).
const FALLBACK_PRICE = 55000

const LANG_STORAGE_KEY = 'lunchistan_lang'

function loadInitialLang(): Lang {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    return raw === 'uz' ? 'uz' : 'ru'
  } catch {
    return 'ru'
  }
}

/**
 * Если promise не решился за ms — резолвим fallback'ом сами. Telegram
 * CloudStorage иногда не вызывает колбэк (баги клиента/сеть) — без этого
 * boot() зависал НАВСЕГДА и приложение не открывалось (см. ОШИБКИ.md).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(v => { clearTimeout(timer); resolve(v) }, () => { clearTimeout(timer); resolve(fallback) })
  })
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeDefaultDay(menu: LunchSet[]): CartState[string] {
  // setId: null — блюдо на день ещё не выбрано («токен» не потрачен).
  return { active: true, portions: 1, beverage: 'Вода', salad: getDefaultSalad(menu), setId: null }
}

// Читаем и валидируем сохранённую конфигурацию один раз при загрузке модуля.
const savedOrder = loadSavedOrder()

function App() {
  const [tab, setTab] = useState<AppTab>('catalog')
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(() => Math.min(EMPLOYEE_MAX, savedOrder?.employeeCount ?? 1))
  const [lang, setLang] = useState<Lang>(loadInitialLang)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{
    method: PaymentMethod; total: number; employees: number; days: number
    orderNumber?: string; status?: string; isLead?: boolean; deliveryFee?: number
  } | null>(null)
  // Ключ идемпотентности заказа: стабилен, пока не поменялся состав заказа (двойной
  // клик/ретрай с тем же ключом не создаст на бэкенде второй заказ), и сбрасывается
  // при любом изменении состава — иначе новый заказ получил бы ответ от старого.
  const idempotencyKeyRef = useRef<string | null>(null)
  // auth-состояние раздела «Команды»
  const [user, setUser] = useState<AuthUser | null>(null)
  const [employeesCount, setEmployeesCount] = useState(0)
  const [booted, setBooted] = useState(false)
  // Сбой сети при восстановлении сессии: раньше токен стирался и человека «выкидывало» в онбординг.
  const [bootNetError, setBootNetError] = useState(false)
  const [bootKey, setBootKey] = useState(0)
  const [menu, setMenu] = useState<LunchSet[]>([])
  const [menuError, setMenuError] = useState(false)
  // Анимация появления названия компании сразу после входа
  const [revealCompany, setRevealCompany] = useState<string | null>(null)
  // Единая модель: cartState ключуется по дате YYYY-MM-DD; наличие ключа = день выбран.
  // Первый запуск — ничего не выбрано (0 дней). Инвариант: нет прошедших дат.
  const [cartState, setCartState] = useState<CartState>(() => {
    if (!savedOrder) return {}
    const merged: CartState = {}
    for (const [date, item] of Object.entries(savedOrder.cartState)) {
      // Защитный слой: сохранённые прошедшие даты не восстанавливаются.
      if (isValidDateString(date) && !isPastDate(date)) merged[date] = item
    }
    return merged
  })

  // Автосохранение текущей конфигурации заказа для восстановления при следующем запуске.
  useEffect(() => {
    saveOrder({ employeeCount, cartState })
  }, [employeeCount, cartState])

  // Состав заказа поменялся — старый ключ идемпотентности больше не описывает
  // этот заказ, нельзя его переиспользовать (иначе бэкенд отдаст старый заказ
  // вместо создания нового).
  useEffect(() => {
    idempotencyKeyRef.current = null
  }, [cartState, employeeCount])

  // Восстановление сессии раздела «Команды»
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      // localStorage TMA мог быть очищен при закрытии — подтягиваем токен из
      // CloudStorage Telegram (персистентное хранилище, привязано к аккаунту).
      // Таймаут 3с: колбэк CloudStorage иногда не вызывается вовсе (баг клиента/
      // сети) — без таймаута boot() зависал навсегда и приложение не открывалось.
      // Оба чтения CloudStorage параллельно: худший случай 3 с, а не 6 с «…» на экране.
      // Согласие на геопозицию тоже живёт в CloudStorage — восстанавливаем молча.
      const [cloudToken] = await Promise.all([
        getToken() ? Promise.resolve(null) : withTimeout(restoreTokenFromCloud(), 3000, null),
        withTimeout(restoreGeoConsentFromCloud(), 3000, false),
      ])
      const token = getToken() ?? cloudToken
      if (!token) {
        setBooted(true)
        return
      }
      try {
        const data = await fetchMe()
        if (!cancelled) {
          setUser(data.user)
          if (data.user.role === 'employee') setTab('teams')
          setEmployeesCount(data.employeesCount)
        }
      } catch (err) {
        if (isNetworkError(err)) {
          if (!cancelled) setBootNetError(true)
          return
        }
        setToken(null)
      }
      if (!cancelled) setBooted(true)
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [bootKey])

  // Меню — с бэкенда (см. lib/api.ts fetchMenu, до 11.09.2026 было захардкожено
  // в data/mockMenu.ts). Независимо от boot() выше: логин не должен ждать меню,
  // оно нужно только внутри уже авторизованного приложения (Catalog/EmployeeView).
  // Ошибка — не тонет молча (тот же принцип, что и для тарифа доставки, см. ОШИБКИ.md):
  // без меню каталог и «Команды» бесполезны, поэтому вместо пустого списка — retry.
  const [menuReloadKey, setMenuReloadKey] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetchMenu()
      .then(sets => { if (!cancelled) setMenu(sets) })
      .catch(() => { if (!cancelled) setMenuError(true) })
    return () => {
      cancelled = true
    }
  }, [menuReloadKey])

  // Меню по датам (17.09.2026 — блюда не повторяются день в день, ротация
  // getSetForDate удалена). Кеш по дате: undefined — ещё не загружено,
  // [] — на дату не внесено меню, [x] — единственное блюдо (назначается само),
  // [x, y, ...] — несколько блюд (клиент выбирает через SetPicker).
  const [dayMenus, setDayMenus] = useState<Record<string, LunchSet[]>>({})
  const [dayMenuErrors, setDayMenuErrors] = useState<Record<string, boolean>>({})
  const fetchingDaysRef = useRef<Set<string>>(new Set())
  const ensureDayMenu = useCallback((date: string) => {
    if (dayMenus[date] !== undefined) return
    if (dayMenuErrors[date]) return
    if (fetchingDaysRef.current.has(date)) return
    fetchingDaysRef.current.add(date)
    fetchDayMenu(date)
      .then(sets => {
        setDayMenus(prev => (prev[date] !== undefined ? prev : { ...prev, [date]: sets }))
        // Ровно одно блюдо на день — выбирать нечего, назначаем сразу («токен» тратится сам).
        // Выбор, которого больше нет в меню даты (владелец заменил блюдо), тоже переназначаем.
        if (sets.length === 1) {
          const onlyId = Number(sets[0].id)
          setCartState(prev => {
            const item = prev[date]
            if (!item || item.setId === onlyId) return prev
            return { ...prev, [date]: { ...item, setId: onlyId } }
          })
        }
      })
      .catch(() => {
        // Сбой сети — не «на дату нет меню»: помечаем отдельно, в каталоге будет «Повторить».
        setDayMenuErrors(prev => ({ ...prev, [date]: true }))
      })
      .finally(() => {
        fetchingDaysRef.current.delete(date)
      })
  }, [dayMenus, dayMenuErrors])

  const retryDayMenus = () => setDayMenuErrors({})

  const handleAuth = (result: AuthResponse) => {
    setToken(result.token)
    setUser(result.user)
    // у сотрудника своё место — «Кабинет» с его днями; оптовый каталог компании ему не нужен (25.09.2026)
    if (result.user.role === 'employee') setTab('teams')
    setRevealCompany(result.user.companyName ?? '')
    window.setTimeout(() => setRevealCompany(null), 1600)
    if (result.user.role === 'admin') {
      fetchMe()
        .then(data => setEmployeesCount(data.employeesCount))
        .catch(() => {})
    } else {
      setEmployeesCount(0)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  // Единственный источник истины по количеству дней — выбранные даты.
  const selectedDates = Object.keys(cartState).sort()

  // Подгружаем дневное меню для каждой выбранной даты (кеш выше не теряется
  // между ре-рендерами — ensureDayMenu не повторяет уже идущий/завершённый запрос).
  useEffect(() => {
    for (const date of selectedDates) ensureDayMenu(date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates.join(','), dayMenuErrors])

  // Пока меню не загрузилось, getSetById не может вернуть сет — Catalog всё
  // равно не рендерится раньше booted+menu (см. ниже), это просто держит
  // типы честными (SelectedDay.set обязателен) без "as LunchSet".
  const orderDays: SelectedDay[] = menu.length === 0 ? [] : selectedDates.map(date => {
    const item = cartState[date]
    // Сет дня = выбор клиента (item.setId), резолвится из полного каталога
    // (дневное меню — подмножество активных блюд). Пока не выбрано — плейсхолдер:
    // первое блюдо дневного меню этой даты (если уже загружено), иначе первое из каталога.
    const chosenSet = getSetById(menu, item?.setId)
    // Выбор больше не в дневном меню даты (владелец снял/заменил блюдо) — считаем невыбранным,
    // иначе заказ уйдёт с блюдом, которого в этот день нет.
    const dayMenu = dayMenus[date]
    const stillOnMenu = dayMenu === undefined || dayMenu.some(s => Number(s.id) === item?.setId)
    return {
      date,
      set: chosenSet ?? dayMenus[date]?.[0] ?? menu[0],
      chosen: chosenSet !== undefined && stillOnMenu,
      item,
    }
  })
  // Все дни с выбранным блюдом? (иначе заказ оформить нельзя)
  const allDishesChosen = orderDays.length > 0 && orderDays.every(d => d.chosen)
  const totalPortionsFromActive = selectedDates.reduce((sum, date) => sum + (cartState[date]?.portions ?? 1), 0)
  const totalMonthlyPrice = totalPortionsFromActive * employeeCount * FALLBACK_PRICE
  const totalItems = totalPortionsFromActive * employeeCount
  /** Включить/выключить день: при отключении настройки дня (салат/напиток/порции) удаляются из state */
  const handleToggleDate = (date: string) => {
    setCartState(prev => {
      if (prev[date]) {
        const next = { ...prev }
        delete next[date]
        return next
      }
      // Защитный слой: прошедшие даты нельзя включить (удаление всегда разрешено).
      if (isPastDate(date)) return prev
      // Защитный слой: дата без внесённого дневного меню не может попасть в подписку
      // (обычно уже отсечена календарём через fetchAvailableDates — см. CalendarModal).
      if (dayMenus[date] && dayMenus[date].length === 0) return prev
      return { ...prev, [date]: makeDefaultDay(menu) }
    })
  }

  const handleBeverageChange = (date: string, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[date]
      if (!item) return prev
      return { ...prev, [date]: { ...item, beverage } }
    })
  }

  const handleApplyBeverageToAll = (beverage: Beverage) => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [date, item] of Object.entries(prev)) {
        next[date] = { ...item, beverage }
      }
      return next
    })
  }

  const handlePortionsChange = (date: string, portions: number) => {
    const clamped = Math.max(1, portions)
    setCartState(prev => {
      const item = prev[date]
      if (!item) return prev
      return { ...prev, [date]: { ...item, portions: clamped } }
    })
  }

  const handleSaladChange = (date: string, salad: Salad) => {
    setCartState(prev => {
      const item = prev[date]
      if (!item) return prev
      return { ...prev, [date]: { ...item, salad } }
    })
  }

  const handleApplySaladToAll = (salad: Salad) => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [date, item] of Object.entries(prev)) {
        next[date] = { ...item, salad }
      }
      return next
    })
  }

  /** Клиент выбрал блюдо на день («потратил токен»). */
  const handleSetChange = (date: string, setId: number) => {
    setCartState(prev => {
      const item = prev[date]
      if (!item) return prev
      return { ...prev, [date]: { ...item, setId } }
    })
  }

  /**
   * Применение подтверждённого выбора из календарной модалки.
   * Новые даты получают конфиг дня по умолчанию; конфиги уже выбранных дат сохраняются;
   * даты, снятые в модалке, удаляются из state.
   */
  const handleApplySelectedDates = (dates: string[]) => {
    setCartState(prev => {
      const next: CartState = {}
      for (const date of dates) {
        // Защитный слой: прошедшие даты не применяются.
        if (isPastDate(date)) continue
        // Защитный слой: дата без внесённого дневного меню не применяется (см. CalendarModal).
        if (dayMenus[date] && dayMenus[date].length === 0) continue
        next[date] = prev[date] ?? makeDefaultDay(menu)
      }
      return next
    })
  }

  const handleEmployeeCountChange = (count: number) => {
    setEmployeeCount(Math.min(EMPLOYEE_MAX, Math.max(1, count)))
  }

  const handlePlaceOrder = async (method: PaymentMethod, contact: OrderContact = {}) => {
    if (isSubmitting) return
    // Защитный слой: заказ нельзя оформить, пока на каждый день не выбрано блюдо.
    if (!allDishesChosen) {
      showTelegramAlert(t(lang, 'chooseDishForEveryDay'))
      return
    }
    setIsSubmitting(true)
    try {
      // Массив дней строится напрямую из выбранных дат — день из календаря всегда есть в days[].
      const lines = orderDays.map(({ date, set, item }) => {
        const portions = item?.portions ?? 1
        const totalPortions = portions * employeeCount
        const mainDish = set?.composition.find(c => c.optional !== true)?.name ?? set?.name ?? ''
        return {
          date,
          day: Number(date.slice(8, 10)),
          setId: Number(set.id),
          setName: set?.name,
          mainDish,
          salad: item?.salad ?? getDefaultSalad(menu),
          beverage: item?.beverage ?? 'Вода',
          portions,
          unitPrice: set?.price ?? FALLBACK_PRICE,
          lineTotal: (set?.price ?? FALLBACK_PRICE) * totalPortions,
        }
      })
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = makeIdempotencyKey()
      const payload = {
        employeeCount,
        workDaysCount: lines.length,
        activeDays: lines.length,
        days: lines,
        lines,
        totalMonthlyPrice,
        paymentMethod: method,
        idempotencyKey: idempotencyKeyRef.current,
        ...contact,
      }
      const result = await submitOrder(payload)
      // Фиксируем данные для экрана Success ДО сброса заказа. Сумму берём из ответа
      // сервера (totalWithDelivery), а не из локального totalMonthlyPrice — иначе
      // на экране успеха доставка молча пропадала из итога (см. ОШИБКИ.md).
      setSuccessInfo({
        method, total: result.totalWithDelivery, employees: employeeCount, days: lines.length,
        orderNumber: result.orderNumber, status: result.status, isLead: result.isLead,
        deliveryFee: result.deliveryFee,
      })
      // Очищаем заказ после успешной отправки — уже оплаченный заказ не должен
      // восстанавливаться автоприсейвом и не может быть оплачен повторно.
      setCartState({})
      setEmployeeCount(1)
      clearSavedOrder()
      setScreen('success')
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error)
      showTelegramAlert(t(lang, 'orderError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Повтор заказа: те же дни по счёту, сотрудники, салат/напиток/порции — на ближайшие
   * даты, где владелец назначил меню. Блюдо переносится, только если оно есть в меню новой
   * даты (иначе день помечен «выберите блюдо», единственное блюдо дня подставится само).
   */
  const handleRepeatOrder = async (order: OrderView) => {
    const byDate = new Map<string, OrderView['lines'][number]>()
    for (const l of [...order.lines].sort((a, b) => a.date.localeCompare(b.date))) {
      if (!byDate.has(l.date)) byDate.set(l.date, l)
    }
    const oldDays = [...byDate.values()]
    const from = formatDate(new Date())
    const to = formatDate(new Date(Date.now() + 60 * 24 * 3600 * 1000))
    let available: string[]
    try {
      available = (await fetchAvailableDates(from, to)).filter(canSelectDate)
    } catch {
      showTelegramAlert(t(lang, 'networkError'))
      return
    }
    if (available.length === 0) {
      showTelegramAlert(t(lang, 'repeatOrderNoDates'))
      return
    }
    const next: CartState = {}
    available.slice(0, oldDays.length).forEach((date, i) => {
      const old = oldDays[i]
      next[date] = {
        active: true,
        portions: old.portions > 0 ? old.portions : 1,
        beverage: old.beverage === 'Компот в ассортименте' ? 'Компот в ассортименте' : 'Вода',
        salad: old.salad ?? getDefaultSalad(menu),
        setId: old.setId,
      }
    })
    setCartState(next)
    setEmployeeCount(Math.min(EMPLOYEE_MAX, Math.max(1, order.employeeCount)))
    setSuccessInfo(null)
    setScreen('catalog')
    setTab('catalog')
    if (available.length < oldDays.length) {
      showTelegramAlert(t(lang, 'repeatOrderFewerDates', { n: available.length, total: oldDays.length }))
    }
  }

  const handleNewOrder = () => {
    setCartState({})
    setEmployeeCount(1)
    setSuccessInfo(null)
    setScreen('catalog')
    clearSavedOrder()
  }

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang)
    } catch {
      // ignore
    }
  }

  const handleTabChange = (next: AppTab) => {
    setTab(next)
    // Screen — это ровно 'catalog' | 'cart' | 'success' (см. types.ts), поэтому старое
    // условие "screen не catalog/cart/success" не срабатывало никогда — переключение
    // на вкладку «Каталог» не возвращало на сам каталог из корзины/успеха.
    if (next === 'catalog' && screen !== 'catalog') {
      setScreen('catalog')
    }
  }

  return (
    <div className="app">
      {!booted && !bootNetError && <BootLoader lang={lang} />}
      {!booted && bootNetError && (
        <div className="view__body view__boot">
          <p>{t(lang, 'networkError')}</p>
          <button type="button" className="btn btn--primary" onClick={() => { setBootNetError(false); setBootKey(k => k + 1) }}>
            {t(lang, 'retry')}
          </button>
        </div>
      )}

      {booted && !user && (
        <Onboarding lang={lang} onAuth={handleAuth} />
      )}

      {booted && user && (
        <>
          <header className="view__header">
            <AppHeader activeTab={tab} onTabChange={handleTabChange} lang={lang} onLangChange={handleLangChange} />
          </header>

          {menuError && (
            <div className="view__body view__boot">
              <p>{t(lang, 'menuLoadError')}</p>
              <button type="button" onClick={() => { setMenuError(false); setMenuReloadKey(k => k + 1) }}>
                {t(lang, 'menuLoadRetry')}
              </button>
            </div>
          )}

          {!menuError && menu.length === 0 && <BootLoader lang={lang} />}

          {revealCompany && (
            <div className="reveal-overlay">
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                <div className="reveal-brand">Lunchistan</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}>
                <div className="reveal-company">{revealCompany}</div>
                <div className="reveal-tagline">{t(lang, 'obRevealTagline')}</div>
              </motion.div>
            </div>
          )}

          {!menuError && menu.length > 0 && (
          <>
          {tab === 'teams' && <SupportLink lang={lang} />}

          {/* Экранные переходы: плавное появление при смене вкладки/экрана */}
          <AnimatePresence mode="wait" initial={false}>
            {tab === 'catalog' && screen === 'catalog' && (
              <motion.div
                key="scr-catalog"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Catalog
                  days={orderDays}
                  menu={menu}
                  dayMenus={dayMenus}
                  allSetsCount={menu.length}
                  employeeCount={employeeCount}
                  totalMonthlyPrice={totalMonthlyPrice}
                  setPrice={FALLBACK_PRICE}
                  lang={lang}
                  allDishesChosen={allDishesChosen}
                  dayMenuErrors={dayMenuErrors}
                  onRetryDayMenus={retryDayMenus}
                  onApplySelectedDates={handleApplySelectedDates}
                  onEmployeeCountChange={handleEmployeeCountChange}
                  onBeverageChange={handleBeverageChange}
                  onApplyBeverageToAll={handleApplyBeverageToAll}
                  onPortionsChange={handlePortionsChange}
                  onSaladChange={handleSaladChange}
                  onApplySaladToAll={handleApplySaladToAll}
                  onSetChange={handleSetChange}
                  onGoToCart={() => setScreen('cart')}
                />
              </motion.div>
            )}

            {tab === 'catalog' && screen === 'cart' && (
              <motion.div
                key="scr-cart"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Cart
                  days={orderDays}
                  totalMonthlyPrice={totalMonthlyPrice}
                  employeeCount={employeeCount}
                  totalItems={totalItems}
                  lang={lang}
                  isSubmitting={isSubmitting}
                  user={user}
                  onBack={() => setScreen('catalog')}
                  onPlaceOrder={handlePlaceOrder}
                  onRemoveItem={handleToggleDate}
                />
              </motion.div>
            )}

            {tab === 'catalog' && screen === 'success' && (
              <motion.div
                key="scr-success"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Success
                  lang={lang}
                  onNewOrder={handleNewOrder}
                  orderNumber={successInfo?.orderNumber}
                  status={successInfo?.status}
                  isLead={successInfo?.isLead}
                  paymentMethod={successInfo?.method}
                  totalMonthlyPrice={successInfo?.total}
                  deliveryFee={successInfo?.deliveryFee}
                  employeeCount={successInfo?.employees}
                  activeDays={successInfo?.days}
                />
              </motion.div>
            )}

            {/* Хозяйские функции (сводка, меню, настройки) переехали в Lunchistan Core
                (21.09.2026) — здесь для владельца только вежливое сообщение, без
                намёка на «закрытый для клиента раздел». */}
            {tab === 'teams' && user?.role === 'owner' && (
              <motion.div
                key="scr-owner"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <main className="view__body">
                  <div className="catalog__heading" style={{ marginTop: 20 }}>{user.name}</div>
                  <p className="catalog__subtitle">
                    <button className="auth-toggle with-ml" onClick={handleLogout}>{t(lang, 'logout')}</button>
                  </p>
                  <p className="view__section-desc" style={{ marginTop: 24 }}>{t(lang, 'ownerMovedToCore')}</p>
                </main>
              </motion.div>
            )}

            {tab === 'teams' && user?.role === 'employee' && (
              <motion.div
                key="scr-employee"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="view__enter">
                  <EmployeeView
                    lang={lang}
                    userName={user.name}
                    companyName={user.companyName ?? ''}
                    onLogout={handleLogout}
                  />
                </div>
              </motion.div>
            )}

            {tab === 'teams' && user?.role === 'admin' && (
              <motion.div
                key="scr-admin"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="view__enter">
                  <ManagerView
                    lang={lang}
                    userName={user.name}
                    companyName={user.companyName ?? ''}
                    teamCode={user.companyCode}
                    teamSize={user.companySize}
                    employeesCount={employeesCount}
                    onLogout={handleLogout}
                    onRepeatOrder={handleRepeatOrder}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
          )}
        </>
      )}
    </div>
  )
}

export default App
/** Экран загрузки: спиннер + подпись вместо голого «…» */
function BootLoader({ lang }: { lang: Lang }) {
  return (
    <div className="view__body view__boot">
      <span className="boot-spinner" />
      <p>{t(lang, 'loadingLabel')}</p>
    </div>
  )
}
