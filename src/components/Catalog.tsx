import { useState } from 'react'
import type { CartState, Dish, WeekDay } from '../types'
import { WEEK_DAYS, formatPrice } from '../types'
import DishCard from './DishCard'

interface CatalogProps {
  dishes: Dish[]
  cart: CartState
  loading: boolean
  error: string
  total: number
  itemsCount: number
  onIncrement: (dish: Dish) => void
  onDecrement: (dish: Dish) => void
  onGoToCart: () => void
}

function Catalog({
  dishes,
  cart,
  loading,
  error,
  total,
  itemsCount,
  onIncrement,
  onDecrement,
  onGoToCart,
}: CatalogProps) {
  const [activeDay, setActiveDay] = useState<WeekDay>('Пн')

  const visibleDishes = dishes.filter(
    (dish) => dish.day == null || dish.day === activeDay
  )

  return (
    <div className="catalog">
      <header className="catalog__header">
        <div className="brand">
          <span className="brand__logo">🍽️</span>
          <span>
            Lunch<span className="brand__accent">istan</span>
          </span>
        </div>
        <p className="catalog__subtitle">Меню обедов для вашей команды</p>
      </header>

      <nav className="tabs" role="tablist" aria-label="Дни недели">
        {WEEK_DAYS.map((day) => (
          <button
            key={day}
            role="tab"
            aria-selected={activeDay === day}
            className={`tabs__tab${activeDay === day ? ' tabs__tab--active' : ''}`}
            onClick={() => setActiveDay(day)}
          >
            {day}
          </button>
        ))}
      </nav>

      {loading && <p className="catalog__status">Загружаем меню…</p>}
      {error && <p className="catalog__status catalog__status--error">{error}</p>}

      {!loading && (
        <div className="catalog__grid">
          {visibleDishes.length === 0 ? (
            <p className="catalog__status">На этот день блюд пока нет.</p>
          ) : (
            visibleDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                quantity={cart[dish.id] ?? 0}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            ))
          )}
        </div>
      )}

      {itemsCount > 0 && (
        <div className="sticky-bar">
          <div className="sticky-bar__info">
            <span className="sticky-bar__count">
              {itemsCount}{' '}
              {itemsCount === 1 ? 'порция' : itemsCount < 5 ? 'порции' : 'порций'}
            </span>
            <span className="sticky-bar__total">{formatPrice(total)}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={onGoToCart}>
            Перейти в корзину
          </button>
        </div>
      )}
    </div>
  )
}

export default Catalog
