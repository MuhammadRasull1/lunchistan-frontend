import type { MealSet } from '../types'
import { formatPrice } from '../types'

interface SetCardProps {
  set: MealSet
  quantity: number
  onIncrement: (set: MealSet) => void
  onDecrement: (set: MealSet) => void
}

function SetCard({ set, quantity, onIncrement, onDecrement }: SetCardProps) {
  const classes = ['set-card', quantity > 0 ? 'set-card--active' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <article className={classes}>
      <div className="set-card__head">
        <div className="set-card__badge" aria-hidden="true">
          🍱
        </div>
        <div className="set-card__title-wrap">
          <h3 className="set-card__name">{set.name}</h3>
          <span className="set-card__tag">Комплексный обед</span>
        </div>
        {quantity > 0 && (
          <span className="set-card__qty-badge">{quantity}</span>
        )}
      </div>

      <p className="set-card__composition-label">Состав сета</p>
      <p className="set-card__description">{set.description}</p>

      <div className="set-card__footer">
        <span className="set-card__price">{formatPrice(set.price)}</span>

        <div className="counter">
          <button
            type="button"
            className="counter__btn"
            aria-label="Убрать один сет"
            disabled={quantity === 0}
            onClick={() => onDecrement(set)}
          >
            −
          </button>
          <span className="counter__value">{quantity}</span>
          <button
            type="button"
            className="counter__btn counter__btn--add"
            aria-label="Добавить один сет"
            onClick={() => onIncrement(set)}
          >
            +
          </button>
        </div>
      </div>
    </article>
  )
}

export default SetCard
