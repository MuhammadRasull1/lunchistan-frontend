/**
 * Тонкая безопасная обёртка над window.Telegram.WebApp.
 * Вне Telegram (обычный браузер) API отсутствует — все функции no-op / graceful fallback.
 */
export interface TelegramMainButton {
  isVisible: boolean
  isActive: boolean
  setText: (text: string) => void
  show: () => void
  hide: () => void
  enable: () => void
  disable: () => void
  onClick: (cb: () => void) => void
  offClick: (cb: () => void) => void
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
  notificationOccurred: (type: 'error' | 'success' | 'warning') => void
}

export interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (error: string | null, value?: string) => void) => void
  getItem: (key: string, callback: (error: string | null, value?: string) => void) => void
  removeItem: (key: string, callback?: (error: string | null) => void) => void
}

/** Данные геолокации Telegram (TMA 8.0+): latitude/longitude + точность и возраст. */
export interface TelegramLocationData {
  latitude?: number
  longitude?: number
  /** Погрешность в метрах */
  accuracy?: number
  /** Возраст данных в секундах (with_age: true) */
  age?: number
  altitude?: number
  heading?: number
  course?: number
  speed?: number
  timestamp?: number
}

/** Геолокация Telegram (TMA 8.0+). init() обязателен перед getLocation(). */
export interface TelegramLocationManager {
  isInited?: boolean
  init?: (opts?: object) => Promise<unknown> | unknown
  /** Запрос текущего местоположения устройства. Возвращает данные или ошибку. */
  getLocation: (opts?: { with_age?: boolean }) => Promise<TelegramLocationData> | TelegramLocationData
  /** Последнее известное местоположение — может быть устаревшим, для «живой» точки НЕ используем. */
  getLastKnownLocation?: () => Promise<TelegramLocationData> | TelegramLocationData
}

export interface TelegramUser {
  id: number
  username?: string
  firstName: string
  lastName?: string
}

export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  showAlert?: (message: string, callback?: () => void) => void
  themeParams?: Record<string, string>
  colorScheme?: 'light' | 'dark'
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  openTelegramLink?: (url: string) => void
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  initData?: string
  initDataUnsafe?: {
    user?: TelegramUser
    [key: string]: unknown
  }
  MainButton?: TelegramMainButton
  HapticFeedback?: TelegramHapticFeedback
  CloudStorage?: TelegramCloudStorage
  locationManager?: TelegramLocationManager
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Telegram?.WebApp
}

/** Инициализация: сообщаем клиенту Telegram, что приложение готово, и разворачиваем на весь экран. */
export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp()
  if (!tg) return
  try {
    tg.ready()
    tg.expand()
    // Принудительно светлые системные цвета Telegram (шапка/фон окна), чтобы
    // тёмная тема клиента не перекрывала светлый дизайн приложения.
    tg.setHeaderColor?.('#ffffff')
    tg.setBackgroundColor?.('#ffffff')
  } catch {
    // Telegram API недоступен/ограничен в этом клиенте — приложение продолжает работать как обычный сайт
  }
}

/** Показ алерта: нативный Telegram-алерт, если доступен, иначе обычный window.alert. */
export function showTelegramAlert(message: string): void {
  const tg = getTelegramWebApp()
  if (tg?.showAlert) {
    try {
      tg.showAlert(message)
      return
    } catch {
      // падаем обратно на window.alert
    }
  }
  if (typeof window !== 'undefined') {
    window.alert(message)
  }
}

/**
 * Открыть ссылку на Telegram-аккаунт/бота (`https://t.me/...`).
 * Внутри Telegram — нативно (`openTelegramLink`), иначе — новая вкладка браузера.
 */
export function openTelegramLink(url: string): void {
  const tg = getTelegramWebApp()
  try {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url)
      return
    }
  } catch {
    // API недоступен — падаем на обычное открытие ссылки
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/** Лёгкая тактильная отдача для важных действий пользователя. Вне Telegram — no-op. */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // Haptics недоступны в этом клиенте — безопасно игнорируем
  }
}

/**
 * Реальный пользователь Telegram из `initDataUnsafe.user`: числовой id и @username.
 * Доступен только когда приложение открыто внутри Telegram WebApp (TMA);
 * в обычном браузере (лендинг) возвращает null.
 */
export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp()
  const user = tg?.initDataUnsafe?.user
  if (!user || typeof user.id !== 'number') return null
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

