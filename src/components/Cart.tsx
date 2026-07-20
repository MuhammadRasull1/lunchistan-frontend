import { useState } from 'react'
import type { CartState, MealSet, PaymentMethod } from '../types'
import { formatPrice } from '../types'

interface CartLine {
  set: MealSet
  quantity: number
}

interface CartProps {
  sets: MealSet[]
  cart: CartState
  total: number
  onIncrement: (set: MealSet) => void
  onDecrement: (set: MealSet) => void
  onBack: () => void
  onPay: (method: PaymentMethod) => void
}

function Cart({
  sets,
  cart,
  total,
  onIncrement,
  onDecrement,
  onBack,
  onPay,
}: CartProps) {
  const [method, setMethod] = useState<PaymentMethod>('corporate')

  const lines: CartLine[] = sets
    .filter((set) => (cart[set.id] ?? 0) > 0)
    .map((set) => ({ set, quantity: cart[set.id] }))

  return (
    <div className="cart">
      <header className="cart__header">
        <button type="button" className="cart__back" onClick={onBack}>
          ← Назад
        </button>
        <h2 className="cart__title">Оформление заказа</h2>
      </header>

      {lines.length === 0 ? (
        <p className="catalog__status">Корзина пуста.</p>
      ) : (
        <>
          <ul className="cart__list">
            {lines.map(({ set, quantity }) => (
              <li key={set.id} className="cart__item">
                <div className="cart__item-icon" aria-hidden="true">
                  🍱
                </div>
                <div className="cart__item-info">
                  <span className="cart__item-name">
                    {set.name}{' — '}
                    <span className="cart__item-price">
                      {formatPrice(set.price)}
                    </span>
                  </span>
                  <span className="cart__item-desc">{set.description}</span>
                </div>
                <div className="counter counter--sm">
                  <button
                    type="button"
                    className="counter__btn"
                    aria-label="Убрать один сет"
                    onClick={() => onDecrement(set)}
                  >
                    −
                  </button>
                  <span className="counter__value">{quantity}</span>
                  <button
                    type="button"
                    className="counter__btn counter__btn--add"
                    aria-label="Добавить один сет"
                    onClick={() => onIncrement(set)}
                  >
                    +
                  </button>
                </div>
                <span className="cart__item-sum">
                  {formatPrice(set.price * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <section className="payment">
            <h3 className="payment__title">Способ оплаты</h3>
            <div className="payment__options">
              <button
                type="button"
                className={`payment__option${
                  method === 'corporate' ? ' payment__option--active' : ''
                }`}
                onClick={() => setMethod('corporate')}
              >
                <span className="payment__icon">🏢</span>
                <span className="payment__label">Корпоративный счёт</span>
              </button>
              <button
                type="button"
                className={`payment__option${
                  method === 'card' ? ' payment__option--active' : ''
                }`}
                onClick={() => setMethod('card')}
              >
                <span className="payment__icon">💳</span>
                <span className="payment__label">Банковская карта</span>
              </button>
            </div>
          </section>

          <div className="cart__summary">
            <span>Итого к оплате</span>
            <span className="cart__summary-total">{formatPrice(total)}</span>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={() => onPay(method)}
          >
            Оплатить {formatPrice(total)}
          </button>
        </>
      )}
    </div>
  )
}

export default Cart
