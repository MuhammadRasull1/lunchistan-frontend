import type { LunchSet, Beverage, CartState } from '../types'
import { DRINK_OPTIONS, formatPrice } from '../types'

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
            <article
              key={set.id}
              className={`set-card${quantity > 0 ? ' set-card--active' : ''}`}
            >
              <div className="set-card__head">
                <div className="set-card__badge" aria-hidden="true">🍱</div>
                <div className="set-card__title-wrap">
                  <h3 className="set-card__name">{set.name}</h3>
                  <span className="set-card__tag">
                    День {set.dayNumber} · {set.weekDay}
                  </span>
                </div>
                {quantity > 0 && (
                  <span className="set-card__qty-badge">{quantity}</span>
                )}
              </div>

              <p className="set-card__description">{set.description}</p>

              <div className="set-card__footer">
                <span className="set-card__price">{formatPrice(set.price)}</span>
                <span className="set-card__per-day">за день</span>
              </div>

              <div className="set-card__actions">
                {/* Выбор напитка */}
                <div className="set-card__drink">
                  <label className="set-card__drink-label">Напиток</label>
                  <select
                    className="set-card__drink-select"
                    value={beverage}
                    onChange={(e) => onBeverageChange(set.id, e.target.value as Beverage)}
                  >
                    {DRINK_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Количество */}
                <div className="set-card__qty">
                  <label className="set-card__drink-label">Кол-во</label>
                  <div className="counter counter--sm">
                    <button
                      type="button"
                      className="counter__btn"
                      aria-label="Убрать один сет"
                      disabled={quantity <= 0}
                      onClick={() => onQuantityChange(set.id, -1)}
                    >
                      −
                    </button>
                    <span className="counter__value">{quantity}</span>
                    <button
                      type="button"
                      className="counter__btn counter__btn--add"
                      aria-label="Добавить один сет"
                      onClick={() => onQuantityChange(set.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </article>
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