// ── CloudStorage: персистентное хранилище Telegram ─────────────────
// local/WebView localStorage в Telegram стирается при закрытии, а CloudStorage
// живёт у Telegram и привязан к аккаунту пользователя. Используем его как
// дублирующий слой для токена сессии (см. lib/api.ts).

function getCloudStorage(): TelegramCloudStorage | undefined {
  return getTelegramWebApp()?.CloudStorage
}

export function cloudSetItem(key: string, value: string): Promise<void> {
  const cs = getCloudStorage()
  if (!cs) return Promise.resolve()
  return new Promise(resolve => {
    try {
      cs.setItem(key, value, () => resolve())
    } catch {
      resolve()
    }
  })
}

export function cloudGetItem(key: string): Promise<string | null> {
  const cs = getCloudStorage()
  if (!cs) return Promise.resolve(null)
  return new Promise(resolve => {
    try {
      cs.getItem(key, (err, value) => resolve(err ? null : value ?? null))
    } catch {
      resolve(null)
    }
  })
}

export function cloudRemoveItem(key: string): Promise<void> {
  const cs = getCloudStorage()
  if (!cs) return Promise.resolve()
  return new Promise(resolve => {
    try {
      cs.removeItem(key, () => resolve())
    } catch {
      resolve()
    }
  })
}

/** Точка геолокации с достоверностью. accuracy — погрешность в метрах (null = неизвестна). */
export interface GeoFix {
  lat: number
  lon: number
  accuracy: number | null
  source: 'tg' | 'browser'
}

function normalizeRes(raw: unknown): { lat: number; lon: number; accuracy: number | null; age: number | null } | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const lat = r.latitude ?? r.lat
  const lon = r.longitude ?? r.lon
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const accuracy = typeof r.accuracy === 'number' && Number.isFinite(r.accuracy) && r.accuracy >= 0 ? r.accuracy : null
  const age = typeof r.age === 'number' && Number.isFinite(r.age) ? r.age : null
  return { lat, lon, accuracy, age }
}

// init() TMA 8.0+ уведомляет Telegram, что будем запрашивать геолокацию.
// Без него getLocation может вернуть устаревшие/дефолтные данные или ошибку.
let tgLocationInited = false
async function ensureTgLocationInit(): Promise<void> {
  const lm = getTelegramWebApp()?.locationManager
  if (!lm?.init || tgLocationInited) return
  try {
    await Promise.resolve(lm.init())
  } catch {
    // init = подписка, если Telegram не дал — getLocation всё равно попробуем ниже
  } finally {
    tgLocationInited = true
  }
}

/** Свежее местоположение через Telegram locationManager (TMA 8.0+). Устаревшее (>120с) — отклоняется. */
export async function getTelegramLocation(): Promise<GeoFix | null> {
  const lm = getTelegramWebApp()?.locationManager
  if (!lm?.getLocation) return null
  try {
    await ensureTgLocationInit()
    // with_age — чтобы мы видели возраст данных и не брали «последнее известное» из прошлого.
    const res = await Promise.resolve(lm.getLocation({ with_age: true }))
    const norm = normalizeRes(res)
    if (!norm) return null
    if (norm.age != null && norm.age > 120) return null
    return { lat: norm.lat, lon: norm.lon, accuracy: norm.accuracy, source: 'tg' }
  } catch {
    return null
  }
}

/** Местоположение через браузерную геолокацию (promise + таймаут). */
export function getBrowserLocation(timeoutMs = 10000): Promise<GeoFix | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timer)
        const accuracy = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy, source: 'browser' })
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}

/**
 * Максимально точные доступные координаты: запрашиваем Telegram locationManager
 * и браузер параллельно, отдаём точку с меньшей погрешностью (accuracy измеряется метрами).
 * При равной точности предпочитаем браузер — это актуальный запрос к датчикам устройства.
 */
export async function getBestLocation(): Promise<GeoFix | null> {
  const [tg, browser] = await Promise.all([
    getTelegramLocation().catch(() => null),
    getBrowserLocation().catch(() => null),
  ])
  const fixes = [tg, browser].filter((f): f is GeoFix => f != null)
  if (fixes.length === 0) return null
  fixes.sort((a, b) => (a.accuracy ?? Infinity) - (b.accuracy ?? Infinity))
  // Связку по погрешности решает свежесть запроса: browser получает точку сейчас.
  if (fixes.length > 1 && fixes[0].accuracy !== null && fixes[1].accuracy !== null && fixes[0].accuracy === fixes[1].accuracy) {
    return fixes.find(f => f.source === 'browser') ?? fixes[0]
  }
  return fixes[0]
}
