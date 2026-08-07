import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { CartState, LunchSet, PaymentMethod, Lang } from '../types'
import { formatPrice } from '../types'
import { t, localizeIngredient } from '../locales/translations'
import { getTelegramWebApp, hapticImpact } from '../lib/telegram'

interface CartLine {
  set: LunchSet
  portions: number
  totalPortions: number
}

interface CartProps {
  sets: LunchSet[]
  cartState: CartState
  totalMonthlyPrice: number
  employeeCount: number
  totalItems: number
  lang: Lang
  isSubmitting: boolean
  onBack: () => void
  onPlaceOrder: (method: PaymentMethod) => void
  onRemoveItem: (setId: string | number) => void
}

function Cart({
  sets,
  cartState,
  totalMonthlyPrice,
  employeeCount,
  totalItems,
  lang,
  isSubmitting,
  onBack,
  onPlaceOrder,
  onRemoveItem,
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
      }
    })

  const activeDays = activeLines.length

  const paymentOptions: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'corporate', label: t(lang, 'corporate'), icon: '🏢' },
    { value: 'card', label: t(lang, 'card'), icon: '💳' },
    { value: 'cash', label: t(lang, 'cash'), icon: '💵' },
  ]

  const handleRemoveItem = (setId: string | number) => {
    hapticImpact('light')
    onRemoveItem(setId)
  }

  // Нативная кнопка Telegram MainButton — зеркалит кнопку «Оплатить»
  const onPlaceOrderRef = useRef(onPlaceOrder)
  useEffect(() => { onPlaceOrderRef.current = onPlaceOrder }, [onPlaceOrder])

  useEffect(() => {
    const mainButton = getTelegramWebApp()?.MainButton
    if (!mainButton) return

    const handleClick = () => onPlaceOrderRef.current(paymentMethod)
    mainButton.setText(
      isSubmitting ? t(lang, 'submitting') : t(lang, 'pay', { price: formatPrice(totalMonthlyPrice) })
    )
    mainButton.onClick(handleClick)

    if (activeLines.length > 0 && !isSubmitting) {
      mainButton.enable()
      mainButton.show()
    } else if (activeLines.length > 0) {
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
  }, [lang, activeLines.length, totalMonthlyPrice, paymentMethod, isSubmitting])

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
          {t(lang, 'back')}
        </motion.button>
        <h2 className="cart__title">{t(lang, 'cartTitle')}</h2>
      </motion.header>

      {activeLines.length === 0 ? (
        <motion.p
          className="catalog__status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t(lang, 'noSelectedDays')}
        </motion.p>
      ) : (
        <>
          <motion.p
            style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '16px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {activeDays} {t(lang, 'days')} · {employeeCount} {t(lang, 'employeesPlural')} · {totalItems} {t(lang, 'portionsPlural')}
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
            {activeLines.map(({ set, portions, totalPortions }) => (
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
                    {t(lang, 'day')} {set.dayNumber} · {set.weekDay} · {portions} {t(lang, 'portionsPerEmployee')}
                  </span>
                  {(() => {
                    const excluded = cartState[set.id]?.excludedIngredients ?? []
                    if (excluded.length === 0) return null
                    return (
                      <span className="cart__item-desc cart__item-desc--excluded">
                        {t(lang, 'without')}: {excluded.map(n => localizeIngredient(lang, n)).join(', ')}
                      </span>
                    )
                  })()}
                </div>
                <div className="cart__item-sum">
                  <div>{totalPortions} × {formatPrice(set.price)}</div>
                  <div style={{ color: 'var(--brand)' }}>{formatPrice(set.price * totalPortions)}</div>
                </div>
                <button
                  type="button"
                  className="cart__item-remove"
                  aria-label={t(lang, 'removeFromCart')}
                  onClick={() => handleRemoveItem(set.id)}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
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
            <h3 className="payment__title">{t(lang, 'paymentMethod')}</h3>
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
            <span>{t(lang, 'totalToPay')}</span>
            <span className="cart__summary-total">{formatPrice(totalMonthlyPrice)}</span>
          </motion.div>

          <motion.button
            type="button"
            className={`btn btn--primary btn--lg${isSubmitting ? ' btn--loading' : ''}`}
            onClick={() => onPlaceOrder(paymentMethod)}
            disabled={isSubmitting}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={isSubmitting ? undefined : { scale: 1.02 }}
            whileTap={isSubmitting ? undefined : { scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <span className="btn__spinner" aria-hidden="true" />
                {t(lang, 'submitting')}
              </>
            ) : (
              t(lang, 'pay', { price: formatPrice(totalMonthlyPrice) })
            )}
          </motion.button>
        </>
      )}
    </motion.div>
  )
}

export default Cart
