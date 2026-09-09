import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { formatPrice } from '../types'
import { hapticImpact, getBestLocation } from '../lib/telegram'
import { searchPlaces, reverseGeocode, labelFromFeature, type PhotonFeature } from '../lib/photon'
import { fetchDeliveryQuote, type CompanyAddress, type DeliveryQuote } from '../lib/api'

export interface AddressPick {
  label: string
  lat: number
  lon: number
  destDetail: string
}

interface AddressPickerProps {
  isOpen: boolean
  lang: Lang
  totalAmount: number
  initial?: CompanyAddress | null
  /** Согласие пользователя на использование геопозиции (даётся при входе) */
  geoAllowed: boolean
  onClose: () => void
  onSelect: (pick: AddressPick) => void
}

const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797]

const PIN_ICON = L.divIcon({
  className: 'address-picker__pin-wrap',
  html: '<div class="address-picker__pin"></div>',
  iconSize: [34, 44],
  iconAnchor: [17, 42],
})

function AddressPicker({ isOpen, lang, totalAmount, initial, geoAllowed, onClose, onSelect }: AddressPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [position, setPosition] = useState<{ lat: number; lon: number }>(
    initial?.lat != null ? { lat: initial.lat, lon: initial.lon } : { lat: DEFAULT_CENTER[0], lon: DEFAULT_CENTER[1] },
  )
  // Актуальная позиция для кода карты (инициализация/движение маркера), чтобы
  // карта создавалась один раз при открытии, а не при каждом движении маркера.
  const positionRef = useRef(position)
  const [label, setLabel] = useState(initial?.label ?? '')
  const [destDetail, setDestDetail] = useState('')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [highlight, setHighlight] = useState(-1)
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(false)
  // Точность последней гео-точки (м). Показывается кружком на карте; сбрасывается при ручном выборе.
  const [locAccuracy, setLocAccuracy] = useState<number | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  // ── Инициализация карты ──────────────────────────────────────────
  const initMap = useCallback(() => {
    mapRef.current?.remove()
    const container = containerRef.current
    if (!container) return null

    const start = positionRef.current
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
    }).setView([start.lat, start.lon], 15)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const marker = L.marker([start.lat, start.lon], { icon: PIN_ICON, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      setPosition({ lat: ll.lat, lon: ll.lng })
      setLocAccuracy(null)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      map.panTo(e.latlng)
      setPosition({ lat: e.latlng.lat, lon: e.latlng.lng })
      setLocAccuracy(null)
    })
    map.on('moveend', () => setQuery(''))

    markerRef.current = marker
    mapRef.current = map
    // Карта монтируется внутри модального слоя с анимацией — размер верен после показа.
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const cleanup = initMap()
    return () => {
      cleanup?.()
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [isOpen, initMap])

  // Передвижение маркера при смене position (гео/поиск) — не дёргает при drag.
  useEffect(() => {
    positionRef.current = position
    const marker = markerRef.current
    const map = mapRef.current
    if (!marker || !map) return
    marker.setLatLng([position.lat, position.lon])
    map.setView([position.lat, position.lon], map.getZoom())
  }, [position])

  // ── Reverse-геокод + тариф на каждую смену координат ────────────
  // reverseGeocode сам гасит ошибки, но fetchDeliveryQuote — обычный axios-запрос:
  // необработанный reject в Promise.all раньше ронял весь колбэк без единого
  // сообщения — quote просто оставался null молча (см. ОШИБКИ.md).
  const [quoteRetryTick, setQuoteRetryTick] = useState(0)
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    // Осознанно синхронно: индикатор загрузки должен появиться сразу, не после
    // резолва промиса — иначе кнопка "Подтвердить адрес" на миг доступна со старым тарифом.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuoteLoading(true)
    setQuoteError(false)
    const timer = setTimeout(async () => {
      try {
        const [geocoded, deliveryQuote] = await Promise.all([
          reverseGeocode(position.lat, position.lon),
          fetchDeliveryQuote(position.lat, position.lon, totalAmount),
        ])
        if (cancelled) return
        if (geocoded) setLabel(geocoded)
        setQuote(deliveryQuote)
        setQuoteLoading(false)
      } catch {
        if (cancelled) return
        setQuoteError(true)
        setQuoteLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, position.lat, position.lon, totalAmount, quoteRetryTick])

  // ── Поиск Photon (c дебаунсом) ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen || query.trim().length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const features = await searchPlaces({ q: query, lat: position.lat, lon: position.lon })
      if (!cancelled) {
        setResults(features)
        setHighlight(-1)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, query, position.lat, position.lon])

  // Легенда/подсказка, эскейп и т.п.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setHighlight(h => Math.min(h + 1, results.length - 1))
      if (e.key === 'ArrowUp') setHighlight(h => Math.max(h - 1, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, results.length])

  const applyFeature = (f: PhotonFeature) => {
    const [lon, lat] = f.geometry.coordinates
    hapticImpact('medium')
    setPosition({ lat, lon })
    setLabel(labelFromFeature(f))
    setLocAccuracy(null)
    setResults([])
    setQuery('')
  }

  const handleLocate = async () => {
    setLocating(true)
    setLocError(false)
    const fix = await getBestLocation().catch(() => null)
    setLocating(false)
    if (fix) {
      setPosition({ lat: fix.lat, lon: fix.lon })
      setLocAccuracy(fix.accuracy)
    } else {
      hapticImpact('heavy')
      setLocError(true)
    }
  }

  // Круг достоверности последней гео-точки: показывает, где реально находится устройство.
  useEffect(() => {
    const map = mapRef.current
    if (!map || locAccuracy == null || !Number.isFinite(locAccuracy)) return
    if (circleRef.current) {
      circleRef.current.setLatLng([position.lat, position.lon])
      circleRef.current.setRadius(locAccuracy)
    } else {
      circleRef.current = L.circle([position.lat, position.lon], {
        radius: locAccuracy,
        color: '#f97316',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#f97316',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map)
    }
    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
        circleRef.current = null
      }
    }
  }, [locAccuracy, position.lat, position.lon, isOpen])

  const handleConfirm = () => {
    if (position.lat == null || position.lon == null) return
    hapticImpact('medium')
    onSelect({
      label: label.trim() || `📍 ${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}`,
      lat: position.lat,
      lon: position.lon,
      destDetail: destDetail.trim(),
    })
    onClose()
  }

  const fee = quote?.fee ?? 0
  const total = totalAmount + fee

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            key="picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="address-picker"
            role="dialog"
            aria-modal="true"
            key="picker-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 1 }}
          >
            <div className="address-picker__handle" />
            <header className="address-picker__header">
              <div className="modal-sheet__close address-picker__close" onClick={onClose} role="button" aria-label={t(lang, 'close')}>
                <X size={20} strokeWidth={2.5} />
              </div>
              <h2 className="modal-sheet__title">{t(lang, 'deliveryAddress')}</h2>
            </header>

            {/* Поиск */}
            <div className="address-picker__search">
              <Search size={16} strokeWidth={2} className="address-picker__search-icon" />
              <input
                value={query}
                onChange={e => {
                  const v = e.target.value
                  setQuery(v)
                  if (v.trim().length < 2) setResults([])
                }}
                placeholder={t(lang, 'mapSearchPlaceholder')}
                autoComplete="off"
              />
              {results.length > 0 && (
                <ul className="address-picker__results" role="listbox">
                  {results.map((f, i) => (
                    <li key={`${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}-${i}`}>
                      <button
                        type="button"
                        className={i === highlight ? 'is-highlighted' : ''}
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => applyFeature(f)}
                      >
                        <MapPin size={15} strokeWidth={2} />
                        {labelFromFeature(f)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Карта */}
            <div className="address-picker__map" ref={containerRef} />
            <button
              type="button"
              className={`address-picker__locate${geoAllowed ? '' : ' address-picker__locate--off'}`}
              onClick={handleLocate}
              disabled={locating || !geoAllowed}
              title={geoAllowed ? t(lang, 'myLocation') : t(lang, 'geoNotAllowedHint')}
            >
              <Navigation size={16} strokeWidth={2} />
              {locating ? <Loader2 size={16} className="address-picker__spin" /> : t(lang, 'myLocation')}
            </button>
            {locError && <p className="address-picker__loc-error">{t(lang, 'locError')}</p>}
            {locAccuracy != null && (
              <p className={`address-picker__loc-info${locAccuracy > 3000 ? ' address-picker__loc-info--low' : ''}`}>
                {locAccuracy <= 3000
                  ? t(lang, 'locAccuracyLabel', { m: formatAccuracy(locAccuracy) })
                  : t(lang, 'locAccuracyLow')}
              </p>
            )}
            <p className="address-picker__hint">
              {geoAllowed ? t(lang, 'dropPinHint') : t(lang, 'geoNotAllowedHint')}
            </p>

            {/* Выбранный адрес + до двери + тариф */}
            <div className="address-picker__body">
              <div className="auth-field">
                <label>{t(lang, 'contactAddress')}</label>
                <div className="address-picker__address">
                  <MapPin size={15} strokeWidth={2} />
                  <span>{label || `${position.lat.toFixed(5)}, ${position.lon.toFixed(5)}`}</span>
                </div>
              </div>
              <div className="auth-field">
                <label>{t(lang, 'destDetail')} <span className="auth-hint">— {t(lang, 'optionalField')}</span></label>
                <input
                  value={destDetail}
                  onChange={e => setDestDetail(e.target.value)}
                  placeholder={t(lang, 'destDetailPlaceholder')}
                />
              </div>

              {quoteLoading && (
                <div className="address-picker__fee">{t(lang, 'deliveryQuoteLoading')}</div>
              )}
              {quoteError && (
                <div className="address-picker__fee cart__address-fee--error">
                  {t(lang, 'deliveryQuoteError')}{' '}
                  <button type="button" className="cart__address-change" onClick={() => setQuoteRetryTick(n => n + 1)}>
                    {t(lang, 'retry')}
                  </button>
                </div>
              )}
              {quote && !quoteLoading && !quoteError && (
                <div className="address-picker__fee">
                  <span className={quote.freeDelivery ? '' : 'address-picker__fee-value'}>
                    {quote.fee === 0
                      ? `${t(lang, 'deliveryFee')}: 0`
                      : `${t(lang, 'deliveryFee')}: ${formatPrice(quote.fee, lang)}`}
                    {quote.zone ? ` · ${quote.zone}` : ''}
                  </span>
                  {quote.totalWithDelivery != null && (
                    <span className="address-picker__fee-total">
                      {t(lang, 'totalWithDelivery')}: <b>{formatPrice(total, lang)}</b>
                    </span>
                  )}
                </div>
              )}

              <motion.button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={handleConfirm}
                disabled={quoteLoading || quoteError}
                whileTap={{ scale: 0.98 }}
              >
                <MapPin size={16} strokeWidth={2} />
                {t(lang, 'confirmAddress')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** Человекочитаемая точность гео-точки: «50 м» / «1.2 км». */
function formatAccuracy(meters: number): string {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} м`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} км`
}

export default AddressPicker