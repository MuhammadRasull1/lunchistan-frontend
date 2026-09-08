import type { Lang, PaymentMethod } from '../types'
import { formatPrice } from '../types'
import { t } from '../locales/translations'
import { statusLabel, statusColor } from '../lib/orderStatus'
import Reveal from './Reveal'

interface SuccessProps {
  lang: Lang
  onNewOrder: () => void
  /** Номер заказа с backend (ORD-NNNN) */
  orderNumber?: string
  /** Статус заказа */
  status?: string
  /** Это заявка-лид (без входа) — с клиентом свяжется менеджер */
  isLead?: boolean
  paymentMethod?: PaymentMethod
  totalMonthlyPrice?: number
  employeeCount?: number
  activeDays?: number
}

const METHOD_LABEL_KEYS: Record<PaymentMethod, string> = {
  corporate: 'corporateLabel',
  card: 'cardLabel',
  cash: 'cashLabel',
}

function Success({
  lang, onNewOrder, orderNumber, status, isLead,
  paymentMethod, totalMonthlyPrice, employeeCount, activeDays,
}: SuccessProps) {
  const showSummary = paymentMethod !== undefined && totalMonthlyPrice !== undefined

  return (
    <div className="success">
      <Reveal y={10} delay={0}>
        <div className="success__check" aria-hidden="true">
          <svg viewBox="0 0 52 52" className="success__check-svg">
            <circle className="success__check-circle" cx="26" cy="26" r="25" />
            <path className="success__check-mark" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </Reveal>

      <Reveal y={10} delay={0.1}>
        <h2 className="success__title">{t(lang, isLead ? 'leadTitle' : 'orderTitle')}</h2>
        <p className="success__text">{t(lang, isLead ? 'leadText' : 'orderText')}</p>
      </Reveal>

      {orderNumber && (
        <Reveal y={10} delay={0.18}>
          <div className="success__order">
            <span className="success__order-label">{t(lang, 'orderNumber')}</span>
            <span className="success__order-number">{orderNumber}</span>
            {status && !isLead && (
              <span className="status-badge" style={{ background: statusColor(status), marginTop: 6 }}>
                {statusLabel(lang, status)}
              </span>
            )}
          </div>
        </Reveal>
      )}

      {showSummary && (
        <Reveal y={10} delay={0.26}>
          <div className="success__summary">
            <div className="success__summary-row">
              <span>{t(lang, 'paymentMethod')}</span>
              <span>{t(lang, METHOD_LABEL_KEYS[paymentMethod])}</span>
            </div>
            {activeDays !== undefined && employeeCount !== undefined && (
              <div className="success__summary-row">
                <span>{t(lang, 'selectedDays')}</span>
                <span>{activeDays} {t(lang, 'days')} · {employeeCount} {t(lang, 'employeesPlural')}</span>
              </div>
            )}
            <div className="success__summary-row success__summary-row--total">
              <span>{t(lang, 'totalToPay')}</span>
              <span>{formatPrice(totalMonthlyPrice, lang)}</span>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal y={10} delay={0.34}>
        <button type="button" className="btn btn--primary btn--lg" onClick={onNewOrder}>
          {t(lang, 'newOrder')}
        </button>
      </Reveal>
    </div>
  )
}

export default Success
