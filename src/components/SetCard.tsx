import { motion } from 'framer-motion'
import { UtensilsCrossed, LeafyGreen, Croissant, Wine } from 'lucide-react'
import type { LunchSet } from '../types'
import { formatPrice } from '../types'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

interface SetCardProps {
  set: LunchSet
  index: number
  active: boolean
  onSelect?: () => void
}

function getCompositionIcon(name: string) {
  if (name.includes('Салат')) return LeafyGreen
  if (name.includes('Лепёшка') || name.includes('хлеб')) return Croissant
  if (name.includes('Напиток')) return Wine
  return UtensilsCrossed
}

function SetCard({ set, index, active, onSelect }: SetCardProps) {
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
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
    >
      {/* Изображение сета — баннер во всю ширину */}
      <div className="set-card__hero">
        <img
          className="set-card__hero-img"
          src={set.imageUrl || ''}
          alt={set.name}
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget
            if (!target.dataset.fallbackAttempted) {
              target.dataset.fallbackAttempted = 'true'
              target.src = FALLBACK_IMAGE
            }
          }}
        />
        {active && (
          <div className="set-card__hero-badge">{set.dayNumber}</div>
        )}
      </div>

      {/* Информация под изображением */}
      <div className="set-card__body">
        {/* Название */}
        <h3 className="set-card__name">
          {active
            ? set.name
            : <span className="set-card__name--strikethrough">{set.name}</span>
          }
        </h3>
        <span className="set-card__tag">День {set.dayNumber} · {set.weekDay}</span>

        {/* Composition chips */}
        {active && set.composition && (
          <div className="set-card__composition">
            {set.composition.map((item) => {
              const IconComp = getCompositionIcon(item.name)
              return (
                <div key={item.name} className="set-card__chip">
                  <IconComp size={13} strokeWidth={2.2} />
                  <span className="set-card__chip-text">{item.name}</span>
                </div>
              )
            })}
          </div>
        )}

        {!active && (
          <p className="set-card__description">{set.description}</p>
        )}

        {/* Цена */}
        <div className="set-card__price-row">
          <span className="set-card__price">{formatPrice(set.price)}</span>
          <span className="set-card__per-day">за порцию</span>
        </div>
      </div>
    </motion.article>
  )
}

export default SetCard
