import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, CalendarPlus, Check } from 'lucide-react'
import type { Lang, PresetPattern } from '../types'
import { t, WEEKDAYS_SHORT } from '../locales/translations'
import {
  buildMonthGrid,
  buildMonthWeeks,
  buildPresetDates,
  canSelectDate,
  formatDate,
  formatMonthLabel,
  monthKeyOf,
  monthKeyOfDate,
  workWeekDatesOf,
  TODAY_ORDER_CUTOFF_HOUR,
} from '../lib/calendar'
import { hapticImpact } from '../lib/telegram'

interface CalendarModalProps {
  isOpen: boolean
  /** Текущий выбор из основного state заказа (даты YYYY-MM-DD) */
  initialSelectedDates: string[]
  /** Нижняя граница навигации (текущий месяц) */
  minMonth: Date
  /** Верхняя граница навигации (следующий месяц) */
  maxMonth: Date
  lang: Lang
  /** Подтверждение чернового выбора → применяется к основному state заказа */
  onConfirm: (dates: string[]) => void
  onClose: () => void
}

const PRESETS: { value: PresetPattern; labelKey: string }[] = [
  { value: '2/2', labelKey: 'preset22' },
  { value: '5/2', labelKey: 'preset52' },
  { value: '6/1', labelKey: 'preset61' },
  { value: 'full', labelKey: 'presetFull' },
]

/** Порядок колонок: Пн Вт Ср Чт Пт Сб Вс (индексы getDay) */
const WEEKDAY_HEADERS = [1, 2, 3, 4, 5, 6, 0]

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

/**
 * Внутренняя панель календаря. Монтируется заново при каждом открытии модалки,
 * поэтому черновой выбор и видимый месяц инициализируются из пропсов без эффектов.
 */
