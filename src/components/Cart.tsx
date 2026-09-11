import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, UtensilsCrossed, Building2, CreditCard, Banknote, MapPin } from 'lucide-react'
import type { SelectedDay, PaymentMethod, Lang } from '../types'
import { formatPrice } from '../types'
import { t } from '../locales/translations'
import { getTelegramWebApp, getTelegramUser, hapticImpact } from '../lib/telegram'
import { formatDayLabel } from '../lib/calendar'
import type { AuthUser, OrderContact, DeliveryQuote, CompanyAddress, BusinessSettings } from '../lib/api'
import { fetchCompanyAddress, fetchDeliveryQuote, fetchSettings } from '../lib/api'
import { getGeoConsent } from '../lib/geoConsent'
import type { AddressPick } from './AddressPicker'

// Leaflet и карта тяжёлые — грузим только когда открылся пикер адреса.
const AddressPicker = lazy(() => import('./AddressPicker'))

interface CartLine {
  date: string
  set: SelectedDay['set']
  item: SelectedDay['item']
  portions: number
  totalPortions: number
}

interface CartProps {
  days: SelectedDay[]
  totalMonthlyPrice: number
  employeeCount: number
  totalItems: number
  lang: Lang
  isSubmitting: boolean
  user: AuthUser | null
  onBack: () => void
  onPlaceOrder: (method: PaymentMethod, contact: OrderContact) => void
  onRemoveItem: (date: string) => void
}

