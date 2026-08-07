import { motion, AnimatePresence } from 'framer-motion'
import { X, Flame, Beef, Droplets, Wheat, Check, Wine, Droplet, Lock, Users, LeafyGreen } from 'lucide-react'
import type { LunchSet, Beverage, Salad, Lang } from '../types'
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
  salad: Salad
  onSaladChange: (salad: Salad) => void
  onApplySaladToAll: (salad: Salad) => void
  portions: number
  onPortionsChange: (portions: number) => void
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

const BEVERAGE_OPTIONS: { value: Beverage; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: 'Вода', icon: Droplet },
  { value: 'Компот в ассортименте', icon: Wine },
]

const SALAD_OPTIONS: { value: Salad; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { value: 'Оливье', icon: LeafyGreen },
  { value: 'Винегрет', icon: LeafyGreen },
  { value: 'Цезарь', icon: LeafyGreen },
]

/** Группа сегментированных пилюль для выбора одного варианта из фиксированного списка (салат/напиток) */
function OptionPillGroup<T extends string>({ icon: SectionIcon, label, options, value, onChange, onApplyToAll, applyAllLabel }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  options: { value: T; text: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[]
  value: T
  onChange: (value: T) => void
  onApplyToAll: () => void
  applyAllLabel: string
}) {
  return (
    <div className="option-select">
      <span className="option-select__label">
        <SectionIcon size={14} strokeWidth={2.5} />
        {label}
      </span>
      <div className="option-select__pills">
        {options.map(opt => {
          const active = value === opt.value
          const OptIcon = opt.icon
          return (
            <motion.button
              key={opt.value}
              type="button"
              className={`option-pill${active ? ' option-pill--active' : ''}`}
              onClick={() => {
                hapticImpact('light')
                onChange(opt.value)
              }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.15 }}
            >
              <OptIcon size={16} strokeWidth={active ? 2.8 : 2.2} />
              <span>{opt.text}</span>
            </motion.button>
          )
        })}
      </div>
      <button
        type="button"
        className="btn btn--outline option-select__apply-all"
        onClick={() => {
          hapticImpact('light')
          onApplyToAll()
        }}
      >
        {applyAllLabel}
      </button>
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

function SetDetailModal({ set, isOpen, onClose, onConfirm, lang, beverage, onBeverageChange, onApplyBeverageToAll, salad, onSaladChange, onApplySaladToAll, portions, onPortionsChange }: SetDetailModalProps) {
  const fixedItems = set
    ? set.composition.filter(item => item.name !== 'Салат' && item.name !== 'Напиток')
    : []

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

              {/* Состав — фиксированные, неизменяемые плашки */}
              <div className="modal-sheet__composition">
                {fixedItems.map((item) => {
                  const isMain = item.optional !== true
                  return (
                    <div
                      key={item.name}
                      className="modal-sheet__chip modal-sheet__chip--locked"
                      title={isMain ? t(lang, 'mainDishLocked') : undefined}
                    >
                      <span className="modal-sheet__chip-icon">{item.icon}</span>
                      <span>{localizeIngredient(lang, item.name)}</span>
                      {isMain && <Lock size={12} strokeWidth={2.5} />}
                    </div>
                  )
                })}
              </div>

              {/* Выбор салата */}
              <OptionPillGroup
                icon={LeafyGreen}
                label={t(lang, 'salad')}
                options={SALAD_OPTIONS.map(opt => ({ value: opt.value, text: opt.value, icon: opt.icon }))}
                value={salad}
                onChange={onSaladChange}
                onApplyToAll={() => onApplySaladToAll(salad)}
                applyAllLabel={t(lang, 'applySaladToAll')}
              />

              {/* Выбор напитка */}
              <OptionPillGroup
                icon={Wine}
                label={t(lang, 'beverage')}
                options={BEVERAGE_OPTIONS.map(opt => ({ value: opt.value, text: t(lang, opt.value === 'Вода' ? 'water' : 'compote'), icon: opt.icon }))}
                value={beverage}
                onChange={onBeverageChange}
                onApplyToAll={() => onApplyBeverageToAll(beverage)}
                applyAllLabel={t(lang, 'applyBeverageToAll')}
              />

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
