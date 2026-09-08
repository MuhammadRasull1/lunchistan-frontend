/**
 * Согласие на использование геопозиции пользователя для доставки заказов.
 * Обязательная кнопка на этапе авторизации. Хранится как токен: localStorage
 * + дубль в Telegram CloudStorage (переживает перезапуски TMA).
 */
import { cloudSetItem, cloudGetItem, cloudRemoveItem } from './telegram'

const GEO_CONSENT_KEY = 'lunchistan_geo_consent'
const GEO_CONSENT_CLOUD_KEY = 'lunchistan_geo_consent_v1'

export function getGeoConsent(): boolean {
  try {
    return localStorage.getItem(GEO_CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

export function setGeoConsent(consented: boolean): void {
  try {
    if (consented) localStorage.setItem(GEO_CONSENT_KEY, '1')
    else localStorage.removeItem(GEO_CONSENT_KEY)
  } catch {
    // ignore
  }
  // Дубль в CloudStorage Telegram (fire-and-forget, ошибки игнорируем).
  if (consented) void cloudSetItem(GEO_CONSENT_CLOUD_KEY, '1')
  else void cloudRemoveItem(GEO_CONSENT_CLOUD_KEY)
}

/** Восстановить согласие из CloudStorage, если localStorage был очищен. */
export async function restoreGeoConsentFromCloud(): Promise<boolean> {
  const value = await cloudGetItem(GEO_CONSENT_CLOUD_KEY)
  if (value === '1') {
    try { localStorage.setItem(GEO_CONSENT_KEY, '1') } catch { /* ignore */ }
    return true
  }
  return false
}