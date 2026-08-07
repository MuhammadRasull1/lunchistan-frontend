import axios from 'axios'

const API_BASE_URL = 'https://lunchistan-backend.onrender.com'

export interface OrderLine {
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
  lines: OrderLine[]
  totalMonthlyPrice: number
  paymentMethod: string
}

/** Отправляет заказ на backend. При неудаче бросает Error — вызывающий код показывает пользователю понятное сообщение. */
export async function submitOrder(payload: OrderPayload): Promise<void> {
  await axios.post(`${API_BASE_URL}/api/orders`, payload, { timeout: 15000 })
}
