import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { MONTHLY_SETS } from '../data/mockMenu'
import type { SetOfDay } from '../lib/api'

interface SetPickerProps {
  isOpen: boolean
  lang: Lang
  /** Текущий выбранный сет (для подсветки) */
  current?: SetOfDay | null
  onPick: (setId: number) => void
  onClose: () => void
}

const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 } },
  exit: { y: '100%', transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 } },
}

const CATEGORY_LABELS: Record<string, [string, string]> = {
  hot: ['Горячее', 'Issiq'],
  salad: ['Салат', 'Salat'],
  side: ['Гарнир', 'Garnir'],
  fastfood: ['Фастфуд', 'Fastfud'],
  appetizer: ['Закуска', 'Aperitiv'],
  soup: ['Суп', "Sho'rva"],
}

export default function SetPicker({ isOpen, lang, current, onPick, onClose }: SetPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MONTHLY_SETS
    return MONTHLY_SETS.filter(set => set.name.toLowerCase().includes(q))
  }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-sheet"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-sheet__handle" />
            <div className="set-picker__head">
              <h2 className="modal-sheet__title">{t(lang, 'setPickTitle')}</h2>
              <span className="set-picker__count">{t(lang, 'availableSets', { n: MONTHLY_SETS.length })}</span>
              <button className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'closeModal')}>
                <X size={20} />
              </button>
            </div>

            <div className="set-picker__search">
              <Search size={16} className="set-picker__search-icon" />
              <input
                className="set-picker__search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t(lang, 'searchSets')}
              />
            </div>

            <div className="modal-sheet__scroll set-picker__list">
              {filtered.map(set => {
                const cat = CATEGORY_LABELS[set.category] ?? [set.category, set.category]
                const active = current != null && Number(set.id) === current.setId
                return (
                  <button
                    key={set.id}
                    className={`set-picker-item${active ? ' set-picker-item--active' : ''}`}
                    onClick={() => {
                      onPick(Number(set.id))
                      onClose()
                    }}
                  >
                    <span className="set-picker-item__icon">{set.composition[0]?.icon ?? '🍽️'}</span>
                    <span className="set-picker-item__body">
                      <span className="set-picker-item__name">{set.name}</span>
                      <span className="set-picker-item__meta">
                        {lang === 'uz' ? cat[1] : cat[0]} · {set.price.toLocaleString('ru-RU')} {lang === 'uz' ? "so'm" : 'сум'}
                      </span>
                    </span>
                    {active && <span className="set-picker-item__check"><Check size={18} /></span>}
                  </button>
                )
              })}
              {filtered.length === 0 && <p className="set-picker__empty">{t(lang, 'reportEmpty')}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}