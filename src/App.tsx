import { useEffect, useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE, getSetForDate } from './data/mockMenu'
import type { CartState, Screen, PaymentMethod, Beverage, Salad, Lang, SelectedDay } from './types'
import { EMPLOYEE_MAX } from './types'
import { t } from './locales/translations'
import { showTelegramAlert } from './lib/telegram'
import { loadSavedOrder, saveOrder, clearSavedOrder } from './lib/orderStorage'
import { submitOrder } from './lib/api'
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
  return { active: true, portions: 1, beverage: 'Вода', salad: DEFAULT_SALAD }
}

// Читаем и валидируем сохранённую конфигурацию один раз при загрузке модуля.
const savedOrder = loadSavedOrder()

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(() => Math.min(EMPLOYEE_MAX, savedOrder?.employeeCount ?? 1))
  const [lang, setLang] = useState<Lang>(loadInitialLang)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successInfo, setSuccessInfo] = useState<{ method: PaymentMethod; total: number; employees: number; days: number } | null>(null)
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

  // Единственный источник истины по количеству дней — выбранные даты.
  const selectedDates = Object.keys(cartState).sort()
  const orderDays: SelectedDay[] = selectedDates.map(date => ({
    date,
    set: getSetForDate(date),
    item: cartState[date],
  }))
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

  const handlePlaceOrder = async (method: PaymentMethod) => {
    if (isSubmitting) return
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
      }
      console.log('Заказ оформлен:', payload)
      await submitOrder(payload)
      // Фиксируем данные для экрана Success ДО сброса заказа.
      setSuccessInfo({ method, total: totalMonthlyPrice, employees: employeeCount, days: lines.length })
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

  return (
    <div className="app">
      {screen === 'catalog' && (
        <Catalog
          days={orderDays}
          allSetsCount={MONTHLY_SETS.length}
          employeeCount={employeeCount}
          totalMonthlyPrice={totalMonthlyPrice}
          setPrice={SET_PRICE}
          lang={lang}
          onApplySelectedDates={handleApplySelectedDates}
          onEmployeeCountChange={handleEmployeeCountChange}
          onBeverageChange={handleBeverageChange}
          onApplyBeverageToAll={handleApplyBeverageToAll}
          onPortionsChange={handlePortionsChange}
          onSaladChange={handleSaladChange}
          onApplySaladToAll={handleApplySaladToAll}
          onGoToCart={() => setScreen('cart')}
          onLangChange={handleLangChange}
        />
      )}

      {screen === 'cart' && (
        <Cart
          days={orderDays}
          totalMonthlyPrice={totalMonthlyPrice}
          employeeCount={employeeCount}
          totalItems={totalItems}
          lang={lang}
          isSubmitting={isSubmitting}
          onBack={() => setScreen('catalog')}
          onPlaceOrder={handlePlaceOrder}
          onRemoveItem={handleToggleDate}
        />
      )}

      {screen === 'success' && (
        <Success
          lang={lang}
          onNewOrder={handleNewOrder}
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
