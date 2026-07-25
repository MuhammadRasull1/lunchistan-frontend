import type { LunchSet } from '../types'
import { formatPrice } from '../types'

interface SetCardProps {
  set: LunchSet
  active: boolean
  beverage: string
  onBeverageChange: (beverage: string) => void
  onToggle: () => void
}

function SetCard({ set, active, beverage, onBeverageChange, onToggle }: SetCardProps) {
  return (
    <article className={`set-card${active ? ' set-card--active' : ''}`}>
      <div className="set-card__head">
        <label className="set-card__toggle">
          <input
            type="checkbox"
            className="set-card__checkbox"
            checked={active}
            onChange={onToggle}
            aria-label={`${active ? 'Исключить' : 'Включить'} ${set.name}`}
          />
          <span className="set-card__toggle-track">
            <span className="set-card__toggle-thumb" />
          </span>
        </label>
        <div className="set-card__badge" aria-hidden="true">🍱</div>
        <div className="set-card__title-wrap">
          <h3 className="set-card__name">{set.name}</h3>
          <span className="set-card__tag">
            День {set.dayNumber} · {set.weekDay}
          </span>
        </div>
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
              disabled={!active}
            >
              💧 Вода
            </button>
            <button
              type="button"
              className={`pill${beverage === 'Компот в ассортименте' ? ' pill--active' : ''}`}
              onClick={() => onBeverageChange('Компот в ассортименте')}
              disabled={!active}
            >
              🧃 Компот
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default SetCard
