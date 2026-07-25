import { useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE } from './data/mockMenu'
import type { CartState, Beverage, Screen, PaymentMethod } from './types'
import { formatPrice } from './types'

const MAX_WORK_DAYS = MONTHLY_SETS.length

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(1)
  const [workDaysCount, setWorkDaysCount] = useState<number>(MAX_WORK_DAYS)
  const [cartState, setCartState] = useState<CartState>(() => {
    const initial: CartState = {}
    MONTHLY_SETS.forEach(set => {
      initial[set.id] = { beverage: 'Вода', active: true, portions: 1 }
    })
    return initial
  })

  // Показываем только первые workDaysCount сетов
  const visibleSets = MONTHLY_SETS.slice(0, workDaysCount)

  const handleWorkDaysChange = (delta: number) => {
    setWorkDaysCount(prev => {
      const next = prev + delta
      return Math.max(1, Math.min(MAX_WORK_DAYS, next))
    })
  }

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[setId]
      return {
        ...prev,
        [setId]: { ...(item ?? { active: true, portions: 1 }), beverage },
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

  const handlePortionChange = (setId: string | number, delta: number) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item || !item.active) return prev
      const newPortions = Math.max(1, (item.portions ?? 1) + delta)
      return {
        ...prev,
        [setId]: { ...item, portions: newPortions },
      }
    })
  }

  const handleSelectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const id of Object.keys(prev)) {
        next[id] = { ...prev[id], active: true }
      }
      return next
    })
  }

  const handleDeselectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const id of Object.keys(prev)) {
        next[id] = { ...prev[id], active: false }
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
      corporate: 'Перечислением (Для юрлиц)',
      card: 'Перевод на карту (P2P)',
      cash: 'Наличными курьеру',
    }
    console.log('Заказ оформлен:', {
      employeeCount,
      workDaysCount,
      activeDays,
      cartState,
      totalMonthlyPrice,
      paymentMethod: method,
    })
    alert(`Предзаказ на ${employeeCount} сотрудников оформлен!\nСпособ оплаты: ${methodLabels[method]}\nОбщая сумма: ${formatPrice(totalMonthlyPrice)}`)
    setScreen('success')
  }

  const handleNewOrder = () => {
    const reset: CartState = {}
    MONTHLY_SETS.forEach(set => {
      reset[set.id] = { beverage: 'Вода', active: true, portions: 1 }
    })
    setCartState(reset)
    setEmployeeCount(1)
    setWorkDaysCount(MAX_WORK_DAYS)
    setScreen('catalog')
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
          onBeverageChange={handleBeverageChange}
          onToggleDay={handleToggleDay}
          onPortionChange={handlePortionChange}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onEmployeeCountChange={handleEmployeeCountChange}
          onWorkDaysChange={handleWorkDaysChange}
          onGoToCart={() => setScreen('cart')}
        />
      )}

      {screen === 'cart' && (
        <Cart
          sets={MONTHLY_SETS}
          cartState={cartState}
          totalMonthlyPrice={totalMonthlyPrice}
          employeeCount={employeeCount}
          totalItems={totalItems}
          onBack={() => setScreen('catalog')}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {screen === 'success' && (
        <Success onNewOrder={handleNewOrder} />
      )}
    </div>
  )
}

export default App
