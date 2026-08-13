import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Lang, PresetPattern } from '../types'
import { t, WEEKDAYS_SHORT } from '../locales/translations'
import { buildMonthGrid, formatDate, formatMonthLabel } from '../lib/calendar'
import { hapticImpact } from '../lib/telegram'

interface CalendarProps {
  /** Видимый месяц (первый день месяца) */
  month: Date
  /** Нижняя граница навигации (текущий месяц) */
  minMonth: Date
  /** Верхняя граница навигации (следующий месяц) */
  maxMonth: Date
  onMonthChange: (month: Date) => void
  /** Выбранные даты в формате YYYY-MM-DD */
  selectedDates: string[]
  /** Количество допустимых дат в видимом месяце (для кнопки «Выбрать все N») */
  selectableCount: number
  lang: Lang
  onToggleDate: (date: string) => void
  onApplyPreset: (pattern: PresetPattern) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

const PRESETS: { value: PresetPattern; labelKey: string }[] = [
  { value: '2/2', labelKey: 'preset22' },
  { value: '5/2', labelKey: 'preset52' },
  { value: '6/1', labelKey: 'preset61' },
  { value: 'full', labelKey: 'presetFull' },
]

/** Порядок колонок: Пн Вт Ср Чт Пт Сб Вс (индексы getDay) */
const WEEKDAY_HEADERS = [1, 2, 3, 4, 5, 6, 0]

function Calendar({
  month,
  minMonth,
  maxMonth,
  onMonthChange,
  selectedDates,
  selectableCount,
  lang,
  onToggleDate,
  onApplyPreset,
  onSelectAll,
  onDeselectAll,
}: CalendarProps) {
  const cells = useMemo(() => buildMonthGrid(month), [month])
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates])
  const todayKey = useMemo(() => formatDate(new Date()), [])

  const canGoPrev = month.getTime() > minMonth.getTime()
  const canGoNext = month.getTime() < maxMonth.getTime()

  const goToMonth = (delta: number) => {
    hapticImpact('light')
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  }

  return (
    <div className="calendar">
      {/* Навигация по месяцам (текущий → следующий) */}
      <div className="calendar__header">
        <motion.button
          type="button"
          className="calendar__nav-btn"
          onClick={() => goToMonth(-1)}
          disabled={!canGoPrev}
          aria-label={t(lang, 'calendarPrevMonth')}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </motion.button>
        <div className="calendar__title">{formatMonthLabel(month, lang)}</div>
        <motion.button
          type="button"
          className="calendar__nav-btn"
          onClick={() => goToMonth(1)}
          disabled={!canGoNext}
          aria-label={t(lang, 'calendarNextMonth')}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Пресеты графика */}
      <div className="calendar__presets">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            className="calendar__preset"
            onClick={() => {
              hapticImpact('light')
              onApplyPreset(p.value)
            }}
          >
            {t(lang, p.labelKey)}
          </button>
        ))}
      </div>

      {/* Шапка дней недели */}
      <div className="calendar__weekdays">
        {WEEKDAY_HEADERS.map(wd => (
          <div
            key={wd}
            className={`calendar__weekday${wd === 0 || wd === 6 ? ' calendar__weekday--weekend' : ''}`}
          >
            {WEEKDAYS_SHORT[lang][wd]}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="calendar__grid">
        {cells.map(cell => {
          const selected = selectedSet.has(cell.date)
          const isToday = cell.date === todayKey
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.isSelectable}
              className={`calendar__day${selected ? ' calendar__day--selected' : ''}${cell.isSelectable ? '' : ' calendar__day--off'}${isToday ? ' calendar__day--today' : ''}`}
              onClick={() => {
                hapticImpact('light')
                onToggleDate(cell.date)
              }}
              aria-pressed={selected}
              aria-label={cell.date}
            >
              {cell.dayOfMonth}
            </button>
          )
        })}
      </div>

      {/* Быстрые действия */}
      <div className="subscription__actions calendar__actions">
        <button
          type="button"
          className="btn btn--outline"
          onClick={onSelectAll}
        >
          {t(lang, 'selectAll', { n: selectableCount })}
        </button>
        <button
          type="button"
          className="btn btn--outline btn--outline-danger"
          onClick={onDeselectAll}
        >
          {t(lang, 'deselectAll')}
        </button>
      </div>
    </div>
  )
}

export default Calendar
