import { useState } from 'react'
import type { Lang } from '../types'
import { t } from '../locales/translations'

interface SuccessProps {
  lang: Lang
  onNewOrder: () => void
}

function generateOrderNumber() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `#ORD-${num}`
}

function Success({ lang, onNewOrder }: SuccessProps) {
  // Генерируем номер один раз при монтировании экрана.
  const [orderNumber] = useState(generateOrderNumber)

  return (
    <div className="success">
      <div className="success__check" aria-hidden="true">
        <svg viewBox="0 0 52 52" className="success__check-svg">
          <circle className="success__check-circle" cx="26" cy="26" r="25" />
          <path
            className="success__check-mark"
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
      </div>

      <h2 className="success__title">{t(lang, 'orderTitle')}</h2>
      <p className="success__text">
        {t(lang, 'orderText')}
      </p>

      <div className="success__order">
        <span className="success__order-label">{t(lang, 'orderNumber')}</span>
        <span className="success__order-number">{orderNumber}</span>
      </div>

      <button type="button" className="btn btn--primary btn--lg" onClick={onNewOrder}>
        {t(lang, 'newOrder')}
      </button>
    </div>
  )
}

export default Success
