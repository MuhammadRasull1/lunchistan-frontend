import { useState, useEffect } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE, WORK_DAYS_COUNT } from './data/mockMenu'
import type { CartState, Beverage, Screen, PaymentMethod } from './types'
import { formatPrice } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(1)
  const [cartState, setCartState] = useState<CartState>({})

  useEffect(() => {
    const initial: CartState = {}
    MONTHLY_SETS.forEach(set => {
      initial[set.id] = { quantity: 0, beverage: 'Вода' }
    })
    setCartState(initial)
  }, [])

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const current = prev[setId] ?? { quantity: 0, beverage: 'Вода' as Beverage }
      return {
        ...prev,
        [setId]: {
          ...current,
          beverage,
        },
      }
    })
  }

  const handleQuantityChange = (setId: string | number, delta: number) => {
    setCartState(prev => {
      const current = prev[setId] ?? { quantity: 0, beverage: 'Вода' as Beverage }
      const newQuantity = Math.max(0, current.quantity + delta)
      return {
        ...prev,
        [setId]: {
          ...current,
          quantity: newQuantity,
        },
      }
    })
  }

  const handleEmployeeCountChange = (count: number) => {
    setEmployeeCount(Math.max(1, count))
  }

  const totalMonthlyPrice = employeeCount * WORK_DAYS_COUNT * SET_PRICE

  const handlePlaceOrder = (method: PaymentMethod) => {
    const methodLabels: Record<PaymentMethod, string> = {
      corporate: 'Перечислением (Для юрлиц)',
      card: 'Перевод на карту (P2P)',
      cash: 'Наличными курьеру',
    }
    console.log('Заказ оформлен:', {
      employeeCount,
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
      reset[set.id] = { quantity: 0, beverage: 'Вода' }
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
          workDaysCount={WORK_DAYS_COUNT}
          setPrice={SET_PRICE}
          onBeverageChange={handleBeverageChange}
          onQuantityChange={handleQuantityChange}
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
