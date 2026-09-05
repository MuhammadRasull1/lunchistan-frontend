import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://lunchistan-backend.onrender.com'

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

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 })

client.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Типы нового контура ────────────────────────────────────────────

export type UserRole = 'admin' | 'employee'

export interface AuthUser {
  id: number
  role: UserRole
  name: string
  phone: string
  companyId: number
  companyName: string
  companyCode: string | null
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

export interface ReportSet {
  setId: number
  setName: string
  setPrice: number
  count: number
  defaults: number
  employees: string[]
}

export interface DayReport {
  date: string
  locked: boolean
  confirmed: boolean
  totalEmployees: number
  scheduled: number
  unpicked: number
  totalSum: number
  perSet: ReportSet[]
}

export interface ManagerDate {
  date: string
  scheduled: number
  locked: boolean
  confirmed: boolean
}

// ── Новый контур: выбор блюд ───────────────────────────────────────

export async function register(payload: {
  name: string
  phone: string
  password: string
  companyName?: string
  companyCode?: string
}): Promise<AuthResponse> {
  const { data } = await client.post('/api/auth/register', payload)
  return data
}

export async function login(phone: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post('/api/auth/login', { phone, password })
  return data
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await client.get('/api/me')
  return data
}

export async function fetchMyDays(): Promise<MyDay[]> {
  const { data } = await client.get('/api/my/days')
  return data.days
}

export async function putMyDays(dates: string[]): Promise<string[]> {
  const { data } = await client.put('/api/my/days', { dates })
  return data.dates
}

export async function putMyChoice(date: string, setId: number): Promise<SetOfDay> {
  const { data } = await client.put(`/api/my/days/${date}/choice`, { setId })
  return data.choice
}

export async function fetchManagerDates(): Promise<ManagerDate[]> {
  const { data } = await client.get('/api/manager/dates')
  return data.dates
}

export async function fetchDayReport(date: string): Promise<DayReport> {
  const { data } = await client.get(`/api/manager/report`, { params: { date } })
  return data
}

export async function confirmDay(date: string): Promise<DayReport> {
  const { data } = await client.post(`/api/manager/report/${date}/confirm`)
  return data.plan
}

// ── Легаси: одноразовый заказ компании ────────────────────────────

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

export async function submitOrder(payload: OrderPayload): Promise<void> {
  await client.post('/api/orders', payload)
}

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data
    if (detail && typeof detail.error === 'string') return detail.error
    if (detail && Array.isArray(detail.details)) return detail.details.join('; ')
  }
  return 'Ошибка сети. Попробуйте ещё раз'
}