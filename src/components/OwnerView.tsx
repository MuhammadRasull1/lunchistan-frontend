import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Phone, ChevronRight, X, Plus, Pencil, EyeOff, Eye } from 'lucide-react'
import type { Lang, SetCategory } from '../types'
import { t } from '../locales/translations'
import {
  fetchOwnerSummary, fetchOwnerOrders, fetchOwnerKitchen,
  fetchOwnerMenu, createMenuItem, updateMenuItem,
} from '../lib/api'
import type { OwnerSummary, OrderView, KitchenDay, OwnerMenuItem, MenuItemInput } from '../lib/api'
import { statusLabel, statusColor, formatMoney, dateChip } from '../lib/orderStatus'
import OrderDetailSheet from './OrderDetailSheet'
import Reveal from './Reveal'

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
  const [menuOpen, setMenuOpen] = useState(false)

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--outline" onClick={() => setMenuOpen(true)}>
            {t(lang, 'menuManage')}
          </button>
          <button className="btn btn--outline" onClick={refresh} disabled={loading}>
            <RefreshCw size={15} /> {t(lang, 'refresh')}
          </button>
        </div>
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
            {statuses.map(([s, n], i) => (
              <Reveal key={s} y={10} delay={Math.min(i * 0.04, 0.2)}>
                <span className="manager-dates__chip">
                  <span className="status-dot" style={{ background: statusColor(s) }} />
                  {statusLabel(lang, s)} · {n}
                </span>
              </Reveal>
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
              {summary.leads.recent.map((l, i) => (
                <Reveal key={l.id} y={10} delay={Math.min(i * 0.05, 0.25)}>
                  <div className="day-row">
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
                </Reveal>
              ))}
            </div>
          )}

          {/* Лист для кухни */}
          <h3 className="view__section-title" style={{ marginTop: 28 }}>{t(lang, 'kitchenSheet')}</h3>
          {summary.byDate.length === 0 ? (
            <p className="view__section-desc">{t(lang, 'kitchenEmpty')}</p>
          ) : (
            <div className="days-list">
              {summary.byDate.map((d, i) => (
                <Reveal key={d.date} y={10} delay={Math.min(i * 0.05, 0.3)}>
                  <button className="day-row day-row--btn" onClick={() => setOpenDate(d.date)}>
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
                </Reveal>
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

      {/* Управление меню — до 11.09.2026 меню можно было поменять только деплоем кода */}
      {menuOpen && <MenuManagerSheet lang={lang} onClose={() => setMenuOpen(false)} />}
    </main>
  )
}

const CATEGORY_OPTIONS: { value: SetCategory; labelKey: string }[] = [
  { value: 'hot', labelKey: 'categoryHot' },
  { value: 'salad', labelKey: 'categorySalad' },
  { value: 'side', labelKey: 'categorySide' },
  { value: 'fastfood', labelKey: 'categoryFastfood' },
  { value: 'appetizer', labelKey: 'categoryAppetizer' },
  { value: 'soup', labelKey: 'categorySoup' },
]

function categoryLabel(lang: Lang, category: SetCategory): string {
  return t(lang, CATEGORY_OPTIONS.find((c) => c.value === category)?.labelKey ?? 'categoryHot')
}

// ── Управление меню: список блюд, скрыть/вернуть, добавить/изменить ─────
function MenuManagerSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [items, setItems] = useState<OwnerMenuItem[] | null>(null)
  const [error, setError] = useState(false)
  const [editItem, setEditItem] = useState<OwnerMenuItem | 'new' | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchOwnerMenu()
      .then((data) => { if (!cancelled) { setItems(data); setError(false) } })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [reloadKey])

  const toggleActive = async (item: OwnerMenuItem) => {
    // Оптимистично — список может быть длинным, не ждём ответа сервера, чтобы переключить.
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)) ?? prev)
    try {
      await updateMenuItem(item.id, { is_active: !item.is_active })
    } catch {
      // Откат при ошибке сети — иначе список молча разойдётся с реальным состоянием на сервере.
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, is_active: item.is_active } : i)) ?? prev)
    }
  }

  return (
    <AnimatePresence>
      <motion.div key="mm-overlay" className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="mm-sheet" className="modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
        <div className="modal-sheet__handle" />
        <button type="button" className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'close')}>
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="modal-sheet__scroll">
          <h2 className="calendar-modal__title">{t(lang, 'menuManageTitle')}</h2>

          <button className="btn btn--outline" style={{ marginTop: 12, marginBottom: 16 }} onClick={() => setEditItem('new')}>
            <Plus size={15} /> {t(lang, 'menuAddDish')}
          </button>

          {error && <div className="auth-error">{t(lang, 'menuLoadError')}</div>}
          {!error && items === null && <p className="view__section-desc">{t(lang, 'loadingLabel')}</p>}
          {items !== null && items.length === 0 && <p className="view__section-desc">{t(lang, 'menuEmpty')}</p>}

          <div className="days-list">
            {items?.map((item) => (
              <div key={item.id} className="day-row" style={{ opacity: item.is_active ? 1 : 0.55 }}>
                <div className="day-row__dish">
                  <span className="day-row__name">
                    {item.name}
                    {!item.is_active && <span className="status-badge" style={{ marginLeft: 8, background: 'var(--text-muted, #999)' }}>{t(lang, 'menuHiddenBadge')}</span>}
                  </span>
                  <span className="day-row__hint">{categoryLabel(lang, item.category)} · {formatMoney(item.price, lang)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn--outline" style={{ padding: '6px 10px' }} onClick={() => setEditItem(item)} aria-label={t(lang, 'menuEditDish')}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn--outline" style={{ padding: '6px 10px' }} onClick={() => toggleActive(item)} aria-label={item.is_active ? t(lang, 'menuHide') : t(lang, 'menuRestore')}>
                    {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {editItem && (
        <DishFormSheet
          lang={lang}
          item={editItem === 'new' ? null : editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); setReloadKey((k) => k + 1) }}
        />
      )}
    </AnimatePresence>
  )
}

// ── Форма блюда: общая для создания и редактирования ─────────────
function DishFormSheet({
  lang, item, onClose, onSaved,
}: { lang: Lang; item: OwnerMenuItem | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<SetCategory>(item?.category ?? 'hot')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [calories, setCalories] = useState(item?.calories != null ? String(item.calories) : '')
  const [proteins, setProteins] = useState(item?.proteins != null ? String(item.proteins) : '')
  const [fats, setFats] = useState(item?.fats != null ? String(item.fats) : '')
  const [carbs, setCarbs] = useState(item?.carbs != null ? String(item.carbs) : '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toIntOrNull = (v: string): number | null => {
    const n = Number(v.trim())
    return v.trim() !== '' && Number.isFinite(n) ? Math.round(n) : null
  }

  const handleSave = async () => {
    if (!name.trim()) { setError(t(lang, 'menuNameRequired')); return }
    const priceNum = Math.round(Number(price))
    if (!Number.isFinite(priceNum) || priceNum <= 0) { setError(t(lang, 'menuPriceRequired')); return }

    setSaving(true)
    setError(null)
    const input: MenuItemInput = {
      name: name.trim(),
      category,
      price: priceNum,
      description: description.trim(),
      image_url: imageUrl.trim() || null,
      calories: toIntOrNull(calories),
      proteins: toIntOrNull(proteins),
      fats: toIntOrNull(fats),
      carbs: toIntOrNull(carbs),
    }
    try {
      if (item) await updateMenuItem(item.id, input)
      else await createMenuItem(input)
      onSaved()
    } catch {
      setError(t(lang, 'menuSaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div key="df-overlay" className="modal-overlay modal-overlay--nested" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="df-sheet" className="modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}>
        <div className="modal-sheet__handle" />
        <button type="button" className="modal-sheet__close" onClick={onClose} aria-label={t(lang, 'close')}>
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="modal-sheet__scroll">
          <h2 className="calendar-modal__title">{item ? t(lang, 'menuEditDish') : t(lang, 'menuNewDish')}</h2>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-card" style={{ gap: 12, marginTop: 12 }}>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldName')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldCategory')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as SetCategory)}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{t(lang, c.labelKey)}</option>
                ))}
              </select>
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldPrice')}</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldDescription')}</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldImageUrl')}</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} inputMode="url" placeholder="https://…" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldCalories')}</label>
              <input value={calories} onChange={(e) => setCalories(e.target.value)} inputMode="numeric" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldProteins')}</label>
              <input value={proteins} onChange={(e) => setProteins(e.target.value)} inputMode="numeric" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldFats')}</label>
              <input value={fats} onChange={(e) => setFats(e.target.value)} inputMode="numeric" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'menuFieldCarbs')}</label>
              <input value={carbs} onChange={(e) => setCarbs(e.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className="btn btn--outline" onClick={onClose} disabled={saving}>{t(lang, 'menuCancel')}</button>
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{t(lang, 'menuSave')}</button>
          </div>
        </div>
      </motion.div>
    </>
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
