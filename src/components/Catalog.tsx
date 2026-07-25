import type { LunchSet, Beverage, CartState } from '../types'
import { formatPrice } from '../types'
import SetCard from './SetCard'

interface CatalogProps {
  sets: LunchSet[]
  cartState: CartState
  employeeCount: number
  totalMonthlyPrice: number
  setPrice: number
  onBeverageChange: (setId: string | number, beverage: Beverage) => void
  onToggleDay: (setId: string | number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEmployeeCountChange: (count: number) => void
  onGoToCart: () => void
}

function Catalog({
  sets,
  cartState,
  employeeCount,
  totalMonthlyPrice,
  setPrice,
  onBeverageChange,
  onToggleDay,
  onSelectAll,
  onDeselectAll,
  onEmployeeCountChange,
  onGoToCart,
}: CatalogProps) {
  // Количество активных дней
  const activeDays = Object.values(cartState).filter(item => item?.active).length
  const totalPortions = activeDays * employeeCount

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
          Сбалансированные комплексные обеды для вашей команды — 22 рабочих дня
        </p>
      </header>

      {/* Калькулятор стоимости */}
      <section className="subscription">
        <h2 className="subscription__title">Калькулятор стоимости</h2>

        <div className="subscription__field">
          <span className="subscription__label">Количество сотрудников</span>
          <div className="counter">
            <button
              type="button"
              className="counter__btn"
              aria-label="Уменьшить количество сотрудников"
              disabled={employeeCount <= 1}
              onClick={() => onEmployeeCountChange(employeeCount - 1)}
            >
              −
            </button>
            <span className="counter__value">{employeeCount}</span>
            <button
              type="button"
              className="counter__btn counter__btn--add"
              aria-label="Добавить сотрудника"
              onClick={() => onEmployeeCountChange(employeeCount + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="subscription__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={onSelectAll}
          >
            ✅ Выбрать все 22 дня
          </button>
          <button
            type="button"
            className="btn btn--outline btn--outline-danger"
            onClick={onDeselectAll}
          >
            ❌ Сбросить все
          </button>
        </div>

        <div className="subscription__calc">
          <div className="subscription__calc-row">
            <span>Выбрано дней</span>
            <span className="subscription__calc-value">{activeDays} из {sets.length}</span>
          </div>
          <div className="subscription__calc-row">
            <span>Сотрудников</span>
            <span className="subscription__calc-value">{employeeCount}</span>
          </div>
          <div className="subscription__calc-row">
            <span>Всего порций</span>
            <span className="subscription__calc-value">{activeDays} × {employeeCount} = {totalPortions}</span>
          </div>
          <div className="subscription__calc-row">
            <span>Цена одной порции</span>
            <span className="subscription__calc-value">{formatPrice(setPrice)}</span>
          </div>
          <div className="subscription__calc-row subscription__calc-row--total">
            <span>Итого к оплате</span>
            <span className="subscription__calc-value">{formatPrice(totalMonthlyPrice)}</span>
          </div>
        </div>
      </section>

      {/* Список сетов */}
      <h2 className="catalog__section-title">Меню на месяц</h2>
      <div className="catalog__grid catalog__grid--sets">
        {sets.map((set) => {
          const cartItem = cartState[set.id]
          const beverage = cartItem?.beverage ?? 'Вода'
          const active = cartItem?.active ?? true

          return (
            <SetCard
              key={set.id}
              set={set}
              active={active}
              beverage={beverage}
              onBeverageChange={(beverage) => onBeverageChange(set.id, beverage as Beverage)}
              onToggle={() => onToggleDay(set.id)}
            />
          )
        })}
      </div>

      {/* Нижняя панель */}
      {activeDays > 0 && (
        <div className="sticky-bar">
          <div className="sticky-bar__info">
            <span className="sticky-bar__count">
              {activeDays} из {sets.length} дней · {employeeCount} сотрудников · {totalPortions} порций
            </span>
            <span className="sticky-bar__total">{formatPrice(totalMonthlyPrice)}</span>
          </div>
          <button type="button" className="btn btn--primary" onClick={onGoToCart}>
            Оформить предзаказ
          </button>
        </div>
      )}
    </div>
  )
}

export default Catalog