function Cart({
  days,
  totalMonthlyPrice,
  employeeCount,
  totalItems,
  lang,
  isSubmitting,
  user,
  onBack,
  onPlaceOrder,
  onRemoveItem,
}: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('corporate')
  // Номер карты для перевода — дядя решил 11.09.2026: просто показать номер, без
  // приёма платежей в приложении. Грузим лениво: не нужен, пока не выбрали "card".
  const [cardSettings, setCardSettings] = useState<BusinessSettings | null>(null)
  useEffect(() => {
    if (paymentMethod !== 'card' || cardSettings) return
    fetchSettings().then(setCardSettings).catch(() => {})
  }, [paymentMethod, cardSettings])

  // Реальный аккаунт Telegram из TMA — защита от «шутников»: контакт подтягивается
  // автоматически и заменить его вручную нельзя. На лендинге (обычный браузер) = null.
  const tgUser = getTelegramUser()
  const [contactName, setContactName] = useState(user?.name ?? tgUser?.firstName ?? '')
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '')
  const [companyName, setCompanyName] = useState(user?.companyName ?? '')
  const [comment, setComment] = useState('')

  // ── Адрес доставки на карте ────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addressPick, setAddressPick] = useState<AddressPick | null>(null)
  const [savedCompanyAddress, setSavedCompanyAddress] = useState<CompanyAddress | null>(null)
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null)
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false)
  const [deliveryQuoteError, setDeliveryQuoteError] = useState(false)
  // Согласие на геопозицию пользователя — даётся при входе, хранится локально.
  const [geoConsent] = useState(() => getGeoConsent())

  // Адрес компании (по умолчанию доставка на завод/офис) — подсказка в пикере.
  useEffect(() => {
    if (!user?.companyId && !savedCompanyAddress) return
    let cancelled = false
    fetchCompanyAddress()
      .then(addr => { if (!cancelled && addr) setSavedCompanyAddress(addr) })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId])

  // Тариф доставки для выбранной точки — сумма в чекауте. Ошибку сети НЕ прячем:
  // раньше при сбое строка доставки просто исчезала, неотличимо от «доставка
  // бесплатна», и можно было оплатить заказ, не подозревая, что тариф не посчитан.
  const [quoteRetryTick, setQuoteRetryTick] = useState(0)
  useEffect(() => {
    if (!addressPick) return
    let cancelled = false
    // Осознанно синхронно: индикатор загрузки должен появиться сразу, не после
    // резолва промиса — иначе окно "делает вид что доставка бесплатна" не закрывается.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeliveryQuoteLoading(true)
    setDeliveryQuoteError(false)
    fetchDeliveryQuote(addressPick.lat, addressPick.lon, totalMonthlyPrice)
      .then(q => { if (!cancelled) { setDeliveryQuote(q); setDeliveryQuoteLoading(false) } })
      .catch(() => { if (!cancelled) { setDeliveryQuoteError(true); setDeliveryQuoteLoading(false) } })
    return () => { cancelled = true }
  }, [addressPick, totalMonthlyPrice, quoteRetryTick])

  // Пока адрес не выбран — доставки нет (в т.ч. очистка при выборе нового адреса).
  const delivery = addressPick ? deliveryQuote : null
  const grandTotal = totalMonthlyPrice + (delivery?.fee ?? 0)
  // Если адрес выбран, но тариф ещё грузится/не удался — оформление заблокировано:
  // иначе можно было заплатить «бесплатную» доставку, которая на деле не посчиталась.
  const deliveryReady = !addressPick || (!deliveryQuoteLoading && !deliveryQuoteError)

  const contact: OrderContact = {
    contactName: contactName.trim() || undefined,
    contactPhone: contactPhone.trim() || undefined,
    companyName: companyName.trim() || undefined,
    address: addressPick?.label || undefined,
    destLat: addressPick?.lat,
    destLon: addressPick?.lon,
    destDetail: addressPick?.destDetail || undefined,
    comment: comment.trim() || undefined,
    // Telegram-контакт из TMA — реальная личность, блокируется от ручного ввода.
    tgUserId: tgUser?.id,
    tgUsername: tgUser?.username,
  }
  // Обязательный контакт перед отправкой: реальный Telegram (TMA) ИЛИ имя+телефон.
  // Вошедшая компания без TMA тоже обязана оставить контакт (кроме owner — свои данные).
  const tgKnown = Boolean(tgUser?.id)
  const contactOk =
    tgKnown ||
    (user?.role === 'owner' && Boolean(user.name)) ||
    (contactName.trim().length > 1 && contactPhone.trim().length >= 5)

  const activeLines: CartLine[] = days.map(({ date, set, item }) => {
    const portions = item?.portions ?? 1
    return {
      date,
      set,
      item,
      portions,
      totalPortions: portions * employeeCount,
    }
  })

  const activeDays = activeLines.length
  const allDishesChosen = activeLines.length > 0 && activeLines.every(({ item }) => item?.setId != null)
  const canCheckout = allDishesChosen && contactOk && deliveryReady && activeLines.every(({ item }) => {
    return !!item?.salad && !!item?.beverage
  })

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { value: 'corporate', label: t(lang, 'corporate'), icon: Building2 },
    { value: 'card', label: t(lang, 'card'), icon: CreditCard },
    { value: 'cash', label: t(lang, 'cash'), icon: Banknote },
  ]

  const handleRemoveItem = (date: string) => {
    hapticImpact('light')
    onRemoveItem(date)
  }

  // Нативная кнопка Telegram MainButton — зеркалит кнопку «Оплатить»
  const onPlaceOrderRef = useRef(onPlaceOrder)
  useEffect(() => { onPlaceOrderRef.current = onPlaceOrder }, [onPlaceOrder])

  useEffect(() => {
    const mainButton = getTelegramWebApp()?.MainButton
    if (!mainButton) return

    const handleClick = () => onPlaceOrderRef.current(paymentMethod, {
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      address: addressPick?.label || undefined,
      destLat: addressPick?.lat,
      destLon: addressPick?.lon,
      destDetail: addressPick?.destDetail || undefined,
      comment: comment.trim() || undefined,
      tgUserId: tgUser?.id,
      tgUsername: tgUser?.username,
    })
    mainButton.setText(
      isSubmitting ? t(lang, 'submitting') : t(lang, 'pay', { price: formatPrice(grandTotal, lang) })
    )
    mainButton.onClick(handleClick)

    if (canCheckout && !isSubmitting) {
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
  }, [lang, activeLines.length, canCheckout, grandTotal, paymentMethod, isSubmitting,
      contactName, contactPhone, companyName, addressPick, comment, tgUser])

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
            {activeLines.map(({ date, set, item, portions, totalPortions }) => (
              <motion.li
                key={date}
                className="cart__item"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="cart__item-icon" aria-hidden="true"><UtensilsCrossed size={22} strokeWidth={1.8} /></div>
                <div className="cart__item-info">
                  <span className="cart__item-name">
                    {set.name}
                  </span>
                  <span className="cart__item-desc">
                    {formatDayLabel(date, lang)} · {portions} {t(lang, 'portionsPerEmployee')}
                  </span>
                  {(() => {
                    if (!item?.salad || !item?.beverage) return null
                    const beverageLabel = t(lang, item.beverage === 'Вода' ? 'water' : 'compote')
                    return (
                      <span className="cart__item-desc">
                        {item.salad} · {beverageLabel}
                      </span>
                    )
                  })()}
                </div>
                <div className="cart__item-sum">
                  <div>{totalPortions} × {formatPrice(set.price, lang)}</div>
                  <div className="cart__item-sum-total">{formatPrice(set.price * totalPortions, lang)}</div>
                </div>
                <button
                  type="button"
                  className="cart__item-remove"
                  aria-label={t(lang, 'removeFromCart')}
                  onClick={() => handleRemoveItem(date)}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </motion.li>
            ))}
          </motion.ul>

          {/* Контакты для доставки */}
          <motion.section
            className="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h3 className="payment__title">{t(lang, 'contactSection')}</h3>
            {tgKnown && (
              <div className="payment__telegram" role="status">
                <span className="payment__telegram-label">{t(lang, 'tgContactLabel')}</span>
                <span className="payment__telegram-value">
                  @{tgUser!.username ?? String(tgUser!.id)} · <a href={`https://t.me/${tgUser!.username ?? tgUser!.id}`} target="_blank" rel="noopener noreferrer">{t(lang, 'tgContactLink')}</a>
                </span>
              </div>
            )}
            <div className="auth-card" style={{ gap: 12 }}>
              <div className="auth-field">
                <label>{t(lang, 'contactName')}</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
              </div>
              <div className="auth-field">
                <label>{t(lang, 'contactPhone')}</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
              </div>
              <div className="auth-field">
                <label>{t(lang, 'contactCompany')} <span className="auth-hint">— {t(lang, 'optionalField')}</span></label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" />
              </div>
              <div className="auth-field">
                <label>{t(lang, 'deliveryAddress')} <span className="auth-hint">— {t(lang, 'optionalField')}</span></label>
                {addressPick ? (
                  <div className="cart__address-picked">
                    <div className="cart__address-line">
                      <MapPin size={15} strokeWidth={2} />
                      <span>
                        {addressPick.label}
                        {addressPick.destDetail ? ` — ${addressPick.destDetail}` : ''}
                      </span>
                    </div>
                    {deliveryQuoteLoading && (
                      <div className="cart__address-fee">{t(lang, 'deliveryQuoteLoading')}</div>
                    )}
                    {deliveryQuoteError && (
                      <div className="cart__address-fee cart__address-fee--error">
                        {t(lang, 'deliveryQuoteError')}{' '}
                        <button type="button" className="cart__address-change" onClick={() => setQuoteRetryTick(n => n + 1)}>
                          {t(lang, 'retry')}
                        </button>
                      </div>
                    )}
                    {delivery && !deliveryQuoteLoading && !deliveryQuoteError && (
                      <div className="cart__address-fee">
                        {delivery.fee === 0
                          ? `${t(lang, 'deliveryFee')}: 0`
                          : `${t(lang, 'deliveryFee')}: ${formatPrice(delivery.fee, lang)}`}
                        {delivery.zone ? ` · ${delivery.zone}` : ''}
                      </div>
                    )}
                    <button
                      type="button"
                      className="cart__address-change"
                      onClick={() => setPickerOpen(true)}
                    >
                      {t(lang, 'changeAddress')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="cart__address-pick"
                    onClick={() => setPickerOpen(true)}
                  >
                    <MapPin size={16} strokeWidth={2} />
                    {t(lang, 'selectAddressOnMap')}
                  </button>
                )}
              </div>
              <div className="auth-field">
                <label>{t(lang, 'contactComment')} <span className="auth-hint">— {t(lang, 'optionalField')}</span></label>
                <input value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              {!tgKnown && <span className="auth-hint">{t(lang, 'contactRequiredHint')}</span>}
              {!tgKnown && !user && <span className="auth-hint">{t(lang, 'loginToTrackHint')}</span>}
            </div>
          </motion.section>

          {/* Способ оплаты */}
          <motion.section
            className="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <h3 className="payment__title">{t(lang, 'paymentMethod')}</h3>
            <div className="payment__options" style={{ gridTemplateColumns: '1fr' }}>
              {paymentOptions.map(({ value, label, icon: Icon }) => (
                <motion.button
                  key={value}
                  type="button"
                  className={`payment__option${paymentMethod === value ? ' payment__option--active' : ''}`}
                  onClick={() => setPaymentMethod(value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="payment__icon">
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <span className="payment__label">{label}</span>
                </motion.button>
              ))}
            </div>

            {paymentMethod === 'card' && (
              <div className="payment__telegram" role="status" style={{ marginTop: 12 }}>
                {cardSettings?.paymentCardNumber ? (
                  <>
                    <span className="payment__telegram-label">{t(lang, 'cardNumberLabel')}</span>
                    <span className="payment__telegram-value">
                      {cardSettings.paymentCardNumber}
                      {cardSettings.paymentCardHolder ? ` · ${t(lang, 'cardHolderLabel')}: ${cardSettings.paymentCardHolder}` : ''}
                    </span>
                  </>
                ) : (
                  <span className="payment__telegram-value">{t(lang, 'cardNumberPending')}</span>
                )}
              </div>
            )}
          </motion.section>

          {/* Итог */}
          <motion.div
            className="cart__summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="cart__summary-rows">
              <span>{t(lang, 'totalToPay')}</span>
              <span className="cart__summary-total">{formatPrice(totalMonthlyPrice, lang)}</span>
            </div>
            {delivery != null && delivery.fee > 0 && (
              <div className="cart__summary-rows">
                <span>{t(lang, 'deliveryFee')}</span>
                <span>{formatPrice(delivery.fee, lang)}</span>
              </div>
            )}
            {delivery != null && (
              <div className="cart__summary-rows cart__summary-rows--grand">
                <span>{t(lang, 'totalWithDelivery')}</span>
                <span className="cart__summary-total">{formatPrice(grandTotal, lang)}</span>
              </div>
            )}
          </motion.div>

          {!canCheckout && (
            <motion.p
              className="catalog__status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {t(lang, !allDishesChosen
                ? 'chooseDishForEveryDay'
                : !contactOk
                  ? 'contactRequiredHint'
                  : !deliveryReady
                    ? (deliveryQuoteError ? 'deliveryQuoteError' : 'deliveryQuoteLoading')
                    : 'incompleteSelectionHint')}
            </motion.p>
          )}

          <motion.button
            type="button"
            className={`btn btn--primary btn--lg${isSubmitting ? ' btn--loading' : ''}`}
            onClick={() => onPlaceOrder(paymentMethod, contact)}
            disabled={isSubmitting || !canCheckout}
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
              t(lang, 'pay', { price: formatPrice(grandTotal, lang) })
            )}
          </motion.button>
        </>
      )}

      <Suspense fallback={null}>
        <AddressPicker
          isOpen={pickerOpen}
          lang={lang}
          totalAmount={totalMonthlyPrice}
          initial={savedCompanyAddress}
          geoAllowed={geoConsent}
          onClose={() => setPickerOpen(false)}
          onSelect={pick => {
            setDeliveryQuote(null)
            setAddressPick(pick)
          }}
        />
      </Suspense>
    </motion.div>
  )
}

export default Cart
