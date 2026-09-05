import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, UtensilsCrossed } from 'lucide-react'
import type { Lang, SetCategory, Beverage, Salad, SelectedDay, LunchSet } from '../types'
import { formatPrice, EMPLOYEE_MAX } from '../types'
import { t } from '../locales/translations'
import SetCard from './SetCard'
import SetDetailModal from './SetDetailModal'
import AnimatedCount from './AnimatedCount'
import Stepper from './Stepper'
import CalendarModal from './CalendarModal'
import { getTelegramWebApp, hapticImpact } from '../lib/telegram'
import { DEFAULT_SALAD } from './saladOptions'
import { startOfMonth, addMonths, formatDayLabel } from '../lib/calendar'
import { MONTHLY_SETS, getSetForDate } from '../data/mockMenu'

type CategoryFilter = SetCategory | 'all'

interface CatalogProps {
  /** Все выбранные дни (сортированные) с привязанными сетами и настройками */
  days: SelectedDay[]
  allSetsCount: number
  employeeCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang
  /** Применяет подтверждённый выбор из календарной модалки к основному state заказа */
  onApplySelectedDates: (dates: string[]) => void
  onEmployeeCountChange: (count: number) => void
  onBeverageChange: (date: string, beverage: Beverage) => void
  onApplyBeverageToAll: (beverage: Beverage) => void
  onPortionsChange: (date: string, portions: number) => void
  onSaladChange: (date: string, salad: Salad) => void
  onApplySaladToAll: (salad: Salad) => void
  onGoToCart: () => void
  onLangChange: (lang: Lang) => void
}

const CATEGORY_TABS: { value: CategoryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'categoryAll' },
  { value: 'hot', labelKey: 'categoryHot' },
  { value: 'salad', labelKey: 'categorySalad' },
  { value: 'side', labelKey: 'categorySide' },
  { value: 'fastfood', labelKey: 'categoryFastfood' },
  { value: 'appetizer', labelKey: 'categoryAppetizer' },
  { value: 'soup', labelKey: 'categorySoup' },
]

