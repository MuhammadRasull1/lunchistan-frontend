import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Beef, Droplets, Wheat, UtensilsCrossed, Check } from 'lucide-react'
import type { LunchSet } from '../types'
import { formatPrice } from '../types'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

interface SetDetailModalProps {
  set: LunchSet | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

/** Форматирование макроса */
function formatMacro(value: number | undefined, suffix: string): string {
  if (value === undefined || value === null) return '—'
  return `${value} ${suffix}`
}

/** Карточка макроса */
function MacroCard({ icon: Icon, label, value, unit, color }: {
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

function SetDetailModal({ set, isOpen, onClose, onConfirm }: SetDetailModalProps) {
  return (
    <AnimatePresence>
      {isOpen && set && (
        <>
          {/* Оверлей */}
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

            {/* Контент (с отступом снизу для фиксированной плашки) */}
            <div className="modal-sheet__scroll">
              {/* Изображение блюда — сочная обложка во всю ширину */}
              <img
                className="modal-sheet__cover"
                src={set.imageUrl || ''}
                alt={set.name}
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.dataset.fallbackAttempted) {
                    target.dataset.fallbackAttempted = 'true'
                    target.src = FALLBACK_IMAGE
                  }
                }}
              />

              {/* Заголовок */}
              <div className="modal-sheet__header">
                <h2 className="modal-sheet__title">{set.name}</h2>
                <span className="modal-sheet__day">День {set.dayNumber} · {set.weekDay}</span>
              </div>

              {/* Состав — аккуратные плашки */}
              <div className="modal-sheet__composition">
                {set.composition.map((item) => (
                  <div key={item.name} className="modal-sheet__chip">
                    <UtensilsCrossed size={14} strokeWidth={2.2} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>

              {/* KBJU — Пищевая ценность */}
              <div className="modal-sheet__kbju">
                <div className="modal-sheet__kbju-header">
                  <Flame size={16} strokeWidth={2.5} />
                  <span>Пищевая ценность на порцию</span>
                </div>
                <div className="modal-sheet__kbju-grid">
                  <MacroCard icon={Beef} label="Белки" value={set.proteins} unit="г" color="rgba(239, 68, 68, 0.12)" />
                  <MacroCard icon={Droplets} label="Жиры" value={set.fats} unit="г" color="rgba(245, 158, 11, 0.12)" />
                  <MacroCard icon={Wheat} label="Углеводы" value={set.carbs} unit="г" color="rgba(59, 130, 246, 0.12)" />
                  <MacroCard icon={Flame} label="Калории" value={set.calories} unit="ккал" color="rgba(249, 115, 22, 0.12)" />
                </div>
              </div>
            </div>

            {/* Фиксированная нижняя плашка */}
            <div className="modal-sheet__bar">
              <div className="modal-sheet__bar-price">
                <span className="modal-sheet__bar-price-label">Цена за порцию</span>
                <span className="modal-sheet__bar-price-value">{formatPrice(set.price)}</span>
              </div>
              <motion.button
                type="button"
                className="modal-sheet__bar-btn"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Check size={18} strokeWidth={3} />
                Выбрать
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SetDetailModal
