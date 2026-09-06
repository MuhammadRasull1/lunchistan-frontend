import { useEffect, useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import AppHeader from './components/AppHeader'
import type { AppTab } from './components/AppHeader'
import TeamsAuth from './components/TeamsAuth'
import EmployeeView from './components/EmployeeView'
import ManagerView from './components/ManagerView'
import OwnerView from './components/OwnerView'
import { MONTHLY_SETS, SET_PRICE, getSetForDate, getSetById } from './data/mockMenu'
import type { CartState, Screen, PaymentMethod, Beverage, Salad, Lang, SelectedDay } from './types'
import { EMPLOYEE_MAX } from './types'
import { t } from './locales/translations'
import { showTelegramAlert } from './lib/telegram'
import { loadSavedOrder, saveOrder, clearSavedOrder } from './lib/orderStorage'
import { submitOrder, getToken, setToken, fetchMe } from './lib/api'
import type { AuthResponse, AuthUser, OrderContact } from './lib/api'
import { DEFAULT_SALAD } from './components/saladOptions'
import { isPastDate, isValidDateString } from './lib/calendar'

const LANG_STORAGE_KEY = 'lunchistan_lang'

function loadInitialLang(): Lang {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    return raw === 'uz' ? 'uz' : 'ru'
  } catch {
    return 'ru'
  }
}

function makeDefaultDay(): CartState[string] {
  // setId: null — блюдо на день ещё не выбрано («токен» не потрачен).
  return { active: true, portions: 1, beverage: 'Вода', salad: DEFAULT_SALAD, setId: null }
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
    orderNumber?: string; status?: string; isLead?: boolean
  } | null>(null)
  // auth-состояние раздела «Команды»
  const [user, setUser] = useState<AuthUser | null>(null)
  const [employeesCount, setEmployeesCount] = useState(0)
  const [booted, setBooted] = useState(false)
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

  // Восстановление сессии раздела «Команды»
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (!getToken()) {
        setBooted(true)
        return
      }
      try {
        const data = await fetchMe()
        if (!cancelled) {
          setUser(data.user)
          setEmployeesCount(data.employeesCount)
        }
      } catch {
        setToken(null)
      } finally {
        if (!cancelled) setBooted(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAuth = (result: AuthResponse) => {
    setToken(result.token)
    setUser(result.user)
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
  const orderDays: SelectedDay[] = selectedDates.map(date => {
    const item = cartState[date]
    // Сет дня = выбор клиента (item.setId). Ротация getSetForDate — только
    // визуальный плейсхолдер, пока блюдо не выбрано.
    const chosenSet = getSetById(item?.setId)
    return {
      date,
      set: chosenSet ?? getSetForDate(date),
      chosen: chosenSet !== undefined,
      item,
    }
  })
  // Все дни с выбранным блюдом? (иначе заказ оформить нельзя)
  const allDishesChosen = orderDays.length > 0 && orderDays.every(d => d.chosen)
  const totalPortionsFromActive = selectedDates.reduce((sum, date) => sum + (cartState[date]?.portions ?? 1), 0)
  const totalMonthlyPrice = totalPortionsFromActive * employeeCount * SET_PRICE
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
      return { ...prev, [date]: makeDefaultDay() }
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
        next[date] = prev[date] ?? makeDefaultDay()
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
          salad: item?.salad ?? DEFAULT_SALAD,
          beverage: item?.beverage ?? 'Вода',
          portions,
          unitPrice: set?.price ?? SET_PRICE,
          lineTotal: (set?.price ?? SET_PRICE) * totalPortions,
        }
      })
      const payload = {
        employeeCount,
        workDaysCount: lines.length,
        activeDays: lines.length,
        days: lines,
        lines,
        totalMonthlyPrice,
        paymentMethod: method,
        ...contact,
      }
      const result = await submitOrder(payload)
      // Фиксируем данные для экрана Success ДО сброса заказа.
      setSuccessInfo({
        method, total: totalMonthlyPrice, employees: employeeCount, days: lines.length,
        orderNumber: result.orderNumber, status: result.status, isLead: result.isLead,
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
    if (next === 'catalog' && screen !== 'catalog' && screen !== 'cart' && screen !== 'success') {
      setScreen('catalog')
    }
  }

  return (
    <div className="app">
      {tab === 'teams' && (
        <header className="view__header">
          <AppHeader activeTab={tab} onTabChange={handleTabChange} lang={lang} onLangChange={handleLangChange} />
        </header>
      )}

      {tab === 'teams' && !booted && <div className="view__body view__boot">…</div>}

      {tab === 'teams' && booted && !user && (
        <TeamsAuth lang={lang} onAuth={handleAuth} />
      )}

      {tab === 'teams' && booted && user?.role === 'owner' && (
        <OwnerView lang={lang} userName={user.name} onLogout={handleLogout} />
      )}

      {tab === 'teams' && booted && user?.role === 'employee' && (
        <EmployeeView lang={lang} userName={user.name} companyName={user.companyName ?? ''} onLogout={handleLogout} />
      )}

      {tab === 'teams' && booted && user?.role === 'admin' && (
        <ManagerView
          lang={lang}
          userName={user.name}
          companyName={user.companyName ?? ''}
          teamCode={user.companyCode}
          teamSize={user.companySize}
          employeesCount={employeesCount}
          onLogout={handleLogout}
        />
      )}

      {tab === 'catalog' && screen === 'catalog' && (
        <Catalog
          days={orderDays}
          allSetsCount={MONTHLY_SETS.length}
          employeeCount={employeeCount}
          totalMonthlyPrice={totalMonthlyPrice}
          setPrice={SET_PRICE}
          lang={lang}
          activeTab={tab}
          onTabChange={handleTabChange}
          allDishesChosen={allDishesChosen}
          onApplySelectedDates={handleApplySelectedDates}
          onEmployeeCountChange={handleEmployeeCountChange}
          onBeverageChange={handleBeverageChange}
          onApplyBeverageToAll={handleApplyBeverageToAll}
          onPortionsChange={handlePortionsChange}
          onSaladChange={handleSaladChange}
          onApplySaladToAll={handleApplySaladToAll}
          onSetChange={handleSetChange}
          onGoToCart={() => setScreen('cart')}
          onLangChange={handleLangChange}
        />
      )}

      {tab === 'catalog' && screen === 'cart' && (
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
      )}

      {tab === 'catalog' && screen === 'success' && (
        <Success
          lang={lang}
          onNewOrder={handleNewOrder}
          orderNumber={successInfo?.orderNumber}
          status={successInfo?.status}
          isLead={successInfo?.isLead}
          paymentMethod={successInfo?.method}
          totalMonthlyPrice={successInfo?.total}
          employeeCount={successInfo?.employees}
          activeDays={successInfo?.days}
        />
      )}
    </div>
  )
}

export default App