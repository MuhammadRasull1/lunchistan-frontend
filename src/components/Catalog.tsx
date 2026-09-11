import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'
import type { Lang, SetCategory, Beverage, Salad, SelectedDay, LunchSet } from '../types'
import { formatPrice, EMPLOYEE_MAX } from '../types'
import { t } from '../locales/translations'
import SetCard from './SetCard'
import SetDetailModal from './SetDetailModal'
import SetPicker from './SetPicker'
import AnimatedCount from './AnimatedCount'
import Stepper from './Stepper'
import CalendarModal from './CalendarModal'
import Reveal from './Reveal'
import { getTelegramWebApp, hapticImpact } from '../lib/telegram'
import { getDefaultSalad, getSaladOptions } from './saladOptions'
import { startOfMonth, addMonths, formatDayLabel } from '../lib/calendar'

type CategoryFilter = SetCategory | 'all'

interface CatalogProps {
  /** Все выбранные дни (сортированные) с привязанными сетами и настройками */
  days: SelectedDay[]
  /** Текущее меню (с бэкенда) — до 11.09.2026 бралось из захардкоженного mockMenu.ts */
  menu: LunchSet[]
  allSetsCount: number
  employeeCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang
  /** Все выбранные дни имеют выбранное блюдо (иначе оформить заказ нельзя) */
  allDishesChosen: boolean
  /** Применяет подтверждённый выбор из календарной модалки к основному state заказа */
  onApplySelectedDates: (dates: string[]) => void
  onEmployeeCountChange: (count: number) => void
  onBeverageChange: (date: string, beverage: Beverage) => void
  onApplyBeverageToAll: (beverage: Beverage) => void
  onPortionsChange: (date: string, portions: number) => void
  onSaladChange: (date: string, salad: Salad) => void
  onApplySaladToAll: (salad: Salad) => void
  /** Клиент выбрал блюдо на день («потратил токен») */
  onSetChange: (date: string, setId: number) => void
  onGoToCart: () => void
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
  menu,
  allSetsCount,
  employeeCount,
  totalMonthlyPrice,
  setPrice,
  lang,
  allDishesChosen,
  onApplySelectedDates,
  onEmployeeCountChange,
  onBeverageChange,
  onApplyBeverageToAll,
  onPortionsChange,
  onSaladChange,
  onApplySaladToAll,
  onSetChange,
  onGoToCart,
}: CatalogProps) {
  // Количество дней определяется исключительно выбранными датами.
  const activeDays = days.length
  const totalPortions = days.reduce((sum, d) => sum + (d.item?.portions ?? 1), 0)
  const totalItems = totalPortions * employeeCount
  // Токены: 1 выбранный день = 1 токен на блюдо. Свободные — дни без выбранного блюда.
  const chosenDaysCount = days.filter(d => d.chosen).length
  const freeTokens = activeDays - chosenDaysCount

  // Внутри Telegram оформление уже доступно через нативный MainButton —
  // кастомная кнопка в нижней панели в этом случае не дублируется.
  const hasMainButton = !!getTelegramWebApp()?.MainButton

  const defaultSalad = useMemo(() => getDefaultSalad(menu), [menu])
  const saladOptions = useMemo(() => getSaladOptions(menu), [menu])

  // Дни с кастомизацией (нестандартные порции, напиток или салат)
  const customizedDays = days.filter(d => {
    const item = d.item
    return item.portions !== 1 || item.beverage !== 'Вода' || item.salad !== defaultSalad
  }).length

  // Состояние модалки детализации сета (по дате дня)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  // Предпросмотр сета из полного каталога (невыбранный день)
  const [previewSet, setPreviewSet] = useState<LunchSet | null>(null)
  // Дата, для которой открыт пикер выбора блюда («трата токена»)
  const [pickForDate, setPickForDate] = useState<string | null>(null)
  // Фильтр категорий меню
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  // Календарная модалка выбора дат
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Границы навигации календаря (текущий → следующий месяц)
  const [minMonth] = useState(() => startOfMonth(new Date()))
  const maxMonth = useMemo(() => addMonths(minMonth, 1), [minMonth])

  // Id блюд, выбранных клиентом хотя бы на один день — подсвечиваем их в каталоге.
  const chosenSetIds = useMemo(() => {
    const ids = new Set<number>()
    for (const d of days) if (d.chosen) ids.add(Number(d.set.id))
    return ids
  }, [days])

  // День, для которого открыт пикер блюда (для передачи текущего выбора в SetPicker)
  const pickForDay = pickForDate ? days.find(d => d.date === pickForDate) ?? null : null

  const filteredSets = activeCategory === 'all'
    ? menu
    : menu.filter(set => set.category === activeCategory)

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
    const ready = activeDays > 0 && totalPortions > 0 && allDishesChosen
    mainButton.setText(ready ? t(lang, 'order') : t(lang, 'chooseDishForEveryDay'))
    mainButton.onClick(handleClick)

    if (ready) {
      mainButton.enable()
      mainButton.show()
    } else if (activeDays > 0 && totalPortions > 0) {
      mainButton.disable()
      mainButton.show()
    } else {
      mainButton.disable()
      mainButton.hide()
    }

    return () => {
      mainButton.offClick(handleClick)
      mainButton.hide()
    }
  }, [lang, activeDays, totalPortions, allDishesChosen])

  return (
    <div className="catalog">
      <header className="catalog__header">
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

      {/* Выбранные дни: на каждый день клиент сам выбирает блюдо («тратит токен») */}
      {activeDays > 0 && (
        <section className="selected-days">
          <div className="view__section-head">
            <h2 className="view__section-title">{t(lang, 'selectedDaysTitle')}</h2>
            <span className={`tokens-badge${freeTokens > 0 ? '' : ' tokens-badge--done'}`}>
              {freeTokens > 0 ? t(lang, 'tokensFree', { n: freeTokens }) : t(lang, 'tokensAllSpent')}
            </span>
          </div>
          <p className="view__section-desc view__section-desc--muted">{t(lang, 'tokensHint')}</p>
          <div className="days-list">
            {days.map((day, i) => (
              <Reveal key={day.date} delay={Math.min(i * 0.05, 0.3)} y={12}>
                <div className={`day-row${day.chosen ? '' : ' day-row--empty'}`}>
                  <div className="day-row__date">{formatDayLabel(day.date, lang)}</div>
                  <button
                    type="button"
                    className="day-row__dish day-row__dish--btn"
                    onClick={() => (day.chosen ? handleOpenModal(day.date) : setPickForDate(day.date))}
                  >
                    {day.chosen ? (
                      <>
                        <span className="day-row__name">{day.set.name}</span>
                        <span className="day-row__hint">
                          {day.item.salad} · {t(lang, day.item.beverage === 'Вода' ? 'water' : 'compote')}
                          {' · '}{day.item.portions} {t(lang, 'portionsPerEmployee')}
                        </span>
                      </>
                    ) : (
                      <span className="day-row__hint day-row__hint--warn">{t(lang, 'daySetNotChosen')}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline day-row__pick"
                    onClick={() => setPickForDate(day.date)}
                  >
                    {day.chosen ? t(lang, 'changeSet') : t(lang, 'chooseSet')}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

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
          const isChosen = chosenSetIds.has(Number(set.id))
          return (
            <SetCard
              key={set.id}
              index={index}
              set={set}
              active={isChosen}
              lang={lang}
              preview={!isChosen}
              onSelect={() => handleOpenPreview(set)}
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
              disabled={!allDishesChosen}
              whileHover={allDishesChosen ? { scale: 1.03 } : undefined}
              whileTap={allDishesChosen ? { scale: 0.97 } : undefined}
            >
              {allDishesChosen ? t(lang, 'order') : t(lang, 'chooseDishForEveryDay')}
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
        salad={selectedDay?.item.salad ?? defaultSalad}
        onSaladChange={(salad) => {
          if (selectedDate) onSaladChange(selectedDate, salad)
        }}
        onApplySaladToAll={onApplySaladToAll}
        saladOptions={saladOptions}
        daysCount={selectedDate ? days.filter(d => d.date !== selectedDate).length + 1 : 0}
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
        salad={defaultSalad}
        onSaladChange={() => {}}
        onApplySaladToAll={() => {}}
        saladOptions={saladOptions}
        daysCount={0}
      />

      {/* Пикер выбора блюда на день («трата токена») */}
      <SetPicker
        isOpen={pickForDate !== null}
        menu={menu}
        lang={lang}
        dayLabel={pickForDate ? formatDayLabel(pickForDate, lang) : undefined}
        current={pickForDay?.chosen
          ? { setId: Number(pickForDay.set.id), setName: pickForDay.set.name, setPrice: pickForDay.set.price }
          : null}
        item={pickForDay?.item ?? null}
        daysCount={pickForDate ? days.length : 0}
        onBeverageChange={(beverage) => { if (pickForDate) onBeverageChange(pickForDate, beverage) }}
        onSaladChange={(salad) => { if (pickForDate) onSaladChange(pickForDate, salad) }}
        onPortionsChange={(portions) => { if (pickForDate) onPortionsChange(pickForDate, portions) }}
        onPick={(setId) => {
          if (pickForDate) onSetChange(pickForDate, setId)
        }}
        onClose={() => setPickForDate(null)}
      />
    </div>
  )
}

export default Catalog
