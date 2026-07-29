import { motion } from 'framer-motion'
import type { LunchSet } from '../types'
import { formatPrice } from '../types'

interface SetCardProps {
  set: LunchSet
  index: number
  active: boolean
  portions: number
  beverage: string
  onBeverageChange: (beverage: string) => void
  onToggle: () => void
  onPortionChange: (delta: number) => void
}

function SetCard({ set, index, active, portions, beverage, onBeverageChange, onToggle, onPortionChange }: SetCardProps) {
  return (
    <motion.article
      className={`set-card${active ? ' set-card--active' : ''}`}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: (index % 6) * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
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
        {active ? (
          <>
            {/* Счётчик порций */}
            <div className="set-card__qty">
              <label className="set-card__drink-label">Порций</label>
              <div className="counter counter--sm">
                <button
                  type="button"
                  className="counter__btn"
                  aria-label="Уменьшить количество порций"
                  disabled={portions <= 1}
                  onClick={() => onPortionChange(-1)}
                >
                  −
                </button>
                <span className="counter__value">{portions}</span>
                <button
                  type="button"
                  className="counter__btn counter__btn--add"
                  aria-label="Увеличить количество порций"
                  onClick={() => onPortionChange(1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Выбор напитка */}
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
          </>
        ) : (
          <div className="set-card__inactive-msg">
            <span className="set-card__inactive-text">День пропущен</span>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default SetCard
