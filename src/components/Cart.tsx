import { useState } from 'react'
import type { CartState, Dish, PaymentMethod } from '../types'
import { formatPrice } from '../types'

interface CartLine {
  dish: Dish
  quantity: number
}

interface CartProps {
  dishes: Dish[]
  cart: CartState
  total: number
  onIncrement: (dish: Dish) => void
  onDecrement: (dish: Dish) => void
  onBack: () => void
  onPay: (method: PaymentMethod) => void
}

function Cart({
  dishes,
  cart,
  total,
  onIncrement,
  onDecrement,
  onBack,
  onPay,
}: CartProps) {
  const [method, setMethod] = useState<PaymentMethod>('corporate')

  const lines: CartLine[] = dishes
    .filter((dish) => (cart[dish.id] ?? 0) > 0)
    .map((dish) => ({ dish, quantity: cart[dish.id] }))

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
            {lines.map(({ dish, quantity }) => (
              <li key={dish.id} className="cart__item">
                <img
                  className="cart__item-image"
                  src={dish.imageUrl}
                  alt={dish.name}
                />
                <div className="cart__item-info">
                  <span className="cart__item-name">{dish.name}</span>
                  <span className="cart__item-price">
                    {formatPrice(dish.price)}
                  </span>
                </div>
                <div className="counter counter--sm">
                  <button
                    type="button"
                    className="counter__btn"
                    aria-label="Убрать одну порцию"
                    onClick={() => onDecrement(dish)}
                  >
                    −
                  </button>
                  <span className="counter__value">{quantity}</span>
                  <button
                    type="button"
                    className="counter__btn counter__btn--add"
                    aria-label="Добавить одну порцию"
                    onClick={() => onIncrement(dish)}
                  >
                    +
                  </button>
                </div>
                <span className="cart__item-sum">
                  {formatPrice(dish.price * quantity)}
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
