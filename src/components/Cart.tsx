import { useState } from 'react'
import { motion } from 'framer-motion'
import type { CartState, LunchSet, PaymentMethod } from '../types'
import { formatPrice } from '../types'

interface CartLine {
  set: LunchSet
  portions: number
  totalPortions: number
  beverage: string
}

interface CartProps {
  sets: LunchSet[]
  cartState: CartState
  totalMonthlyPrice: number
  employeeCount: number
  totalItems: number
  onBack: () => void
  onPlaceOrder: (method: PaymentMethod) => void
}

function Cart({
  sets,
  cartState,
  totalMonthlyPrice,
  employeeCount,
  totalItems,
  onBack,
  onPlaceOrder,
}: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('corporate')

  const activeLines: CartLine[] = sets
    .filter((set) => cartState[set.id]?.active)
    .map((set) => {
      const portions = cartState[set.id]?.portions ?? 1
      return {
        set,
        portions,
        totalPortions: portions * employeeCount,
        beverage: cartState[set.id]?.beverage ?? 'Вода',
      }
    })

  const activeDays = activeLines.length

  const paymentOptions: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'corporate', label: 'Перечислением (Для юрлиц)', icon: '🏢' },
    { value: 'card', label: 'Перевод на карту (P2P)', icon: '💳' },
    { value: 'cash', label: 'Наличными курьеру', icon: '💵' },
  ]

  return (
    <motion.div
      className="cart cart--glass"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.header
        className="cart__header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <motion.button
          type="button"
          className="cart__back"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Назад
        </motion.button>
        <h2 className="cart__title">Оформление заказа</h2>
      </motion.header>

      {activeLines.length === 0 ? (
        <motion.p
          className="catalog__status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Нет выбранных дней
        </motion.p>
      ) : (
        <>
          <motion.p
            style={{ fontSize: '15px', color: '#6b7280', marginBottom: '16px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {activeDays} дней · {employeeCount} сотрудников · {totalItems} порций
          </motion.p>

          <motion.ul
            className="cart__list"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {activeLines.map(({ set, portions, totalPortions, beverage }) => (
              <motion.li
                key={set.id}
                className="cart__item"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="cart__item-icon" aria-hidden="true">🍱</div>
                <div className="cart__item-info">
                  <span className="cart__item-name">
                    {set.name}
                  </span>
                  <span className="cart__item-desc">
                    День {set.dayNumber} · {set.weekDay} · {beverage} · {portions} порц./сотр.
                  </span>
                </div>
                <div className="cart__item-sum">
                  <div>{totalPortions} × {formatPrice(set.price)}</div>
                  <div style={{ color: '#f97316' }}>{formatPrice(set.price * totalPortions)}</div>
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {/* Способ оплаты */}
          <motion.section
            className="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <h3 className="payment__title">Способ оплаты</h3>
            <div className="payment__options" style={{ gridTemplateColumns: '1fr' }}>
              {paymentOptions.map(({ value, label, icon }) => (
                <motion.button
                  key={value}
                  type="button"
                  className={`payment__option${paymentMethod === value ? ' payment__option--active' : ''}`}
                  onClick={() => setPaymentMethod(value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="payment__icon">{icon}</span>
                  <span className="payment__label">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Итог */}
          <motion.div
            className="cart__summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <span>Итого к оплате</span>
            <span className="cart__summary-total">{formatPrice(totalMonthlyPrice)}</span>
          </motion.div>

          <motion.button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={() => onPlaceOrder(paymentMethod)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Оплатить {formatPrice(totalMonthlyPrice)}
          </motion.button>
        </>
      )}
    </motion.div>
  )
}

export default Cart
