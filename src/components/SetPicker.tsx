import { useMemo, useState } from 'react'
import { X, Search, Check } from 'lucide-react'
import type { Lang, SetCategory, LunchSet, CartItem, Beverage, Salad } from '../types'
import { t } from '../locales/translations'
import { MONTHLY_SETS } from '../data/mockMenu'
import type { SetOfDay } from '../lib/api'
import SetCard from './SetCard'
import SetDetailModal from './SetDetailModal'
import { DEFAULT_SALAD } from './saladOptions'

interface SetPickerProps {
  isOpen: boolean
  lang: Lang
  current: SetOfDay | null
  /** Подпись дня, для которого выбирается блюдо (например «11.09 · Пт») */
  dayLabel?: string
  /** Текущая настройка дня (салат/напиток/порции) для предзаполнения детальной модалки;
      если не передан — клик по блюду выбирает его сразу (упрощённый режим) */
  item?: CartItem | null
  /** Общее число выбранных дней — для переключателя «Все дни / этот день» */
  daysCount?: number
  onBeverageChange?: (beverage: Beverage) => void
  onSaladChange?: (salad: Salad) => void
  onPortionsChange?: (portions: number) => void
  onPick: (setId: number) => void
  onClose: () => void
}

type CategoryFilter = SetCategory | 'all'

const CATEGORY_TABS: { value: CategoryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'categoryAll' },
  { value: 'hot', labelKey: 'categoryHot' },
  { value: 'salad', labelKey: 'categorySalad' },
  { value: 'side', labelKey: 'categorySide' },
  { value: 'fastfood', labelKey: 'categoryFastfood' },
  { value: 'appetizer', labelKey: 'categoryAppetizer' },
  { value: 'soup', labelKey: 'categorySoup' },
]

const CATEGORY_LABEL_KEY: Record<SetCategory, string> = {
  hot: 'categoryHot',
  salad: 'categorySalad',
  side: 'categorySide',
  fastfood: 'categoryFastfood',
  appetizer: 'categoryAppetizer',
  soup: 'categorySoup',
}

export default function SetPicker({ isOpen, lang, current, dayLabel, item, daysCount, onBeverageChange, onSaladChange, onPortionsChange, onPick, onClose }: SetPickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [pendingSet, setPendingSet] = useState<LunchSet | null>(null)
  // Богатый режим (карточка с настройкой салата/напитка/порций) — только когда передан item дня.
  const rich = item != null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MONTHLY_SETS.filter(set => {
      if (category !== 'all' && set.category !== category) return false
      if (q && !set.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, category])

  if (!isOpen) return null

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet set-picker" onClick={e => e.stopPropagation()}>
          <div className="modal-sheet__handle" />
          <div className="set-picker__head">
            <h2 className="modal-sheet__title">
              {t(lang, 'setPickTitle')}
              {dayLabel ? <span className="set-picker__day"> · {dayLabel}</span> : null}
            </h2>
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

          <div className="tabs set-picker__tabs" role="tablist">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={category === tab.value}
                className={`tabs__tab${category === tab.value ? ' tabs__tab--active' : ''}`}
                onClick={() => setCategory(tab.value)}
              >
                {t(lang, tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="modal-sheet__scroll set-picker__grid-wrap">
            {filtered.length === 0 && <p className="set-picker-empty">{t(lang, 'searchEmpty')}</p>}
            <div className="catalog__grid catalog__grid--sets set-picker__grid">
              {filtered.map((set, index) => {
                const isCurrent = current != null && Number(set.id) === current.setId
                return (
                  <div
                    key={String(set.id)}
                    className={`set-picker__card${isCurrent ? ' set-picker__card--current' : ''}`}
                  >
                    <SetCard
                      set={set}
                      index={index}
                      active={false}
                      preview
                      lang={lang}
                      dateLabel={t(lang, CATEGORY_LABEL_KEY[set.category])}
                      onSelect={() => {
                        if (rich) {
                          setPendingSet(set)
                        } else {
                          onPick(Number(set.id))
                          onClose()
                        }
                      }}
                    />
                    {isCurrent && (
                      <span className="set-picker__card-check" aria-label={t(lang, 'currentSet')}>
                        <Check size={16} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {rich && (
        <SetDetailModal
          set={pendingSet}
          isOpen={pendingSet !== null}
          onClose={() => setPendingSet(null)}
          onConfirm={() => {
            if (pendingSet) onPick(Number(pendingSet.id))
            setPendingSet(null)
            onClose()
          }}
          lang={lang}
          dateLabel={dayLabel}
          beverage={item?.beverage ?? 'Вода'}
          onBeverageChange={onBeverageChange ?? (() => {})}
          onApplyBeverageToAll={onBeverageChange ?? (() => {})}
          salad={item?.salad ?? DEFAULT_SALAD}
          onSaladChange={onSaladChange ?? (() => {})}
          onApplySaladToAll={onSaladChange ?? (() => {})}
          portions={item?.portions ?? 1}
          onPortionsChange={onPortionsChange ?? (() => {})}
          daysCount={daysCount ?? 0}
        />
      )}
    </>
  )
}