import type { LunchSet, Beverage, CartState } from '../types'
import { formatPrice } from '../types'
import SetCard from './SetCard'

interface CatalogProps {
  sets: LunchSet[]
  cartState: CartState
  employeeCount: number
  totalMonthlyPrice: number
  workDaysCount: number
  setPrice: number
  onBeverageChange: (setId: string | number, beverage: Beverage) => void
  onQuantityChange: (setId: string | number, delta: number) => void
  onEmployeeCountChange: (count: number) => void
  onGoToCart: () => void
}

function Catalog({
  sets,
  cartState,
  employeeCount,
  totalMonthlyPrice,
  workDaysCount,
  setPrice,
  onBeverageChange,
  onQuantityChange,
  onEmployeeCountChange,
  onGoToCart,
}: CatalogProps) {
  const totalItems = Object.values(cartState).reduce((sum, item) => sum + item.quantity, 0)

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

        <div className="subscription__calc">
          <div className="subscription__calc-row">
            <span>Рабочих дней в месяце</span>
            <span className="subscription__calc-value">{workDaysCount}</span>
          </div>
          <div className="subscription__calc-row">
            <span>Цена одного сета</span>
            <span className="subscription__calc-value">{formatPrice(setPrice)}</span>
          </div>
          <div className="subscription__calc-row subscription__calc-row--accent">
            <span>Подписка на 1 сотрудника</span>
            <span className="subscription__calc-value">
              {workDaysCount} × {formatPrice(setPrice)} = {formatPrice(setPrice * workDaysCount)}
            </span>
          </div>
          {employeeCount > 1 && (
            <div className="subscription__calc-row subscription__calc-row--total">
              <span>Итого на {employeeCount} сотр.</span>
              <span className="subscription__calc-value">{formatPrice(totalMonthlyPrice)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Список сетов */}
      <h2 className="catalog__section-title">Меню на месяц</h2>
      <div className="catalog__grid catalog__grid--sets">
        {sets.map((set) => {
          const cartItem = cartState[set.id]
          const quantity = cartItem?.quantity ?? 0
          const beverage = cartItem?.beverage ?? 'Вода'

          return (
            <SetCard
              key={set.id}
              set={set}
              quantity={quantity}
              beverage={beverage}
              onBeverageChange={(beverage) => onBeverageChange(set.id, beverage as Beverage)}
              onQuantityChange={(delta) => onQuantityChange(set.id, delta)}
            />
          )
        })}
      </div>

      {/* Нижняя панель */}
      {totalItems > 0 && (
        <div className="sticky-bar">
          <div className="sticky-bar__info">
            <span className="sticky-bar__count">
              {totalItems} порций · {employeeCount} сотрудников
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
