import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://lunchistan-backend.onrender.com'

const TOKEN_KEY = 'lunchistan_token'

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
}

const http = axios.create({ baseURL: API_BASE_URL, timeout: 15000 })

http.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Типы контура «Команды» ─────────────────────────────────────────
export interface AuthUser {
  id: number
  role: 'admin' | 'employee'
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
  phone: string
  password: string
  companyName: string
  companySize?: number
}): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/register', params)
  return data
}

export async function joinTeam(params: {
  name: string
  phone: string
  password: string
  companyCode: string
}): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/register', params)
  return data
}

export async function login(params: { phone: string; password: string }): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/auth/login', params)
  return data
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/api/me')
  return data
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

// ── Ошибки ─────────────────────────────────────────────────────────
export function apiErrorMessage(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const msg: string | undefined = err.response?.data?.error
    if (typeof msg === 'string' && msg.length > 0) return msg
  }
  return null
}

// ══ Легаси: отправка заказа с посадочной (без авторизации) ══════════
export interface OrderLine {
  date: string
  day: number
  setName?: string
  mainDish: string
  salad: string
  beverage: string
  portions: number
  unitPrice: number
  lineTotal: number
}

export interface OrderPayload {
  employeeCount: number
  workDaysCount: number
  activeDays: number
  days: OrderLine[]
  lines: OrderLine[]
  totalMonthlyPrice: number
  paymentMethod: string
}

/** Отправляет заказ на backend. При неудаче бросает Error — вызывающий код показывает пользователю понятное сообщение. */
export async function submitOrder(payload: OrderPayload): Promise<void> {
  const { data } = await http.post('/api/orders', payload, { timeout: 15000 })
  return data
}