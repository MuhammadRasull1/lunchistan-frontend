import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { fetchMyOrders } from '../lib/api'
import type { OrderView } from '../lib/api'
import { statusLabel, statusColor, formatMoney, dateChip } from '../lib/orderStatus'
import OrderDetailSheet from './OrderDetailSheet'

interface Props {
  lang: Lang
}

export default function MyOrdersView({ lang }: Props) {
  const [orders, setOrders] = useState<OrderView[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchMyOrders()
      .then((list) => { if (!cancelled) { setOrders(list); setError(null) } })
      .catch(() => { if (!cancelled) { setError(t(lang, 'authError')); setOrders([]) } })
    return () => { cancelled = true }
  }, [lang, reloadKey])

  const load = () => setReloadKey((k) => k + 1)

  const openOrder = openId != null ? orders?.find((o) => o.id === openId) ?? null : null

  return (
    <div>
      <div className="view__section-head">
        <h2 className="view__section-title">{t(lang, 'myOrders')}</h2>
        <button className="btn btn--outline" onClick={load}>
          <RefreshCw size={15} /> {t(lang, 'refresh')}
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {orders === null && <p className="view__section-desc">{t(lang, 'loadingLabel')}</p>}
      {orders !== null && orders.length === 0 && <p className="view__section-desc">{t(lang, 'myOrdersEmpty')}</p>}

      <div className="days-list">
        {(orders ?? []).map((o) => (
          <button key={o.id} className="day-row day-row--btn" onClick={() => setOpenId(o.id)}>
            <div className="day-row__dish">
              <span className="day-row__name">{o.number}</span>
              <span className="day-row__hint">
                {o.lines.length ? `${dateChip(o.lines[0].date, lang)}${o.lines.length > 1 ? ` +${o.lines.length - 1}` : ''}` : ''}
                {' · '}{formatMoney(o.totalAmount, lang)}
              </span>
            </div>
            <span className="status-badge" style={{ background: statusColor(o.status) }}>
              {statusLabel(lang, o.status)}
            </span>
          </button>
        ))}
      </div>

      <OrderDetailSheet lang={lang} orderId={openId} preset={openOrder} onClose={() => setOpenId(null)} />
    </div>
  )
}
