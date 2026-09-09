import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import type { OrderView, OrderStatus } from '../lib/api'
import { fetchOwnerOrder, setOrderStatus } from '../lib/api'
import { statusLabel, statusColor, nextStatuses, formatMoney, dateChip } from '../lib/orderStatus'

interface Props {
  lang: Lang
  orderId: number | null
  /** true — владелец: можно менять статус */
  owner?: boolean
  /** Заказ уже под рукой (из списка) — тогда деталь не догружаем без нужды */
  preset?: OrderView | null
  onClose: () => void
  onChanged?: (order: OrderView) => void
}

export default function OrderDetailSheet({ lang, orderId, owner, preset, onClose, onChanged }: Props) {
  const [fetched, setFetched] = useState<OrderView | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  // Отмена — необратимое по смыслу действие (клиент/кухня могли уже быть в курсе
  // заказа), поэтому один случайный тап не должен её выполнять — сперва подтверждение.
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelNote, setCancelNote] = useState('')

  useEffect(() => {
    if (orderId == null || !owner) return
    let cancelled = false
    fetchOwnerOrder(orderId)
      .then((o) => { if (!cancelled) setFetched(o) })
      .catch(() => { /* останется preset */ })
    return () => { cancelled = true }
  }, [orderId, owner])

  const order: OrderView | null = owner ? (fetched ?? preset ?? null) : (preset ?? null)

  const change = async (status: OrderStatus, note?: string) => {
    if (!order || busy) return
    setBusy(true)
    setMsg(null)
    try {
      const updated = await setOrderStatus(order.id, status, note)
      setFetched({ ...order, ...updated })
      setMsg(t(lang, 'statusChanged'))
      onChanged?.(updated)
      setConfirmingCancel(false)
      setCancelNote('')
    } catch {
      setMsg(t(lang, 'authError'))
    } finally {
      setBusy(false)
    }
  }

  const handleStatusClick = (s: OrderStatus) => {
    if (s === 'cancelled') {
      setConfirmingCancel(true)
      return
    }
    change(s)
  }

  return (
    <AnimatePresence>
      {orderId != null && (
        <>
          <motion.div key="od-overlay" className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            key="od-sheet"
            className="modal-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="modal-sheet__handle" />
            <button type="button" className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'close')}>
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="modal-sheet__scroll">
              {!order ? (
                <p className="view__section-desc">{t(lang, 'loadingLabel')}</p>
              ) : (
                <>
                  <h2 className="calendar-modal__title">{order.number}</h2>
                  <p className="calendar-modal__subtitle">
                    <span className="status-badge" style={{ background: statusColor(order.status) }}>
                      {statusLabel(lang, order.status)}
                    </span>
                    {order.isLead && <span className="with-ml">· {t(lang, 'leadTitle')}</span>}
                  </p>

                  {(order.companyName || order.contactName) && (
                    <div className="team-card">
                      {order.companyName && (
                        <div className="team-card__row">
                          <span className="team-card__label">{t(lang, 'contactCompany')}</span>
                          <span className="team-card__value">{order.companyName}</span>
                        </div>
                      )}
                      {order.contactName && (
                        <div className="team-card__row">
                          <span className="team-card__label">{t(lang, 'contactName')}</span>
                          <span className="team-card__value">{order.contactName}</span>
                        </div>
                      )}
                      {order.contactPhone && (
                        <div className="team-card__row">
                          <span className="team-card__label">{t(lang, 'contactPhone')}</span>
                          <a className="team-card__value" href={`tel:${order.contactPhone}`}>{order.contactPhone}</a>
                        </div>
                      )}
                      {order.address && (
                        <div className="team-card__row">
                          <span className="team-card__label">{t(lang, 'contactAddress')}</span>
                          <span className="team-card__value">{order.address}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <h3 className="view__section-title" style={{ marginTop: 20 }}>{t(lang, 'orderLinesLabel')}</h3>
                  <div className="report-lines">
                    {order.lines.map((l, i) => (
                      <div key={i} className="report-line">
                        <div className="report-line__info">
                          <span className="report-line__name">{l.setName}</span>
                          <span className="report-line__meta">
                            {dateChip(l.date, lang)}
                            {l.salad ? ` · ${l.salad}` : ''}{l.beverage ? ` · ${l.beverage}` : ''}
                            {l.excluded.length ? ` · без: ${l.excluded.join(', ')}` : ''}
                          </span>
                        </div>
                        <div className="report-line__count">{l.portions}×</div>
                      </div>
                    ))}
                  </div>

                  <div className="cart__summary">
                    <span>{t(lang, 'totalToPay')}</span>
                    <span className="cart__summary-total">{formatMoney(order.totalAmount, lang)}</span>
                  </div>
                  <p className="view__section-desc view__section-desc--muted">
                    {order.employeeCount} {t(lang, 'employeesPlural')}
                    {order.paymentMethod ? ` · ${t(lang, order.paymentMethod)}` : ''}
                  </p>

                  {msg && <div className="auth-error auth-error--ok">{msg}</div>}

                  {owner && nextStatuses(order.status).length > 0 && (
                    <>
                      <h3 className="view__section-title" style={{ marginTop: 20 }}>{t(lang, 'changeStatus')}</h3>
                      <div className="status-actions">
                        {nextStatuses(order.status).map((s) => (
                          <button
                            key={s}
                            className={`btn btn--outline${s === 'cancelled' ? ' btn--outline-danger' : ''}`}
                            disabled={busy}
                            onClick={() => handleStatusClick(s)}
                          >
                            {statusLabel(lang, s)}
                          </button>
                        ))}
                      </div>

                      {confirmingCancel && (
                        <div className="cancel-confirm">
                          <p className="cancel-confirm__text">
                            {t(lang, 'cancelConfirmText', { number: order.number })}
                          </p>
                          <input
                            className="cancel-confirm__note"
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                            placeholder={t(lang, 'cancelNotePlaceholder')}
                          />
                          <div className="cancel-confirm__actions">
                            <button
                              type="button"
                              className="btn btn--outline"
                              disabled={busy}
                              onClick={() => { setConfirmingCancel(false); setCancelNote('') }}
                            >
                              {t(lang, 'cancelConfirmNo')}
                            </button>
                            <button
                              type="button"
                              className="btn btn--outline btn--outline-danger"
                              disabled={busy}
                              onClick={() => change('cancelled', cancelNote.trim() || undefined)}
                            >
                              {t(lang, 'cancelConfirmYes')}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
