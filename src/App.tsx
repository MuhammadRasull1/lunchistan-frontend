import { useMemo, useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MOCK_MENU } from './data/mockMenu'
import type { CartState, Dish, Screen } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  // Временно отключён fetch к бэкенду — используем локальный MOCK_MENU.
  const [dishes] = useState<Dish[]>(MOCK_MENU)
  const [cart, setCart] = useState<CartState>({})
  const loading = false
  const error = ''

  const incrementDish = (dish: Dish) => {
    setCart((prev) => ({ ...prev, [dish.id]: (prev[dish.id] ?? 0) + 1 }))
  }

  const decrementDish = (dish: Dish) => {
    setCart((prev) => {
      const current = prev[dish.id] ?? 0
      if (current <= 1) {
        const next = { ...prev }
        delete next[dish.id]
        return next
      }
      return { ...prev, [dish.id]: current - 1 }
    })
  }

  const itemsCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  )

  const total = useMemo(
    () =>
      dishes.reduce(
        (sum, dish) => sum + dish.price * (cart[dish.id] ?? 0),
        0
      ),
    [dishes, cart]
  )

  const handlePay = () => {
    setScreen('success')
  }

  const handleNewOrder = () => {
    setCart({})
    setScreen('catalog')
  }

  return (
    <div className="app">
      {screen === 'catalog' && (
        <Catalog
          dishes={dishes}
          cart={cart}
          loading={loading}
          error={error}
          total={total}
          itemsCount={itemsCount}
          onIncrement={incrementDish}
          onDecrement={decrementDish}
          onGoToCart={() => setScreen('cart')}
        />
      )}

      {screen === 'cart' && (
        <Cart
          dishes={dishes}
          cart={cart}
          total={total}
          onIncrement={incrementDish}
          onDecrement={decrementDish}
          onBack={() => setScreen('catalog')}
          onPay={handlePay}
        />
      )}

      {screen === 'success' && <Success onNewOrder={handleNewOrder} />}
    </div>
  )
}

export default App
