import axios from 'axios'
import { cloudSetItem, cloudGetItem, cloudRemoveItem, getTelegramInitData } from './telegram'
import type { LunchSet, WeekDay } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://lunchistan-backend.onrender.com'

const TOKEN_KEY = 'lunchistan_token'
// Тот же ключ в CloudStorage Telegram — localStorage TMA стирается при закрытии,
// CloudStorage переживает любые перезапуски и остаётся привязан к аккаунту.
const TOKEN_CLOUD_KEY = 'lunchistan_token_v1'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
  // Дубль в CloudStorage Telegram (fire-and-forget, ошибки игнорируем).
  if (token) void cloudSetItem(TOKEN_CLOUD_KEY, token)
  else void cloudRemoveItem(TOKEN_CLOUD_KEY)
}

/**
 * Восстановить токен из Telegram CloudStorage (когда localStorage был очищен).
 * Возвращает токен и также кладёт его в localStorage. null — токена нет нигде.
 */
export async function restoreTokenFromCloud(): Promise<string | null> {
  const token = await cloudGetItem(TOKEN_CLOUD_KEY)
  if (token) {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
    return token
  }
  return null
}

const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 })

http.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Подписанная initData — бэкенд проверяет HMAC и берёт из неё настоящий
  // Telegram id/username, а не из тела запроса (см. auth.js verifyTelegramInitData).
  const initData = getTelegramInitData()
  if (initData) config.headers['x-telegram-init-data'] = initData
  return config
})

// ── Типы контура «Команды» ─────────────────────────────────────────
export interface AuthUser {
  id: number
  role: 'owner' | 'admin' | 'employee'
  name: string
  phone: string
  companyId: number
  companyName: string | null
  companyCode: string | null
  companySize: number | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
  employeesCount: number
}

export interface SetOfDay {
  setId: number
  setName: string
  setPrice: number
}

export interface MyDay {
  date: string
  locked: boolean
  choice: SetOfDay | null
  defaultSet: SetOfDay
}

export interface MyDaysResponse {
  days: MyDay[]
}

export interface ReportSet {
  setId: number
  setName: string
  setPrice: number
  count: number
  defaults: number
}

export interface DayReport {
  date: string
  scheduled: number
  unpicked: number
  totalSum: number
  confirmed: boolean
  perSet: ReportSet[]
}

export interface ManagerDate {
  date: string
  scheduled: number
  locked: boolean
  confirmed: boolean
}

// ── Авторизация ─────────────────────────────────────────────────────
export async function registerTeam(params: {
  name: string
  phone?: string
  password: string
  companyName: string
  companySize?: number
}): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/register', params)
  return data
}

export async function joinTeam(params: {
  name: string
  phone?: string
  password: string
  companyCode: string
}): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/register', params)
  return data
}

export async function login(params: { name: string; password: string; companyCode?: string }): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/login', params)
  return data
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/api/me')
  return data
}

interface RawMenuSet {
  id: number
  name: string
  category: LunchSet['category']
  price: number
  description: string
  image_url: string | null
  calories: number | null
  proteins: number | null
  fats: number | null
  carbs: number | null
  composition: LunchSet['composition']
}

