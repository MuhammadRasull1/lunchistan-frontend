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