function CalendarSheet({ initialSelectedDates, minMonth, maxMonth, lang, onConfirm, onClose }: Omit<CalendarModalProps, 'isOpen'>) {
  const [draftDates, setDraftDates] = useState<Set<string>>(() =>
    new Set(initialSelectedDates.filter(date => canSelectDate(date)))
  )
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date(minMonth.getTime()))

  const visibleMonthKey = monthKeyOf(visibleMonth.getFullYear(), visibleMonth.getMonth())
  const weeks = buildMonthWeeks(visibleMonth)
  const monthCells = buildMonthGrid(visibleMonth)
  // Все даты месяца, доступные для заказа (не прошлое и, если сегодня, до временной резки)
  const monthSelectableDates = monthCells
    .filter(cell => !cell.isEmpty && cell.date !== undefined && canSelectDate(cell.date))
    .map(cell => cell.date as string)
  const draftCount = draftDates.size
  const todayKey = formatDate(new Date())

  const canGoPrev = visibleMonth.getTime() > minMonth.getTime()
  const canGoNext = visibleMonth.getTime() < maxMonth.getTime()

  const goToMonth = (delta: number) => {
    hapticImpact('light')
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1))
  }

  const toggleDate = (date: string) => {
    // Прошедшие даты и «сегодня» после временной резки выбрать нельзя.
    if (!canSelectDate(date)) return
    hapticImpact('light')
    setDraftDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  /** Пресет «Вся рабочая неделя»: выбирает Пн–Пт той недели, на которую нажали (повторно — снимает) */
  const toggleWorkWeek = (weekIndex: number) => {
    hapticImpact('light')
    const weekDates = workWeekDatesOf(weeks[weekIndex]).filter(date => canSelectDate(date))
    if (weekDates.length === 0) return
    setDraftDates(prev => {
      const next = new Set(prev)
      const allSelected = weekDates.every(date => next.has(date))
      if (allSelected) {
        for (const date of weekDates) next.delete(date)
      } else {
        for (const date of weekDates) next.add(date)
      }
      return next
    })
  }

  /** Глобальные пресеты: toggle. Первое нажатие добавляет даты пресета в видимый месяц,
   * повторное — снимает ровно пресетные даты (вручную добавленные/снятые дни сохраняются).
   * Даты других месяцев не затрагиваются. */
  const togglePreset = (pattern: PresetPattern) => {
    hapticImpact('light')
    const presetDates = buildPresetDates(visibleMonthKey, pattern)
    if (presetDates.length === 0) return
    setDraftDates(prev => {
      const next = new Set(prev)
      const allSelected = presetDates.every(date => next.has(date))
      if (allSelected) {
        for (const date of presetDates) next.delete(date)
      } else {
        for (const date of presetDates) next.add(date)
      }
      return next
    })
  }

  /** Пресет активен, если выбор видимого месяца в точности равен результату пресета */
  const isPresetActive = (pattern: PresetPattern): boolean => {
    const presetDates = new Set(buildPresetDates(visibleMonthKey, pattern))
    if (presetDates.size === 0) return false
    for (const date of draftDates) {
      if (monthKeyOfDate(date) !== visibleMonthKey) continue
      if (!presetDates.has(date)) return false
    }
    for (const date of presetDates) {
      if (!draftDates.has(date)) return false
    }
    return true
  }

  const selectAllInMonth = () => {
    hapticImpact('light')
    setDraftDates(prev => {
      const next = new Set(prev)
      for (const date of monthSelectableDates) next.add(date)
      return next
    })
  }

  const deselectAllInMonth = () => {
    hapticImpact('light')
    setDraftDates(prev => {
      const next = new Set(prev)
      for (const date of [...next]) {
        if (monthKeyOfDate(date) === visibleMonthKey) next.delete(date)
      }
      return next
    })
  }

  const handleConfirm = () => {
    hapticImpact('medium')
    onConfirm([...draftDates].sort())
  }

  return (
    <>
      <motion.div
        className="modal-overlay"
        key="calendar-overlay"
        variants={OVERLAY_VARIANTS}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      <motion.div
        className="modal-sheet calendar-modal"
        key="calendar-sheet"
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
        <div className="modal-sheet__handle" />

        <button
          type="button"
          className="modal-sheet__close"
          onClick={onClose}
          aria-label={t(lang, 'close')}
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="modal-sheet__scroll calendar-modal__scroll">
          <h2 className="calendar-modal__title">{t(lang, 'calendarModalTitle')}</h2>
          <p className="calendar-modal__subtitle">{t(lang, 'calendarSubtitle')}</p>
          <p className="calendar-modal__hint">{t(lang, 'calendarLockedHint', { n: TODAY_ORDER_CUTOFF_HOUR })}</p>

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
            <div className="calendar__title">{formatMonthLabel(visibleMonth, lang)}</div>
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

          {/* Глобальные пресеты графика */}
          <div className="calendar__presets">
            {PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                className={`calendar__preset${isPresetActive(p.value) ? ' calendar__preset--active' : ''}`}
                onClick={() => togglePreset(p.value)}
                aria-pressed={isPresetActive(p.value)}
              >
                {t(lang, p.labelKey)}
              </button>
            ))}
          </div>

          {/* Шапка дней недели */}
          <div className="calendar__header-row">
            <div className="calendar__week-preset-spacer" />
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
          </div>

          {/* Недели месяца: строка = 7 дней + кнопка «Вся рабочая неделя» */}
          <div className="calendar__weeks">
            {weeks.map((_, weekIndex) => (
              <div key={weekIndex} className="calendar__week">
                <button
                  type="button"
                  className="calendar__week-preset"
                  onClick={() => toggleWorkWeek(weekIndex)}
                  aria-label={t(lang, 'weekWorkPreset')}
                  title={t(lang, 'weekWorkPreset')}
                >
                  <CalendarPlus size={15} strokeWidth={2.5} />
                </button>
                <div className="calendar__week-days">
                  {weeks[weekIndex].cells.map((cell, cellIndex) => {
                    if (cell.isEmpty || cell.date === undefined) {
                      return <div key={cellIndex} className="calendar__day calendar__day--empty" />
                    }
                    const selected = draftDates.has(cell.date)
                    const locked = !canSelectDate(cell.date)
                    return (
                      <button
                        key={cellIndex}
                        type="button"
                        disabled={locked}
                        className={`calendar__day${selected ? ' calendar__day--selected' : ''}${cell.isWeekend ? ' calendar__day--weekend' : ''}${cell.date === todayKey ? ' calendar__day--today' : ''}${locked ? ' calendar__day--disabled' : ''}`}
                        onClick={() => toggleDate(cell.date!)}
                        aria-pressed={selected}
                        aria-disabled={locked}
                        aria-label={cell.date}
                      >
                        {cell.dayOfMonth}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Быстрые действия (в пределах видимого месяца) */}
          <div className="subscription__actions calendar__actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={selectAllInMonth}
            >
              {t(lang, 'selectAll', { n: monthSelectableDates.length })}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--outline-danger"
              onClick={deselectAllInMonth}
            >
              {t(lang, 'deselectAll')}
            </button>
          </div>
        </div>

        {/* Нижняя плашка: счётчик чернового выбора + подтверждение */}
        <div className="modal-sheet__bar">
          <div className="modal-sheet__bar-price">
            <span className="modal-sheet__bar-price-label">{t(lang, 'selectedDays')}</span>
            <span className="modal-sheet__bar-price-value">{draftCount}</span>
          </div>
          <motion.button
            type="button"
            className="modal-sheet__bar-btn"
            onClick={handleConfirm}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Check size={18} strokeWidth={3} />
            {t(lang, 'confirm')}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

function CalendarModal({ isOpen, initialSelectedDates, minMonth, maxMonth, lang, onConfirm, onClose }: CalendarModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <CalendarSheet
          initialSelectedDates={initialSelectedDates}
          minMonth={minMonth}
          maxMonth={maxMonth}
          lang={lang}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  )
}

export default CalendarModal
