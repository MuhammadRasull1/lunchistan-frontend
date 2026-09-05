import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Phone, ChevronRight, X } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { fetchOwnerSummary, fetchOwnerOrders, fetchOwnerKitchen } from '../lib/api'
import type { OwnerSummary, OrderView, KitchenDay } from '../lib/api'
import { statusLabel, statusColor, formatMoney, dateChip } from '../lib/orderStatus'
import OrderDetailSheet from './OrderDetailSheet'

interface Props {
  lang: Lang
  userName: string
  onLogout: () => void
}

const RANGES: { key: string; days: number; labelKey: string }[] = [
  { key: 'week', days: 7, labelKey: 'rangeWeek' },
  { key: '2weeks', days: 14, labelKey: 'range2Weeks' },
  { key: 'month', days: 30, labelKey: 'rangeMonth' },
]

function isoPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function OwnerView({ lang, userName, onLogout }: Props) {
  const [rangeKey, setRangeKey] = useState('week')
  const [summary, setSummary] = useState<OwnerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [allOrders, setAllOrders] = useState<OrderView[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const days = RANGES.find((r) => r.key === rangeKey)?.days ?? 7
    fetchOwnerSummary(new Date().toISOString().slice(0, 10), isoPlus(days))
      .then((s) => { if (!cancelled) { setSummary(s); setError(null) } })
      .catch(() => { if (!cancelled) setError(t(lang, 'authError')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [rangeKey, lang, reloadKey])

  const refresh = () => { setLoading(true); setReloadKey((k) => k + 1) }

  const openAllOrders = async () => {
    setAllOrders([])
    try { setAllOrders(await fetchOwnerOrders()) } catch { setAllOrders([]) }
  }

  const money = summary?.money
  const statuses = summary ? Object.entries(summary.orders.byStatus).filter(([, n]) => n > 0) : []

  return (
    <main className="view__body">
      <div className="view__section-head">
        <div>
          <div className="catalog__heading" style={{ marginTop: 20 }}>{t(lang, 'ownerTitle')}</div>
          <p className="catalog__subtitle">
            {userName} · <button className="auth-toggle with-ml" onClick={onLogout}>{t(lang, 'logout')}</button>
          </p>
        </div>
        <button className="btn btn--outline" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} /> {t(lang, 'refresh')}
        </button>
      </div>

      <div className="tabs" style={{ marginTop: 8 }}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={`tabs__tab${rangeKey === r.key ? ' tabs__tab--active' : ''}`}
            onClick={() => setRangeKey(r.key)}
          >
            {t(lang, r.labelKey)}
          </button>
        ))}
      </div>

      {error && <div className="auth-error">{error}</div>}
      {loading && !summary && <p className="view__section-desc">{t(lang, 'loadingLabel')}</p>}

      {summary && (
        <>
          {/* Деньги */}
          <div className="owner-money">
            <div className="stat-tile">
              <b>{formatMoney(money!.ordered, lang)}</b>
              {t(lang, 'moneyOrdered')}
            </div>
            <div className="stat-tile">
              <b style={{ color: '#22a058' }}>{formatMoney(money!.paid, lang)}</b>
              {t(lang, 'moneyPaid')}
            </div>
            <div className="stat-tile">
              <b style={{ color: money!.unpaid > 0 ? 'var(--destructive)' : 'var(--text)' }}>
                {formatMoney(money!.unpaid, lang)}
              </b>
              {t(lang, 'moneyUnpaid')}
            </div>
          </div>

          {/* Заказы по статусам */}
          <h3 className="view__section-title" style={{ marginTop: 28 }}>{t(lang, 'ordersByStatus')}</h3>
          <div className="manager-dates">
            {statuses.length === 0 && <p className="view__section-desc">{t(lang, 'myOrdersEmpty')}</p>}
            {statuses.map(([s, n]) => (
              <span key={s} className="manager-dates__chip">
                <span className="status-dot" style={{ background: statusColor(s) }} />
                {statusLabel(lang, s)} · {n}
              </span>
            ))}
          </div>
          <button className="btn btn--outline" style={{ marginTop: 12 }} onClick={openAllOrders}>
            {t(lang, 'allOrders')} <ChevronRight size={15} />
          </button>

          {/* Новые заявки */}
          <h3 className="view__section-title" style={{ marginTop: 28 }}>{t(lang, 'leadsNew')}</h3>
          {summary.leads.recent.length === 0 ? (
            <p className="view__section-desc">{t(lang, 'leadsNoneNew')}</p>
          ) : (
            <div className="days-list">
              {summary.leads.recent.map((l) => (
                <div key={l.id} className="day-row">
                  <div className="day-row__dish">
                    <span className="day-row__name">{l.companyName || l.contactName || l.number}</span>
                    <span className="day-row__hint">{l.contactName || '—'} · {l.number}</span>
                  </div>
                  {l.contactPhone && (
                    <a className="btn btn--outline day-row__pick" href={`tel:${l.contactPhone}`}>
                      <Phone size={14} /> {t(lang, 'callLead')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Лист для кухни */}
          <h3 className="view__section-title" style={{ marginTop: 28 }}>{t(lang, 'kitchenSheet')}</h3>
          {summary.byDate.length === 0 ? (
            <p className="view__section-desc">{t(lang, 'kitchenEmpty')}</p>
          ) : (
            <div className="days-list">
              {summary.byDate.map((d) => (
                <button key={d.date} className="day-row day-row--btn" onClick={() => setOpenDate(d.date)}>
                  <div className="day-row__date">{dateChip(d.date, lang)}</div>
                  <div className="day-row__dish">
                    <span className="day-row__name">{d.portions} {t(lang, 'portionsShort')}</span>
                    <span className="day-row__hint">
                      {d.bySet.slice(0, 3).map((s) => `${s.setName} ×${s.portions}`).join(', ')}
                      {d.bySet.length > 3 ? '…' : ''}
                    </span>
                  </div>
                  <ChevronRight size={16} className="day-row__pick" />
                </button>
              ))}
            </div>
          )}

          {summary.teams.pickedPortions > 0 && (
            <p className="view__section-desc view__section-desc--muted" style={{ marginTop: 12 }}>
              {t(lang, 'teamsPlanned')}: {summary.teams.pickedPortions} {t(lang, 'portionsShort')}
            </p>
          )}
        </>
      )}

      {/* Детализация даты (лист кухни) */}
      {openDate && <KitchenDaySheet lang={lang} date={openDate} onClose={() => setOpenDate(null)} />}

      {/* Список всех заказов */}
      {allOrders !== null && (
        <OrdersListSheet
          lang={lang}
          orders={allOrders}
          onClose={() => setAllOrders(null)}
          onOpen={(id) => { setAllOrders(null); setOrderId(id) }}
        />
      )}

      <OrderDetailSheet lang={lang} orderId={orderId} owner onClose={() => setOrderId(null)} onChanged={() => setReloadKey((k) => k + 1)} />
    </main>
  )
}

// ── Лист кухни на конкретную дату ────────────────────────────────
function KitchenDaySheet({ lang, date, onClose }: { lang: Lang; date: string; onClose: () => void }) {
  const [data, setData] = useState<KitchenDay | null>(null)
  useEffect(() => {
    fetchOwnerKitchen(date).then(setData).catch(() => setData(null))
  }, [date])

  return (
    <AnimatePresence>
      <motion.div key="kd-overlay" className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="kd-sheet" className="modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
        <div className="modal-sheet__handle" />
        <button type="button" className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'close')}>
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="modal-sheet__scroll">
          <h2 className="calendar-modal__title">{dateChip(date, lang)}</h2>
          {!data ? (
            <p className="view__section-desc">{t(lang, 'loadingLabel')}</p>
          ) : data.lines.length === 0 ? (
            <p className="view__section-desc">{t(lang, 'kitchenEmpty')}</p>
          ) : (
            <>
              <p className="calendar-modal__subtitle">{data.totalPortions} {t(lang, 'portionsShort')}</p>
              <div className="report-lines">
                {data.lines.map((l, i) => (
                  <div key={i} className="report-line">
                    <div className="report-line__info">
                      <span className="report-line__name">{l.setName}</span>
                      <span className="report-line__meta">
                        {l.company || '—'}
                        {l.salad ? ` · ${l.salad}` : ''}{l.beverage ? ` · ${l.beverage}` : ''}
                        {l.excluded.length ? ` · без: ${l.excluded.join(', ')}` : ''}
                      </span>
                    </div>
                    <div className="report-line__count">{l.portions}×</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Список заказов ──────────────────────────────────────────────
function OrdersListSheet({
  lang, orders, onClose, onOpen,
}: { lang: Lang; orders: OrderView[]; onClose: () => void; onOpen: (id: number) => void }) {
  return (
    <AnimatePresence>
      <motion.div key="ol-overlay" className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="ol-sheet" className="modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
        <div className="modal-sheet__handle" />
        <button type="button" className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'close')}>
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="modal-sheet__scroll">
          <h2 className="calendar-modal__title">{t(lang, 'allOrders')}</h2>
          {orders.length === 0 && <p className="view__section-desc">{t(lang, 'myOrdersEmpty')}</p>}
          <div className="days-list">
            {orders.map((o) => (
              <button key={o.id} className="day-row day-row--btn" onClick={() => onOpen(o.id)}>
                <div className="day-row__dish">
                  <span className="day-row__name">{o.number} · {o.companyName || o.contactName || '—'}</span>
                  <span className="day-row__hint">
                    {o.lines.length} {t(lang, 'days')} · {formatMoney(o.totalAmount, lang)}
                  </span>
                </div>
                <span className="status-badge" style={{ background: statusColor(o.status) }}>
                  {statusLabel(lang, o.status)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
