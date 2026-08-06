import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Beef, Droplets, Wheat, Check, Wine, Droplet, Lock, Users } from 'lucide-react'
import type { LunchSet, Beverage, Lang } from '../types'
import { formatPrice } from '../types'
import { t, localizeIngredient } from '../locales/translations'
import Stepper from './Stepper'
import { hapticImpact } from '../lib/telegram'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

interface SetDetailModalProps {
  set: LunchSet | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  lang: Lang
  beverage: Beverage
  onBeverageChange: (beverage: Beverage) => void
  onApplyBeverageToAll: (beverage: Beverage) => void
  portions: number
  onPortionsChange: (portions: number) => void
  excludedIngredients: string[]
  onToggleExcluded: (name: string) => void
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

const BEVERAGE_OPTIONS: { value: Beverage; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: 'Вода', label: 'Вода', icon: Droplet },
  { value: 'Компот в ассортименте', label: 'Компот', icon: Wine },
]

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

function SetDetailModal({ set, isOpen, onClose, onConfirm, lang, beverage, onBeverageChange, onApplyBeverageToAll, portions, onPortionsChange, excludedIngredients, onToggleExcluded }: SetDetailModalProps) {
  const includedItems = set
    ? set.composition.filter(item => !excludedIngredients.includes(item.name))
    : []
  const excludedItems = set
    ? set.composition.filter(item => excludedIngredients.includes(item.name))
    : []
  const beverageExcluded = excludedIngredients.includes('Напиток')

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
              aria-label={t(lang, 'close')}
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
                <span className="modal-sheet__day">{t(lang, 'day')} {set.dayNumber} · {set.weekDay}</span>
              </div>

              {/* Состав — аккуратные плашки */}
              <div className="modal-sheet__composition">
                {includedItems.map((item) => {
                  const isMain = item.optional !== true
                  const chipClass = `modal-sheet__chip${isMain ? ' modal-sheet__chip--locked' : ' modal-sheet__chip--clickable'}`
                  return (
                    <motion.button
                      key={item.name}
                      type="button"
                      disabled={isMain}
                      className={chipClass}
                      title={isMain ? t(lang, 'mainDishLocked') : undefined}
                      onClick={() => onToggleExcluded(item.name)}
                      whileTap={isMain ? undefined : { scale: 0.95 }}
                    >
                      <span className="modal-sheet__chip-icon">{item.icon}</span>
                      <span>{localizeIngredient(lang, item.name)}</span>
                      {isMain && <Lock size={12} strokeWidth={2.5} />}
                    </motion.button>
                  )
                })}
              </div>

              {excludedItems.length === 0 && (
                <span className="modal-sheet__excluded-hint">{t(lang, 'excludeHint')}</span>
              )}

              {/* Исключённые ингредиенты */}
              {excludedItems.length > 0 && (
                <div className="modal-sheet__excluded">
                  <span className="modal-sheet__excluded-label">{t(lang, 'excludedIngredients')}</span>
                  <div className="modal-sheet__excluded-chips">
                    {excludedItems.map((item) => (
                      <motion.button
                        key={item.name}
                        type="button"
                        className="modal-sheet__chip modal-sheet__chip--excluded"
                        onClick={() => onToggleExcluded(item.name)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="modal-sheet__chip-icon">{item.icon}</span>
                        <span>{localizeIngredient(lang, item.name)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Выбор напитка — стильные pill-кнопки */}
              <div className={`beverage-select${beverageExcluded ? ' beverage-select--disabled' : ''}`}>
                <span className="beverage-select__label">
                  <Wine size={14} strokeWidth={2.5} />
                  {t(lang, 'beverage')}
                </span>
                <div className="beverage-select__pills" aria-disabled={beverageExcluded}>
                  {BEVERAGE_OPTIONS.map(opt => {
                    const active = !beverageExcluded && beverage === opt.value
                    const Icon = opt.icon
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        disabled={beverageExcluded}
                        className={`beverage-pill${active ? ' beverage-pill--active' : ''}`}
                        onClick={() => {
                          if (beverageExcluded) return
                          hapticImpact('light')
                          onBeverageChange(opt.value)
                        }}
                        whileTap={beverageExcluded ? undefined : { scale: 0.94 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Icon size={16} strokeWidth={active ? 2.8 : 2.2} />
                        <span>{t(lang, opt.value === 'Вода' ? 'water' : 'compote')}</span>
                      </motion.button>
                    )
                  })}
                </div>
                {beverageExcluded && (
                  <span className="beverage-select__hint">{t(lang, 'beverageExcludedHint')}</span>
                )}
                {!beverageExcluded && (
                  <button
                    type="button"
                    className="btn btn--outline beverage-select__apply-all"
                    onClick={() => {
                      hapticImpact('light')
                      onApplyBeverageToAll(beverage)
                    }}
                  >
                    {t(lang, 'applyBeverageToAll')}
                  </button>
                )}
              </div>

              {/* Порций на сотрудника */}
              <div className="portions-select">
                <span className="portions-select__label">
                  <Users size={14} strokeWidth={2.5} />
                  {t(lang, 'portionsLabel')}
                </span>
                <Stepper
                  value={portions}
                  min={1}
                  onSet={onPortionsChange}
                  ariaDecrease={t(lang, 'stepDecrease')}
                  ariaIncrease={t(lang, 'stepIncrease')}
                />
              </div>

              {/* KBJU — Пищевая ценность */}
              <div className="modal-sheet__kbju">
                <div className="modal-sheet__kbju-header">
                  <Flame size={16} strokeWidth={2.5} />
                  <span>{t(lang, 'nutritionalValue')}</span>
                </div>
                <div className="modal-sheet__kbju-grid">
                  <MacroCard icon={Beef} label={t(lang, 'proteins')} value={set.proteins} unit="г" color="rgba(239, 68, 68, 0.12)" />
                  <MacroCard icon={Droplets} label={t(lang, 'fats')} value={set.fats} unit="г" color="rgba(245, 158, 11, 0.12)" />
                  <MacroCard icon={Wheat} label={t(lang, 'carbs')} value={set.carbs} unit="г" color="rgba(59, 130, 246, 0.12)" />
                  <MacroCard icon={Flame} label={t(lang, 'calories')} value={set.calories} unit="ккал" color="rgba(249, 115, 22, 0.12)" />
                </div>
              </div>
            </div>

            {/* Фиксированная нижняя плашка */}
            <div className="modal-sheet__bar">
              <div className="modal-sheet__bar-price">
                <span className="modal-sheet__bar-price-label">{t(lang, 'priceLabel')}</span>
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
                {t(lang, 'choose')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SetDetailModal
