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

function AddressPicker({ isOpen, lang, totalAmount, initial, onClose, onSelect }: AddressPickerProps) {
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
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(false)

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
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      map.panTo(e.latlng)
      setPosition({ lat: e.latlng.lat, lon: e.latlng.lng })
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
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const q = await Promise.all([
        reverseGeocode(position.lat, position.lon),
        fetchDeliveryQuote(position.lat, position.lon, totalAmount),
      ])
      if (cancelled) return
      if (q[0]) setLabel(q[0])
      setQuote(q[1])
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, position.lat, position.lon, totalAmount])

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
    setResults([])
    setQuery('')
  }

  const handleLocate = async () => {
    setLocating(true)
    setLocError(false)
    const loc = await getBestLocation()
    setLocating(false)
    if (loc) {
      setPosition(loc)
    } else {
      hapticImpact('heavy')
      setLocError(true)
    }
  }

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
              className="address-picker__locate"
              onClick={handleLocate}
              disabled={locating}
            >
              <Navigation size={16} strokeWidth={2} />
              {locating ? <Loader2 size={16} className="address-picker__spin" /> : t(lang, 'myLocation')}
            </button>
            {locError && <p className="address-picker__loc-error">{t(lang, 'locError')}</p>}
            <p className="address-picker__hint">{t(lang, 'dropPinHint')}</p>

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

              {quote && (
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

export default AddressPicker