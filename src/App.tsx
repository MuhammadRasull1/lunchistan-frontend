import { useMemo, useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MOCK_SETS } from './data/mockMenu'
import type { CartState, MealSet, Screen } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  // Временно отключён fetch к бэкенду — используем локальный MOCK_SETS.
  const [sets] = useState<MealSet[]>(MOCK_SETS)
  const [cart, setCart] = useState<CartState>({})
  const loading = false
  const error = ''

  const incrementSet = (set: MealSet) => {
    setCart((prev) => ({ ...prev, [set.id]: (prev[set.id] ?? 0) + 1 }))
  }

  const decrementSet = (set: MealSet) => {
    setCart((prev) => {
      const current = prev[set.id] ?? 0
      if (current <= 1) {
        const next = { ...prev }
        delete next[set.id]
        return next
      }
      return { ...prev, [set.id]: current - 1 }
    })
  }

  const itemsCount = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  )

  const total = useMemo(
    () => sets.reduce((sum, set) => sum + set.price * (cart[set.id] ?? 0), 0),
    [sets, cart]
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
          sets={sets}
          cart={cart}
          loading={loading}
          error={error}
          total={total}
          itemsCount={itemsCount}
          onIncrement={incrementSet}
          onDecrement={decrementSet}
          onGoToCart={() => setScreen('cart')}
        />
      )}

      {screen === 'cart' && (
        <Cart
          sets={sets}
          cart={cart}
          total={total}
          onIncrement={incrementSet}
          onDecrement={decrementSet}
          onBack={() => setScreen('catalog')}
          onPay={handlePay}
        />
      )}

      {screen === 'success' && <Success onNewOrder={handleNewOrder} />}
    </div>
  )
}

export default App
