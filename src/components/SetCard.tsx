import { motion, LayoutGroup } from 'framer-motion'
import { UtensilsCrossed, LeafyGreen, Croissant, Wine } from 'lucide-react'
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

function getCompositionIcon(name: string) {
  if (name.includes('Салат')) return LeafyGreen
  if (name.includes('Лепёшка') || name.includes('хлеб')) return Croissant
  if (name.includes('Напиток')) return Wine
  return UtensilsCrossed
}

function SetCard({ set, index, active, portions, beverage, onBeverageChange, onToggle, onPortionChange }: SetCardProps) {
  return (
    <motion.article
      className={`set-card${active ? ' set-card--active' : ' set-card--inactive'}`}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay: (index % 6) * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={active ? { y: -4, scale: 1.01, transition: { duration: 0.25, ease: 'easeOut' } } : undefined}
    >
      {/* Шапка: toggle + название */}
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
        <div className="set-card__title-wrap">
          <h3 className="set-card__name">
            {active ? set.name : <span className="set-card__name--strikethrough">{set.name}</span>}
          </h3>
          <span className="set-card__tag">
            День {set.dayNumber} · {set.weekDay}
          </span>
        </div>
        {active && (
          <div className="set-card__day-badge">
            <span className="set-card__day-badge-text">День {set.dayNumber}</span>
          </div>
        )}
      </div>

      {/* Состав обеда — премиум чипсы с иконками */}
      {active && set.composition && (
        <div className="set-card__composition">
          {set.composition.map((item) => {
            const IconComp = getCompositionIcon(item.name)
            return (
              <div key={item.name} className="set-card__chip">
                <IconComp size={14} strokeWidth={2.2} />
                <span className="set-card__chip-text">{item.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Описание (на случай отсутствия composition) */}
      {(!active || !set.composition) && (
        <p className="set-card__description">{set.description}</p>
      )}

      {/* Цена */}
      <div className="set-card__footer">
        <div className="set-card__price-wrap">
          <span className="set-card__price">{formatPrice(set.price)}</span>
          <span className="set-card__per-day">за день / порцию</span>
        </div>
      </div>

      {/* Действия: счётчик порций + напиток (только если день активен) */}
      <div className="set-card__actions">
        {active ? (
          <>
            {/* Счётчик порций */}
            <div className="set-card__qty">
              <label className="set-card__drink-label">Порций</label>
              <div className="counter counter--sm">
                <motion.button
                  type="button"
                  className="counter__btn"
                  aria-label="Уменьшить количество порций"
                  disabled={portions <= 1}
                  onClick={() => onPortionChange(-1)}
                  whileTap={{ scale: 0.85 }}
                >
                  −
                </motion.button>
                <motion.span
                  className="counter__value"
                  key={portions}
                  initial={{ scale: 1.3, color: '#ea580c' }}
                  animate={{ scale: 1, color: '#1f2937' }}
                  transition={{ duration: 0.2 }}
                >
                  {portions}
                </motion.span>
                <motion.button
                  type="button"
                  className="counter__btn counter__btn--add"
                  aria-label="Увеличить количество порций"
                  onClick={() => onPortionChange(1)}
                  whileTap={{ scale: 0.85 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Выбор напитка — премиум pill-кнопки */}
            <div className="set-card__drink">
              <label className="set-card__drink-label">Напиток</label>
              <div className="pill-group pill-group--premium">
                <LayoutGroup>
                  <motion.button
                    type="button"
                    className={`pill pill--premium${beverage === 'Вода' ? ' pill--active' : ''}`}
                    onClick={() => onBeverageChange('Вода')}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {beverage === 'Вода' && (
                      <motion.span
                        className="pill__dot"
                        layoutId="pillDot"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="pill__icon">💧</span>
                    <span>Вода</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    className={`pill pill--premium${beverage === 'Компот в ассортименте' ? ' pill--active' : ''}`}
                    onClick={() => onBeverageChange('Компот в ассортименте')}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    {beverage === 'Компот в ассортименте' && (
                      <motion.span
                        className="pill__dot"
                        layoutId="pillDot"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="pill__icon">🧃</span>
                    <span>Компот</span>
                  </motion.button>
                </LayoutGroup>
              </div>
            </div>
          </>
        ) : (
          <div className="set-card__inactive-msg">
            <span className="set-card__inactive-text">
              <LeafyGreen size={16} strokeWidth={1.5} />
              &nbsp;День пропущен
            </span>
          </div>
        )}
      </div>
    </motion.article>
  )
}

export default SetCard
