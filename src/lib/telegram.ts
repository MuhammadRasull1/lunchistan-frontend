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

export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  showAlert?: (message: string, callback?: () => void) => void
  themeParams?: Record<string, string>
  colorScheme?: 'light' | 'dark'
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  MainButton?: TelegramMainButton
  HapticFeedback?: TelegramHapticFeedback
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

/** Лёгкая тактильная отдача для важных действий пользователя. Вне Telegram — no-op. */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // Haptics недоступны в этом клиенте — безопасно игнорируем
  }
}