const WEEK_DAYS: WeekDay[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']

// 11.09.2026: до этого меню было захардкожено в data/mockMenu.ts и не поддерживало
// правки без деплоя. dayNumber/weekDay — не поля БД, а позиция в списке (как раньше
// в mockMenu.ts: index+1 / WEEK_DAYS[index%5]), поэтому вычисляем их здесь же.
export async function fetchMenu(): Promise<LunchSet[]> {
  const { data } = await http.get<RawMenuSet[]>('/api/menu')
  return data.map((s, index) => ({
    id: s.id,
    dayNumber: index + 1,
    weekDay: WEEK_DAYS[index % 5],
    category: s.category,
    name: s.name,
    description: s.description,
    price: s.price,
    imageUrl: s.image_url ?? undefined,
    calories: s.calories ?? undefined,
    proteins: s.proteins ?? undefined,
    fats: s.fats ?? undefined,
    carbs: s.carbs ?? undefined,
    composition: s.composition ?? [],
  }))
}

// ── Владелец: управление меню (11.09.2026 — раньше меню правилось только
// деплоем кода, теперь дядя/брат сами добавляют/меняют/скрывают блюда) ─────
export interface OwnerMenuItem extends RawMenuSet {
  is_active: boolean
}

export interface MenuItemInput {
  name: string
  category: LunchSet['category']
  price: number
  description?: string
  image_url?: string | null
  calories?: number | null
  proteins?: number | null
  fats?: number | null
  carbs?: number | null
}

/** Всё меню, включая скрытые блюда (is_active=false) — только владельцу. */
export async function fetchOwnerMenu(): Promise<OwnerMenuItem[]> {
  const { data } = await http.get<OwnerMenuItem[]>('/api/owner/menu')
  return data
}

export async function createMenuItem(input: MenuItemInput): Promise<OwnerMenuItem> {
  const { data } = await http.post<OwnerMenuItem>('/api/owner/menu', input)
  return data
}

export async function updateMenuItem(
  id: number,
  input: Partial<MenuItemInput> & { is_active?: boolean },
): Promise<OwnerMenuItem> {
  const { data } = await http.put<OwnerMenuItem>(`/api/owner/menu/${id}`, input)
  return data
}

/** Мягкое удаление (is_active=false) — блюдо пропадает из каталога, не из истории заказов. */
export async function deleteMenuItem(id: number): Promise<void> {
  await http.delete(`/api/owner/menu/${id}`)
}

// ── Сотрудник: мои дни и выбор блюд ────────────────────────────────
export async function fetchMyDays(): Promise<MyDay[]> {
  const { data } = await http.get<MyDaysResponse>('/api/my/days')
  return data.days
}

export async function putMyDays(dates: string[]): Promise<MyDay[]> {
  const { data } = await http.put<MyDaysResponse>('/api/my/days', { dates })
  return data.days
}

export async function putMyChoice(date: string, setId: number): Promise<SetOfDay> {
  const { data } = await http.put<SetOfDay>(`/api/my/days/${date}/choice`, { setId })
  return data
}

// ── Менеджер: сводка и подтверждение ──────────────────────────────
export async function fetchManagerDates(): Promise<ManagerDate[]> {
  const { data } = await http.get<{ dates: ManagerDate[] }>('/api/manager/dates')
  return data.dates
}

export async function fetchDayReport(date: string): Promise<DayReport> {
  const { data } = await http.get<DayReport>(`/api/manager/report`, { params: { date } })
  return data
}

export async function confirmDay(date: string): Promise<DayReport> {
  const { data } = await http.post<DayReport>(`/api/manager/report/${date}/confirm`)
  return data
}

/** Повторная отправка чека кухне в Telegram для уже подтверждённого дня (если не дошло с первого раза). */
export async function resendDayReport(date: string): Promise<{ success: boolean; telegramSent: boolean }> {
  const { data } = await http.post<{ success: boolean; telegramSent: boolean }>(`/api/manager/report/${date}/resend`)
  return data
}

// ── Ошибки ─────────────────────────────────────────────────────────
export function apiErrorMessage(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const msg: string | undefined = err.response?.data?.error
    if (typeof msg === 'string' && msg.length > 0) return msg
  }
  return null
}

// ══ Оптовый заказ / заявка ═════════════════════════════════════════
export interface OrderLine {
  date: string
  day: number
  setId?: number
  setName?: string
  mainDish: string
  salad: string
  beverage: string
  portions: number
  unitPrice: number
  lineTotal: number
}

export interface OrderContact {
  contactName?: string
  contactPhone?: string
  companyName?: string
  address?: string
  comment?: string
  /** Координаты точки доставки (долгота/широта) — если адрес выбран на карте */
  destLon?: number
  destLat?: number
  /** Уточнение «до двери»: подъезд, этаж, домофон, ориентир */
  destDetail?: string
  /** Реальный Telegram ID клиента из TMA (управляется кодом, не пользователем) */
  tgUserId?: number
  /** Реальный @username клиента из TMA (управляется кодом, не пользователем) */
  tgUsername?: string
}

export interface OrderPayload extends OrderContact {
  employeeCount: number
  workDaysCount: number
  activeDays: number
  days: OrderLine[]
  lines: OrderLine[]
  totalMonthlyPrice: number
  paymentMethod: string
  /** Ключ для защиты от задвоения заказа при двойном клике/ретрае сети (см. App.tsx). */
  idempotencyKey?: string
}

export interface OrderResult {
  success: boolean
  orderId: number
  orderNumber: string
  status: string
  isLead: boolean
  telegramSent: boolean
  /** Итоговая доставка/сумма — считает сервер, это единственный источник правды для экрана успеха. */
  deliveryFee: number
  deliveryZone: string | null
  totalWithDelivery: number
}

/**
 * Отправляет заказ на backend. С валидным токеном (компания вошла) — заказ компании,
 * иначе — заявка-лид (нужны contactName/contactPhone). Бросает Error при неудаче.
 */
export async function submitOrder(payload: OrderPayload): Promise<OrderResult> {
  const { data } = await http.post<OrderResult>('/api/orders', payload, { timeout: 15000 })
  return data
}

