import { useState } from 'react'
import type { CartState, MealSet, WeekDay } from '../types'
import { WEEK_DAYS, formatPrice } from '../types'
import SetCard from './SetCard'

interface CatalogProps {
  sets: MealSet[]
  cart: CartState
  loading: boolean
  error: string
  total: number
  itemsCount: number
  onIncrement: (set: MealSet) => void
  onDecrement: (set: MealSet) => void
  onGoToCart: () => void
}

function Catalog({
  sets,
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

  const visibleSets = sets.filter(
    (set) => set.day == null || set.day === activeDay
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
        <p className="catalog__subtitle">
          Готовые сет-обеды для вашей команды
        </p>
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
        <div className="catalog__grid catalog__grid--sets">
          {visibleSets.length === 0 ? (
            <p className="catalog__status">На этот день сетов пока нет.</p>
          ) : (
            visibleSets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                quantity={cart[set.id] ?? 0}
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
              {itemsCount === 1 ? 'сет' : itemsCount < 5 ? 'сета' : 'сетов'}
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
