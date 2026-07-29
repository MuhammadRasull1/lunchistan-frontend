import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Beef, Droplets, Wheat, UtensilsCrossed } from 'lucide-react'
import type { LunchSet, Beverage } from '../types'
import { formatPrice } from '../types'

interface SetDetailModalProps {
  set: LunchSet | null
  beverage: string
  isOpen: boolean
  onClose: () => void
  onBeverageChange: (beverage: Beverage) => void
  onConfirm: () => void
}

/** Плавный перевод числового значения в строку с единицей */
function formatMacro(value: number | undefined, suffix: string): string {
  if (value === undefined || value === null) return '—'
  return `${value} ${suffix}`
}

/** Иконка для макроса */
function MacroIcon({ icon: Icon, label, value, unit, color }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  value: number | undefined
  unit: string
  color: string
}) {
  return (
    <div className="modal-macro">
      <div className="modal-macro__icon" style={{ background: color }}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="modal-macro__info">
        <span className="modal-macro__value">{formatMacro(value, unit)}</span>
        <span className="modal-macro__label">{label}</span>
      </div>
    </div>
  )
}

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 },
  },
  exit: {
    y: '100%',
    transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 },
  },
}

function SetDetailModal({ set, beverage, isOpen, onClose, onBeverageChange, onConfirm }: SetDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && set && (
        <>
          {/* Оверлей с backdrop-blur */}
          <motion.div
            className="modal-overlay"
            key="modal-overlay"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="modal-sheet"
            key="modal-sheet"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose()
              }
            }}
          >
            {/* Свайп-индикатор */}
            <div className="modal-sheet__handle" />

            {/* Кнопка закрытия */}
            <button
              type="button"
              className="modal-sheet__close"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Изображение блюда */}
            <div className="modal-sheet__image-wrap">
              <div className="modal-sheet__image">
                <span className="modal-sheet__emoji">{set.imageUrl || '🍽️'}</span>
              </div>
            </div>

            {/* Контент */}
            <div className="modal-sheet__content">
              {/* Заголовок */}
              <div className="modal-sheet__header">
                <h2 className="modal-sheet__title">{set.name}</h2>
                <span className="modal-sheet__day">День {set.dayNumber} · {set.weekDay}</span>
              </div>

              {/* Composition chips */}
              <div className="modal-sheet__composition">
                {set.composition.map((item) => (
                  <div key={item.name} className="modal-sheet__chip">
                    <UtensilsCrossed size={13} strokeWidth={2.2} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>

              {/* KBJU блок */}
              <div className="modal-sheet__kbju">
                <div className="modal-sheet__kbju-header">
                  <Flame size={16} strokeWidth={2.5} />
                  <span>Пищевая ценность</span>
                  <span className="modal-sheet__kbju-cal">{formatMacro(set.calories, 'ккал')}</span>
                </div>
                <div className="modal-sheet__kbju-grid">
                  <MacroIcon icon={Beef} label="Белки" value={set.proteins} unit="г" color="rgba(239, 68, 68, 0.12)" />
                  <MacroIcon icon={Droplets} label="Жиры" value={set.fats} unit="г" color="rgba(245, 158, 11, 0.12)" />
                  <MacroIcon icon={Wheat} label="Углеводы" value={set.carbs} unit="г" color="rgba(59, 130, 246, 0.12)" />
                  <MacroIcon icon={Flame} label="Калории" value={set.calories} unit="ккал" color="rgba(249, 115, 22, 0.12)" />
                </div>
              </div>

              {/* Выбор напитка */}
              <div className="modal-sheet__beverage">
                <label className="modal-sheet__beverage-label">Напиток</label>
                <div className="modal-sheet__pill-group">
                  <button
                    type="button"
                    className={`modal-sheet__pill${beverage === 'Вода' ? ' modal-sheet__pill--active' : ''}`}
                    onClick={() => onBeverageChange('Вода')}
                  >
                    <span className="modal-sheet__pill-icon">💧</span>
                    <span>Вода</span>
                  </button>
                  <button
                    type="button"
                    className={`modal-sheet__pill${beverage === 'Компот в ассортименте' ? ' modal-sheet__pill--active' : ''}`}
                    onClick={() => onBeverageChange('Компот в ассортименте')}
                  >
                    <span className="modal-sheet__pill-icon">🧃</span>
                    <span>Компот</span>
                  </button>
                </div>
              </div>

              {/* Цена */}
              <div className="modal-sheet__price">
                <span className="modal-sheet__price-label">Цена за порцию</span>
                <span className="modal-sheet__price-value">{formatPrice(set.price)}</span>
              </div>

              {/* Кнопка подтверждения */}
              <motion.button
                type="button"
                className="modal-sheet__confirm"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Выбрать этот обед
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SetDetailModal