// ── Доставка и адрес компании ─────────────────────────────────────
export interface DeliveryQuote {
  fee: number
  /** Название зоны («Центр»/«Город»/…) или null, если точка вне зон */
  zone: string | null
  inZone: boolean
  distanceKm: number
  freeDelivery: boolean
  /** Итоговая сумма с доставкой, если запрос шёл с totalAmount */
  totalWithDelivery: number | null
}

/** Расчёт стоимости доставки в точку (lat/lon). Бэкенд — источник истины. */
export async function fetchDeliveryQuote(
  lat: number,
  lon: number,
  totalAmount?: number,
): Promise<DeliveryQuote> {
  const { data } = await http.post<DeliveryQuote>('/api/delivery/quote', { lat, lon, totalAmount })
  return data
}

export interface CompanyAddress {
  lat: number
  lon: number
  label: string
}

export async function fetchCompanyAddress(): Promise<CompanyAddress | null> {
  const { data } = await http.get<{ address: CompanyAddress | null }>('/api/my/address')
  return data.address
}

export async function saveCompanyAddress(addr: {
  lat: number
  lon: number
  label: string
}): Promise<{ ok: boolean }> {
  const { data } = await http.put<{ ok: boolean }>('/api/my/address', addr)
  return data
}

// ── Заказы моей компании ───────────────────────────────────────────
export interface OrderView {
  id: number
  number: string
  status: string
  source: string
  isLead: boolean
  companyName: string | null
  contactName: string | null
  contactPhone: string | null
  tgUserId: number | null
  tgUsername: string | null
  address: string | null
  comment: string | null
  paymentMethod: string | null
  employeeCount: number
  totalAmount: number
  createdAt: string
  lines: {
    date: string
    setId: number | null
    setName: string
    mainDish: string | null
    salad: string | null
    beverage: string | null
    excluded: string[]
    portions: number
    unitPrice: number
    lineTotal: number
  }[]
  log?: { status: string; note: string | null; changed_at: string }[]
}

export async function fetchMyOrders(): Promise<OrderView[]> {
  const { data } = await http.get<{ orders: OrderView[] }>('/api/my/orders')
  return data.orders
}

// ── Сводка владельца ───────────────────────────────────────────────
export const ORDER_STATUSES = ['new', 'confirmed', 'in_progress', 'delivered', 'paid', 'cancelled'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]

export interface OwnerSummary {
  range: { from: string; to: string }
  orders: { total: number; byStatus: Record<OrderStatus, number> }
  money: { ordered: number; paid: number; unpaid: number }
  byDate: { date: string; portions: number; amount: number; bySet: { setName: string; portions: number }[] }[]
  teams: { pickedPortions: number; amount: number }
  leads: {
    new: number
    recent: { id: number; number: string; contactName: string | null; contactPhone: string | null; companyName: string | null; createdAt: string }[]
  }
}

export async function fetchOwnerSummary(from?: string, to?: string): Promise<OwnerSummary> {
  const { data } = await http.get<OwnerSummary>('/api/owner/summary', { params: { from, to } })
  return data
}

export interface KitchenDay {
  date: string
  totalPortions: number
  lines: { setName: string; salad: string | null; beverage: string | null; excluded: string[]; portions: number; company: string | null }[]
}

export async function fetchOwnerKitchen(date: string): Promise<KitchenDay> {
  const { data } = await http.get<KitchenDay>('/api/owner/kitchen', { params: { date } })
  return data
}

export async function fetchOwnerOrders(opts: { status?: string; leads?: '0' | '1' } = {}): Promise<OrderView[]> {
  const { data } = await http.get<{ orders: OrderView[] }>('/api/owner/orders', { params: opts })
  return data.orders
}

export async function fetchOwnerOrder(id: number): Promise<OrderView> {
  const { data } = await http.get<OrderView>(`/api/owner/orders/${id}`)
  return data
}

export async function setOrderStatus(id: number, status: OrderStatus, note?: string): Promise<OrderView> {
  const { data } = await http.post<OrderView>(`/api/owner/orders/${id}/status`, { status, note })
  return data
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await http.post('/api/auth/password', { oldPassword, newPassword })
}

// ── Настройки бизнеса (11.09.2026) — номер карты для оплаты "card": дядя решил
// показывать номер клиенту, а не подключать полноценный приём платежей. ─────
export interface BusinessSettings {
  paymentCardNumber: string | null
  paymentCardHolder: string | null
}

/** Публичная ручка — номер карты нужен клиенту на checkout ещё до входа во владельца. */
export async function fetchSettings(): Promise<BusinessSettings> {
  const { data } = await http.get<BusinessSettings>('/api/settings')
  return data
}

export async function updateSettings(input: Partial<BusinessSettings>): Promise<void> {
  await http.put('/api/owner/settings', input)
}