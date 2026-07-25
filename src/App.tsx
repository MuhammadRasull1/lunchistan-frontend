import { useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE } from './data/mockMenu'
import type { CartState, Beverage, Screen, PaymentMethod } from './types'
import { formatPrice } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(1)
  const [cartState, setCartState] = useState<CartState>(() => {
    const initial: CartState = {}
    MONTHLY_SETS.forEach(set => {
      initial[set.id] = { beverage: 'Вода', active: true }
    })
    return initial
  })

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[setId]
      return {
        ...prev,
        [setId]: { ...(item ?? { active: true }), beverage },
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

  // Динамический расчёт: (количество активных дней) × employeeCount × SET_PRICE
  const activeDays = Object.values(cartState).filter(item => item?.active).length
  const totalMonthlyPrice = activeDays * employeeCount * SET_PRICE

  const handlePlaceOrder = (method: PaymentMethod) => {
    const methodLabels: Record<PaymentMethod, string> = {
      corporate: 'Перечислением (Для юрлиц)',
      card: 'Перевод на карту (P2P)',
      cash: 'Наличными курьеру',
    }
    console.log('Заказ оформлен:', {
      employeeCount,
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
      reset[set.id] = { beverage: 'Вода', active: true }
    })
    setCartState(reset)
    setEmployeeCount(1)
    setScreen('catalog')
  }

  return (
    <div className="app">
      {screen === 'catalog' && (
        <Catalog
          sets={MONTHLY_SETS}
          cartState={cartState}
          employeeCount={employeeCount}
          totalMonthlyPrice={totalMonthlyPrice}
          setPrice={SET_PRICE}
          onBeverageChange={handleBeverageChange}
          onToggleDay={handleToggleDay}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onEmployeeCountChange={handleEmployeeCountChange}
          onGoToCart={() => setScreen('cart')}
        />
      )}

      {screen === 'cart' && (
        <Cart
          sets={MONTHLY_SETS}
          cartState={cartState}
          totalMonthlyPrice={totalMonthlyPrice}
          employeeCount={employeeCount}
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
