import { useState } from 'react'

interface SuccessProps {
  onNewOrder: () => void
}

function generateOrderNumber() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `#ORD-${num}`
}

function Success({ onNewOrder }: SuccessProps) {
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

      <h2 className="success__title">Заказ оформлен!</h2>
      <p className="success__text">
        Спасибо! Мы уже передали заказ на кухню Lunchistan.
      </p>

      <div className="success__order">
        <span className="success__order-label">Номер заказа</span>
        <span className="success__order-number">{orderNumber}</span>
      </div>

      <button type="button" className="btn btn--primary btn--lg" onClick={onNewOrder}>
        Сделать новый заказ
      </button>
    </div>
  )
}

export default Success
