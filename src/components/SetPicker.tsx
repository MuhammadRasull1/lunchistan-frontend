import { useMemo, useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import type { Lang, SetCategory } from '../types'
import { t } from '../locales/translations'
import { MONTHLY_SETS } from '../data/mockMenu'
import type { SetOfDay } from '../lib/api'

interface SetPickerProps {
  isOpen: boolean
  lang: Lang
  current: SetOfDay | null
  onPick: (setId: number) => void
  onClose: () => void
}

const CATEGORY_LABELS: Record<SetCategory, [string, string]> = {
  hot: ['Горячее', 'Issiq taom'],
  salad: ['Салат', 'Salat'],
  side: ['Гарнир', 'Garnir'],
  fastfood: ['Фастфуд', 'Fastfud'],
  appetizer: ['Закуска', 'Yegulik'],
  soup: ['Суп', "Sho'rva"],
}

export default function SetPicker({ isOpen, lang, current, onPick, onClose }: SetPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MONTHLY_SETS
    return MONTHLY_SETS.filter(set => set.name.toLowerCase().includes(q))
  }, [query])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
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
          {filtered.length === 0 && <p className="set-picker-empty">{t(lang, 'searchEmpty')}</p>}
          {filtered.map(set => {
            const cat = CATEGORY_LABELS[set.category] ?? [set.category, set.category]
            const active = current != null && Number(set.id) === current.setId
            return (
              <button
                key={String(set.id)}
                className={`set-picker-item${active ? ' set-picker-item--current' : ''}`}
                onClick={() => {
                  onPick(Number(set.id))
                  onClose()
                }}
              >
                <span className="set-picker-item__info">
                  <span className="set-picker-item__name">{set.name}</span>
                  <span className="set-picker-item__price">
                    {lang === 'uz' ? cat[1] : cat[0]} · {set.price.toLocaleString('ru-RU')} {lang === 'uz' ? "so'm" : 'сум'}
                  </span>
                </span>
                {active && <span className="set-picker-item__badge">{t(lang, 'currentSet')}</span>}
                {active && <Check size={18} className="set-picker-item__check" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}