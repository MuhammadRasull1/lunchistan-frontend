import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LunchSet, CartState, Lang } from '../types'
import { formatPrice } from '../types'
import { t } from '../locales/translations'
import SetCard from './SetCard'
import SetDetailModal from './SetDetailModal'
import AnimatedCount from './AnimatedCount'

import type { Beverage } from '../types'

interface CatalogProps {
  sets: LunchSet[]
  allSetsCount: number
  cartState: CartState
  employeeCount: number
  workDaysCount: number
  totalMonthlyPrice: number
  setPrice: number
  lang: Lang
  onToggleDay: (setId: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEmployeeCountChange: (count: number) => void
  onWorkDaysChange: (delta: number) => void
  onBeverageChange: (setId: string | number, beverage: Beverage) => void
  onGoToCart: () => void
  onLangChange: (lang: Lang) => void
}

function Catalog({
  sets,
  allSetsCount,
  cartState,
  employeeCount,
  workDaysCount,
  totalMonthlyPrice,
  setPrice,
  lang,
  onToggleDay,
  onSelectAll,
  onDeselectAll,
  onEmployeeCountChange,
  onWorkDaysChange,
  onBeverageChange,
  onGoToCart,
  onLangChange,
}: CatalogProps) {
  // Статистика — только по видимым сетам
  const visibleIds = new Set(sets.map(s => String(s.id)))
  const activeDays = Object.entries(cartState)
    .filter(([id, item]) => visibleIds.has(id) && item?.active)
    .length
  const totalPortions = Object.entries(cartState)
    .filter(([id, item]) => visibleIds.has(id) && item?.active)
    .reduce((sum, [_, item]) => sum + (item?.portions ?? 1), 0)
  const totalItems = totalPortions * employeeCount

  // Состояние модалки детализации сета
  const [selectedSetId, setSelectedSetId] = useState<string | number | null>(null)

  const selectedSet = selectedSetId
    ? sets.find(s => s.id === selectedSetId) ?? null
    : null

  const handleOpenModal = (setId: string | number) => {
    setSelectedSetId(setId)
  }

  const handleCloseModal = () => {
    setSelectedSetId(null)
  }

  const handleModalConfirm = () => {
    if (selectedSetId) {
      // Убеждаемся, что день активен
      if (!cartState[selectedSetId]?.active) {
        onToggleDay(selectedSetId)
      }
    }
  }

  return (
    <div className="catalog">
      <header className="catalog__header">
        <div className="catalog__header-top">
          <div className="brand">
            <span className="brand__logo">🍽️</span>
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

      {/* Калькулятор стоимости */}
      <section className="subscription">
        <h2 className="subscription__title">{t(lang, 'calculatorTitle')}</h2>

        {/* Рабочие дни */}
        <motion.div
          className="subscription__field"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          <span className="subscription__label">{t(lang, 'workingDays')}</span>
          <div className="counter">
            <motion.button
              type="button"
              className="counter__btn"
              aria-label="Уменьшить количество дней"
              disabled={workDaysCount <= 1}
              onClick={() => onWorkDaysChange(-1)}
              whileTap={{ scale: 0.88 }}
            >
              −
            </motion.button>
            <span className="counter__value">{workDaysCount}</span>
            <motion.button
              type="button"
              className="counter__btn counter__btn--add"
              aria-label="Добавить дней"
              disabled={workDaysCount >= allSetsCount}
              onClick={() => onWorkDaysChange(1)}
              whileTap={{ scale: 0.88 }}
            >
              +
            </motion.button>
          </div>
        </motion.div>

        {/* Количество сотрудников */}
        <motion.div
          className="subscription__field"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="subscription__label">{t(lang, 'employees')}</span>
          <div className="counter">
            <motion.button
              type="button"
              className="counter__btn"
              aria-label="Уменьшить количество сотрудников"
              disabled={employeeCount <= 1}
              onClick={() => onEmployeeCountChange(employeeCount - 1)}
              whileTap={{ scale: 0.88 }}
            >
              −
            </motion.button>
            <span className="counter__value">{employeeCount}</span>
            <motion.button
              type="button"
              className="counter__btn counter__btn--add"
              aria-label="Добавить сотрудника"
              onClick={() => onEmployeeCountChange(employeeCount + 1)}
              whileTap={{ scale: 0.88 }}
            >
              +
            </motion.button>
          </div>
        </motion.div>

        {/* Быстрые действия */}
        <div className="subscription__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onSelectAll}
          >
            {t(lang, 'selectAll', { n: workDaysCount })}
          </button>
          <button
            type="button"
            className="btn btn--outline btn--outline-danger"
            onClick={onDeselectAll}
          >
            {t(lang, 'deselectAll')}
          </button>
        </div>

        <motion.div
          className="subscription__calc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="subscription__calc-row">
            <span>{t(lang, 'selectedDays')}</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={activeDays} /> {t(lang, 'from')} {workDaysCount}
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
            <span className="subscription__calc-value">{formatPrice(setPrice)}</span>
          </div>
          <div className="subscription__calc-row subscription__calc-row--total">
            <span>{t(lang, 'totalToPay')}</span>
            <span className="subscription__calc-value">{formatPrice(totalMonthlyPrice)}</span>
          </div>
        </motion.div>
      </section>

      {/* Список сетов */}
      <h2 className="catalog__section-title">{t(lang, 'menuTitle', { n: sets.length })}</h2>
      <div className="catalog__grid catalog__grid--sets">
        {sets.map((set, index) => {
          const cartItem = cartState[set.id]
          const active = cartItem?.active ?? true

          return (
            <SetCard
              key={set.id}
              index={index}
              set={set}
              active={active}
              lang={lang}
              onSelect={() => handleOpenModal(set.id)}
            />
          )
        })}
      </div>

      {/* Нижняя панель */}
      {activeDays > 0 && totalPortions > 0 && (
        <motion.div
          className="sticky-bar"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="sticky-bar__info">
            <span className="sticky-bar__count">
              {t(lang, 'stickyBarLabel', { active: activeDays, total: workDaysCount, employees: employeeCount, portions: totalItems })}
            </span>
            <span className="sticky-bar__total">{formatPrice(totalMonthlyPrice)}</span>
          </div>
          <motion.button
            type="button"
            className="btn btn--primary"
            onClick={onGoToCart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {t(lang, 'order')}
          </motion.button>
        </motion.div>
      )}

      {/* Модальное окно детализации сета */}
      <SetDetailModal
        set={selectedSet}
        isOpen={selectedSetId !== null}
        onClose={handleCloseModal}
        onConfirm={handleModalConfirm}
        lang={lang}
        beverage={selectedSetId ? cartState[selectedSetId]?.beverage ?? 'Вода' : 'Вода'}
        onBeverageChange={(beverage) => {
          if (selectedSetId) onBeverageChange(selectedSetId, beverage)
        }}
      />
    </div>
  )
}

export default Catalog
