import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MOCK_MENU } from './data/mockMenu'
import type { CartState, Dish, PaymentMethod, Screen } from './types'

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [cart, setCart] = useState<CartState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadMenu = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await axios.get<Dish[]>(
          `${import.meta.env.VITE_API_URL}/api/menu`
        )
        if (cancelled) return
        // Если бэкенд вернул пустой массив — используем моковые данные.
        setDishes(data && data.length > 0 ? data : MOCK_MENU)
      } catch {
        if (cancelled) return
        // При ошибке тоже показываем моковые данные, чтобы верстать UI.
        setDishes(MOCK_MENU)
        setError('Меню загружено в тестовом режиме (нет связи с сервером).')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMenu()
    return () => {
      cancelled = true
    }
  }, [])

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

  const handlePay = (_method: PaymentMethod) => {
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