function Catalog({
  days,
  allSetsCount,
  employeeCount,
  totalMonthlyPrice,
  setPrice,
  lang,
  onApplySelectedDates,
  onEmployeeCountChange,
  onBeverageChange,
  onApplyBeverageToAll,
  onPortionsChange,
  onSaladChange,
  onApplySaladToAll,
  onGoToCart,
  onLangChange,
}: CatalogProps) {
  // Количество дней определяется исключительно выбранными датами.
  const activeDays = days.length
  const totalPortions = days.reduce((sum, d) => sum + (d.item?.portions ?? 1), 0)
  const totalItems = totalPortions * employeeCount

  // Внутри Telegram оформление уже доступно через нативный MainButton —
  // кастомная кнопка в нижней панели в этом случае не дублируется.
  const hasMainButton = !!getTelegramWebApp()?.MainButton

  // Дни с кастомизацией (нестандартные порции, напиток или салат)
  const customizedDays = days.filter(d => {
    const item = d.item
    return item.portions !== 1 || item.beverage !== 'Вода' || item.salad !== DEFAULT_SALAD
  }).length

  // Состояние модалки детализации сета (по дате дня)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  // Предпросмотр сета из полного каталога (невыбранный день)
  const [previewSet, setPreviewSet] = useState<LunchSet | null>(null)
  // Фильтр категорий меню
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  // Календарная модалка выбора дат
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Границы навигации календаря (текущий → следующий месяц)
  const [minMonth] = useState(() => startOfMonth(new Date()))
  const maxMonth = useMemo(() => addMonths(minMonth, 1), [minMonth])

  // Карточки выбранных дней активны: сет для даты берётся единым способом через
  // getSetForDate (глобальная порядковая привязка), остальные — предпросмотр сета.
  const activeDateBySet = useMemo(() => {
    const map = new Map<string | number, string>()
    for (const d of days) {
      const set = getSetForDate(d.date)
      if (!map.has(set.id)) map.set(set.id, d.date)
    }
    return map
  }, [days])

  const filteredSets = activeCategory === 'all'
    ? MONTHLY_SETS
    : MONTHLY_SETS.filter(set => set.category === activeCategory)

  const selectedDay = selectedDate ? days.find(d => d.date === selectedDate) ?? null : null

  const handleOpenModal = useCallback((date: string) => {
    hapticImpact('light')
    setSelectedDate(date)
  }, [])

  const handleOpenPreview = useCallback((set: LunchSet) => {
    hapticImpact('light')
    setPreviewSet(set)
  }, [])

  const handleCloseModal = () => {
    setSelectedDate(null)
  }

  const handleModalConfirm = () => {
    hapticImpact('light')
  }

  const openCalendar = () => {
    hapticImpact('light')
    setIsCalendarOpen(true)
  }

  // Нативная кнопка Telegram MainButton — зеркалит кнопку «Оформить предзаказ»
  const onGoToCartRef = useRef(onGoToCart)
  useEffect(() => { onGoToCartRef.current = onGoToCart }, [onGoToCart])

  useEffect(() => {
    const mainButton = getTelegramWebApp()?.MainButton
    if (!mainButton) return

    const handleClick = () => onGoToCartRef.current()
    mainButton.setText(t(lang, 'order'))
    mainButton.onClick(handleClick)

    if (activeDays > 0 && totalPortions > 0) {
      mainButton.enable()
      mainButton.show()
    } else {
      mainButton.disable()
      mainButton.hide()
    }

    return () => {
      mainButton.offClick(handleClick)
      mainButton.hide()
    }
  }, [lang, activeDays, totalPortions])

  return (
    <div className="catalog">
      <header className="catalog__header">
        <div className="catalog__header-top">
          <div className="brand">
            <span className="brand__logo"><UtensilsCrossed size={22} strokeWidth={2.2} /></span>
            <span>
              Lunch<span className="brand__accent">istan</span>
            </span>
          </div>

          {/* Language switcher */}
          <div className="lang-switcher">
            <button
              type="button"
              className={`lang-btn${lang === 'ru' ? ' lang-btn--active' : ''}`}
              onClick={() => onLangChange('ru')}
              aria-label="Русский"
            >
              RU
            </button>
            <span className="lang-switcher__sep">|</span>
            <button
              type="button"
              className={`lang-btn${lang === 'uz' ? ' lang-btn--active' : ''}`}
              onClick={() => onLangChange('uz')}
              aria-label="O'zbek"
            >
              UZ
            </button>
          </div>
        </div>
        <h1 className="catalog__heading">{t(lang, 'headerTitle')}</h1>
        <p className="catalog__subtitle">
          {t(lang, 'headerSubtitle', { n: allSetsCount })}
        </p>
      </header>

      {/* Подписка: выбор дат + калькулятор стоимости */}
      <section className="subscription">
        <h2 className="subscription__title">{t(lang, 'calendarTitle')}</h2>
        <p className="subscription__label" style={{ margin: '-8px 0 14px' }}>
          {t(lang, 'calendarSubtitle')}
        </p>

        {/* Сводка выбранных дней + кнопки открытия календаря */}
        <div className="subscription__days-summary">
          <div className="subscription__days-count">
            <AnimatedCount value={activeDays} />
            <span className="subscription__days-count-label">{t(lang, 'selectedDays')}</span>
          </div>
          <div className="subscription__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={openCalendar}
            >
              {t(lang, 'chooseDays')}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--outline-danger"
              onClick={openCalendar}
            >
              {t(lang, 'deselectAll')}
            </button>
          </div>
        </div>

        {activeDays === 0 && (
          <div className="empty-state">
            <div className="empty-state__visual" aria-hidden="true">
              <CalendarDays size={26} strokeWidth={1.6} />
            </div>
            <div className="empty-state__body">
              <span className="empty-state__title">{t(lang, 'noDatesTitle')}</span>
              <span className="empty-state__text">{t(lang, 'noDatesSelected')}</span>
            </div>
          </div>
        )}

        {/* Количество сотрудников */}
        <motion.div
          className="subscription__field"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="subscription__label">{t(lang, 'employees')}</span>
          <Stepper
            value={employeeCount}
            min={1}
            max={EMPLOYEE_MAX}
            onSet={onEmployeeCountChange}
            ariaDecrease={t(lang, 'stepDecrease')}
            ariaIncrease={t(lang, 'stepIncrease')}
          />
        </motion.div>

        <motion.div
          className="subscription__calc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="subscription__calc-row">
            <span>{t(lang, 'selectedDays')}</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={activeDays} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>{t(lang, 'employeesShort')}</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={employeeCount} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>{t(lang, 'totalPortions')}</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={totalPortions} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>{t(lang, 'totalPortionsAll')}</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={totalPortions} /> × <AnimatedCount value={employeeCount} /> = <AnimatedCount value={totalItems} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>{t(lang, 'pricePerPortion')}</span>
            <span className="subscription__calc-value">{formatPrice(setPrice, lang)}</span>
          </div>
          <div className="subscription__calc-row subscription__calc-row--total">
            <span>{t(lang, 'totalToPay')}</span>
            <span className="subscription__calc-value">{formatPrice(totalMonthlyPrice, lang)}</span>
          </div>
          {customizedDays > 0 && (
            <div className="subscription__calc-row">
              <span>{t(lang, 'customizedDaysLabel')}</span>
              <span className="subscription__calc-value">
                <AnimatedCount value={customizedDays} /> {t(lang, 'from')} {days.length}
              </span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Полное меню на 2 месяца — заголовок всегда показывает полное число сетов */}
      <h2 className="catalog__section-title">{t(lang, 'menuTitle', { n: allSetsCount })}</h2>

      <div className="tabs" role="tablist" aria-label={t(lang, 'menuTitle', { n: allSetsCount })}>
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeCategory === tab.value}
            className={`tabs__tab${activeCategory === tab.value ? ' tabs__tab--active' : ''}`}
            onClick={() => setActiveCategory(tab.value)}
          >
            {t(lang, tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="catalog__grid catalog__grid--sets">
        {filteredSets.map((set, index) => {
          const activeDate = activeDateBySet.get(set.id)
          const isActive = activeDate !== undefined
          return (
            <SetCard
              key={set.id}
              index={index}
              set={set}
              active={isActive}
              lang={lang}
              dateLabel={isActive ? formatDayLabel(activeDate, lang) : undefined}
              preview={!isActive}
              onSelect={() => (isActive ? handleOpenModal(activeDate) : handleOpenPreview(set))}
            />
          )
        })}
      </div>

      {/* Нижняя панель */}
      {activeDays > 0 && totalPortions > 0 && (
        <motion.div
          className={`sticky-bar${hasMainButton ? ' sticky-bar--info-only' : ''}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="sticky-bar__info">
            <span className="sticky-bar__count">
              {t(lang, 'stickyBarLabel', { active: activeDays, employees: employeeCount, portions: totalItems })}
            </span>
            <span className="sticky-bar__total">{formatPrice(totalMonthlyPrice, lang)}</span>
          </div>
          {!hasMainButton && (
            <motion.button
              type="button"
              className="btn btn--primary"
              onClick={onGoToCart}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {t(lang, 'order')}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Календарная модалка выбора дат (draft → подтверждение) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        initialSelectedDates={days.map(d => d.date)}
        minMonth={minMonth}
        maxMonth={maxMonth}
        lang={lang}
        onConfirm={(dates) => {
          onApplySelectedDates(dates)
          setIsCalendarOpen(false)
        }}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Модальное окно детализации сета (кастомизация выбранного дня) */}
      <SetDetailModal
        set={selectedDay?.set ?? null}
        isOpen={selectedDate !== null}
        onClose={handleCloseModal}
        onConfirm={handleModalConfirm}
        lang={lang}
        dateLabel={selectedDate ? formatDayLabel(selectedDate, lang) : undefined}
        beverage={selectedDay?.item.beverage ?? 'Вода'}
        onBeverageChange={(beverage) => {
          if (selectedDate) onBeverageChange(selectedDate, beverage)
        }}
        onApplyBeverageToAll={onApplyBeverageToAll}
        portions={selectedDay?.item.portions ?? 1}
        onPortionsChange={(portions) => {
          if (selectedDate) onPortionsChange(selectedDate, portions)
        }}
        salad={selectedDay?.item.salad ?? DEFAULT_SALAD}
        onSaladChange={(salad) => {
          if (selectedDate) onSaladChange(selectedDate, salad)
        }}
        onApplySaladToAll={onApplySaladToAll}
      />

      {/* Предпросмотр сета из полного каталога (read-only) */}
      <SetDetailModal
        set={previewSet}
        isOpen={previewSet !== null}
        onClose={() => setPreviewSet(null)}
        onConfirm={() => setPreviewSet(null)}
        lang={lang}
        readOnly
        beverage="Вода"
        onBeverageChange={() => {}}
        onApplyBeverageToAll={() => {}}
        portions={1}
        onPortionsChange={() => {}}
        salad={DEFAULT_SALAD}
        onSaladChange={() => {}}
        onApplySaladToAll={() => {}}
      />
    </div>
  )
}

export default Catalog
