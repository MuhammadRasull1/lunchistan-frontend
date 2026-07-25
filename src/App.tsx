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
      initial[set.id] = { beverage: 'Вода', quantity: 1 }
    })
    return initial
  })

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[setId]
      return {
        ...prev,
        [setId]: { ...(item ?? { quantity: 1 }), beverage },
      }
    })
  }

  const handlePortionChange = (setId: string | number, delta: number) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      const newQty = Math.max(0, (item.quantity ?? 1) + delta)
      return {
        ...prev,
        [setId]: { ...item, quantity: newQty },
      }
    })
  }

  const handleEmployeeCountChange = (count: number) => {
    setEmployeeCount(Math.max(1, count))
  }

  // Динамический расчёт итоговой суммы
  const totalPortions = Object.values(cartState).reduce(
    (sum, item) => sum + (item?.quantity ?? 0),
    0
  )
  const totalMonthlyPrice = totalPortions * employeeCount * SET_PRICE

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
      reset[set.id] = { beverage: 'Вода', quantity: 1 }
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
          onPortionChange={handlePortionChange}
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
