/**
 * Тонкая безопасная обёртка над window.Telegram.WebApp.
 * Вне Telegram (обычный браузер) API отсутствует — все функции no-op / graceful fallback.
 */
export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  showAlert?: (message: string, callback?: () => void) => void
  themeParams?: Record<string, string>
  colorScheme?: 'light' | 'dark'
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
