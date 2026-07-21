import { useState } from 'react'
import type { CartState, LunchSet, PaymentMethod } from '../types'
import { formatPrice } from '../types'

interface CartLine {
  set: LunchSet
  quantity: number
  beverage: string
}

interface CartProps {
  sets: LunchSet[]
  cartState: CartState
  totalMonthlyPrice: number
  employeeCount: number
  onBack: () => void
  onPlaceOrder: (method: PaymentMethod) => void
}

function Cart({
  sets,
  cartState,
  totalMonthlyPrice,
  employeeCount,
  onBack,
  onPlaceOrder,
}: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('corporate')

  const lines: CartLine[] = sets
    .map((set) => ({
      set,
      cartItem: cartState[set.id],
    }))
    .filter(({ cartItem }) => cartItem && cartItem.quantity > 0)
    .map(({ set, cartItem }) => ({
      set,
      quantity: cartItem!.quantity,
      beverage: cartItem!.beverage,
    }))

  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0)

  const paymentOptions: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'corporate', label: 'Перечислением (Для юрлиц)', icon: '🏢' },
    { value: 'card', label: 'Перевод на карту (P2P)', icon: '💳' },
    { value: 'cash', label: 'Наличными курьеру', icon: '💵' },
  ]

  return (
    <div className="cart">
      <header className="cart__header">
        <button type="button" className="cart__back" onClick={onBack}>
          ← Назад
        </button>
        <h2 className="cart__title">Оформление заказа</h2>
      </header>

      {lines.length === 0 ? (
        <p className="catalog__status">Корзина пуста. Добавьте обеды из меню.</p>
      ) : (
        <>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px' }}>
            {employeeCount} сотрудников · {totalItems} порций
          </p>

          <ul className="cart__list">
            {lines.map(({ set, quantity, beverage }) => (
              <li key={set.id} className="cart__item">
                <div className="cart__item-icon" aria-hidden="true">🍱</div>
                <div className="cart__item-info">
                  <span className="cart__item-name">
                    {set.name}
                  </span>
                  <span className="cart__item-desc">
                    День {set.dayNumber} · {set.weekDay} · {beverage}
                  </span>
                </div>
                <div className="cart__item-sum">
                  <div>{quantity} × {formatPrice(set.price)}</div>
                  <div style={{ color: '#f97316' }}>{formatPrice(set.price * quantity)}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* Способ оплаты */}
          <section className="payment">
            <h3 className="payment__title">Способ оплаты</h3>
            <div className="payment__options" style={{ gridTemplateColumns: '1fr' }}>
              {paymentOptions.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`payment__option${paymentMethod === value ? ' payment__option--active' : ''}`}
                  onClick={() => setPaymentMethod(value)}
                >
                  <span className="payment__icon">{icon}</span>
                  <span className="payment__label">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Итог */}
          <div className="cart__summary">
            <span>Итого к оплате</span>
            <span className="cart__summary-total">{formatPrice(totalMonthlyPrice)}</span>
          </div>

          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={() => onPlaceOrder(paymentMethod)}
          >
            Оплатить {formatPrice(totalMonthlyPrice)}
          </button>
        </>
      )}
    </div>
  )
}

export default Cart
