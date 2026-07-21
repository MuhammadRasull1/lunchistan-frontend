import type { LunchSet } from '../types'
import { formatPrice } from '../types'

interface SetCardProps {
  set: LunchSet
  quantity: number
  beverage: string
  onBeverageChange: (beverage: string) => void
  onQuantityChange: (delta: number) => void
}

function SetCard({ set, quantity, beverage, onBeverageChange, onQuantityChange }: SetCardProps) {
  return (
    <article className={`set-card${quantity > 0 ? ' set-card--active' : ''}`}>
      <div className="set-card__head">
        <div className="set-card__badge" aria-hidden="true">🍱</div>
        <div className="set-card__title-wrap">
          <h3 className="set-card__name">{set.name}</h3>
          <span className="set-card__tag">
            День {set.dayNumber} · {set.weekDay}
          </span>
        </div>
        {quantity > 0 && (
          <span className="set-card__qty-badge">{quantity}</span>
        )}
      </div>

      <p className="set-card__description">{set.description}</p>

      <div className="set-card__footer">
        <span className="set-card__price">{formatPrice(set.price)}</span>
        <span className="set-card__per-day">за день</span>
      </div>

      <div className="set-card__actions">
        <div className="set-card__drink">
          <label className="set-card__drink-label">Напиток</label>
          <div className="pill-group">
            <button
              type="button"
              className={`pill${beverage === 'Вода' ? ' pill--active' : ''}`}
              onClick={() => onBeverageChange('Вода')}
            >
              💧 Вода
            </button>
            <button
              type="button"
              className={`pill${beverage === 'Компот в ассортименте' ? ' pill--active' : ''}`}
              onClick={() => onBeverageChange('Компот в ассортименте')}
            >
              🧃 Компот
            </button>
          </div>
        </div>

        <div className="set-card__qty">
          <label className="set-card__drink-label">Кол-во</label>
          <div className="counter counter--sm">
            <button
              type="button"
              className="counter__btn"
              aria-label="Убрать один сет"
              disabled={quantity <= 0}
              onClick={() => onQuantityChange(-1)}
            >
              −
            </button>
            <span className="counter__value">{quantity}</span>
            <button
              type="button"
              className="counter__btn counter__btn--add"
              aria-label="Добавить один сет"
              onClick={() => onQuantityChange(1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default SetCard
