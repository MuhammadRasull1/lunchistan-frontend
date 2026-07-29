import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LunchSet, CartState } from '../types'
import { formatPrice } from '../types'
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
  onToggleDay: (setId: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEmployeeCountChange: (count: number) => void
  onWorkDaysChange: (delta: number) => void
  onBeverageChange: (setId: string | number, beverage: Beverage) => void
  onGoToCart: () => void
}

function Catalog({
  sets,
  allSetsCount,
  cartState,
  employeeCount,
  workDaysCount,
  totalMonthlyPrice,
  setPrice,
  onToggleDay,
  onSelectAll,
  onDeselectAll,
  onEmployeeCountChange,
  onWorkDaysChange,
  onBeverageChange,
  onGoToCart,
}: CatalogProps) {
  // Статистика
  const activeDays = Object.values(cartState).filter(item => item?.active).length
  const totalPortions = Object.values(cartState)
    .filter(item => item?.active)
    .reduce((sum, item) => sum + (item?.portions ?? 1), 0)
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
        <div className="brand">
          <span className="brand__logo">🍽️</span>
          <span>
            Lunch<span className="brand__accent">istan</span>
          </span>
        </div>
        <h1 className="catalog__heading">Корпоративная подписка на месяц</h1>
        <p className="catalog__subtitle">
          Сбалансированные комплексные обеды для вашей команды — до {allSetsCount} рабочих дней
        </p>
      </header>

      {/* Калькулятор стоимости */}
      <section className="subscription">
        <h2 className="subscription__title">Калькулятор стоимости</h2>

        {/* Рабочие дни */}
        <motion.div
          className="subscription__field"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          <span className="subscription__label">Рабочих дней в месяце</span>
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
          <span className="subscription__label">Количество сотрудников</span>
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
            ✅ Выбрать все {workDaysCount} дней
          </button>
          <button
            type="button"
            className="btn btn--outline btn--outline-danger"
            onClick={onDeselectAll}
          >
            ❌ Сбросить все
          </button>
        </div>

        <motion.div
          className="subscription__calc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="subscription__calc-row">
            <span>Выбрано дней</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={activeDays} /> из {workDaysCount}
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>Сотрудников</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={employeeCount} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>Всего порций (на сотр.)</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={totalPortions} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>Всего порций (на всех)</span>
            <span className="subscription__calc-value">
              <AnimatedCount value={totalPortions} /> × <AnimatedCount value={employeeCount} /> = <AnimatedCount value={totalItems} />
            </span>
          </div>
          <div className="subscription__calc-row">
            <span>Цена одной порции</span>
            <span className="subscription__calc-value">{formatPrice(setPrice)}</span>
          </div>
          <div className="subscription__calc-row subscription__calc-row--total">
            <span>Итого к оплате</span>
            <span className="subscription__calc-value">{formatPrice(totalMonthlyPrice)}</span>
          </div>
        </motion.div>
      </section>

      {/* Список сетов */}
      <h2 className="catalog__section-title">Меню на месяц ({sets.length} дней)</h2>
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
              {activeDays} из {workDaysCount} дней · {employeeCount} сотрудников · {totalItems} порций
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
            Оформить предзаказ
          </motion.button>
        </motion.div>
      )}

      {/* Модальное окно детализации сета */}        <SetDetailModal
          set={selectedSet}
          isOpen={selectedSetId !== null}
          onClose={handleCloseModal}
          onConfirm={handleModalConfirm}
          beverage={selectedSetId ? cartState[selectedSetId]?.beverage ?? 'Вода' : 'Вода'}
          onBeverageChange={(beverage) => {
            if (selectedSetId) onBeverageChange(selectedSetId, beverage)
          }}
        />
    </div>
  )
}

export default Catalog
