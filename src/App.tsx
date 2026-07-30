import { useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE } from './data/mockMenu'
import type { CartState, Screen, PaymentMethod, Beverage, Lang } from './types'
import { formatPrice } from './types'
import { t } from './locales/translations'

const MAX_WORK_DAYS = MONTHLY_SETS.length

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(1)
  const [workDaysCount, setWorkDaysCount] = useState<number>(MAX_WORK_DAYS)
  const [lang, setLang] = useState<Lang>('ru')
  const [cartState, setCartState] = useState<CartState>(() => {
    const initial: CartState = {}
    MONTHLY_SETS.forEach(set => {
      initial[set.id] = { active: true, portions: 1, beverage: 'Вода' }
    })
    return initial
  })

  // Показываем только первые workDaysCount сетов
  const visibleSets = MONTHLY_SETS.slice(0, workDaysCount)

  const handleWorkDaysChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(MAX_WORK_DAYS, workDaysCount + delta))
    setWorkDaysCount(newCount)

    // Если уменьшили число дней — деактивируем дни за пределами лимита
    if (newCount < workDaysCount) {
      setCartState(prev => {
        let changed = false
        const updated: CartState = {}
        for (const [id, item] of Object.entries(prev)) {
          const numId = Number(id)
          if (numId > newCount && item.active) {
            updated[id] = { ...item, active: false }
            changed = true
          } else {
            updated[id] = item
          }
        }
        return changed ? updated : prev
      })
    }
  }

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, beverage },
      }
    })
  }

  const handleToggleDay = (setId: string | number) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, active: !item.active },
      }
    })
  }

  const handleSelectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [id, item] of Object.entries(prev)) {
        const numId = Number(id)
        next[id] = { ...item, active: numId <= workDaysCount }
      }
      return next
    })
  }

  const handleDeselectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [id, item] of Object.entries(prev)) {
        const numId = Number(id)
        next[id] = { ...item, active: numId > workDaysCount ? item.active : false }
      }
      return next
    })
  }

  const handleEmployeeCountChange = (count: number) => {
    setEmployeeCount(Math.max(1, count))
  }

  // Динамический расчёт: сумма порций активных дней × employeeCount × SET_PRICE
  const activeDays = Object.values(cartState).filter(item => item?.active).length
  const totalPortionsFromActive = Object.values(cartState)
    .filter(item => item?.active)
    .reduce((sum, item) => sum + (item?.portions ?? 1), 0)
  const totalMonthlyPrice = totalPortionsFromActive * employeeCount * SET_PRICE
  const totalItems = totalPortionsFromActive * employeeCount

  const handlePlaceOrder = (method: PaymentMethod) => {
    const methodLabels: Record<PaymentMethod, string> = {
      corporate: t(lang, 'corporateLabel'),
      card: t(lang, 'cardLabel'),
      cash: t(lang, 'cashLabel'),
    }
    console.log('Заказ оформлен:', {
      employeeCount,
      workDaysCount,
      activeDays,
      cartState,
      totalMonthlyPrice,
      paymentMethod: method,
    })
    alert(t(lang, 'orderAlert', {
      employees: employeeCount,
      method: methodLabels[method],
      price: formatPrice(totalMonthlyPrice),
    }))
    setScreen('success')
  }

  const handleNewOrder = () => {
    const reset: CartState = {}
    MONTHLY_SETS.forEach(set => {
      reset[set.id] = { active: true, portions: 1, beverage: 'Вода' }
    })
    setCartState(reset)
    setEmployeeCount(1)
    setWorkDaysCount(MAX_WORK_DAYS)
    setScreen('catalog')
  }

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang)
  }

  return (
    <div className="app">
      {screen === 'catalog' && (
        <Catalog
          sets={visibleSets}
          allSetsCount={MAX_WORK_DAYS}
          cartState={cartState}
          employeeCount={employeeCount}
          workDaysCount={workDaysCount}
          totalMonthlyPrice={totalMonthlyPrice}
          setPrice={SET_PRICE}
          lang={lang}
          onToggleDay={handleToggleDay}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onEmployeeCountChange={handleEmployeeCountChange}
          onWorkDaysChange={handleWorkDaysChange}
          onBeverageChange={handleBeverageChange}
          onGoToCart={() => setScreen('cart')}
          onLangChange={handleLangChange}
        />
      )}

      {screen === 'cart' && (
        <Cart
          sets={MONTHLY_SETS}
          cartState={cartState}
          totalMonthlyPrice={totalMonthlyPrice}
          employeeCount={employeeCount}
          totalItems={totalItems}
          lang={lang}
          onBack={() => setScreen('catalog')}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {screen === 'success' && (
        <Success lang={lang} onNewOrder={handleNewOrder} />
      )}
    </div>
  )
}

export default App
