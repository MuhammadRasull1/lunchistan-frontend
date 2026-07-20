import { useState } from 'react'
import axios from 'axios'
import './App.css'

interface Dish {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
}

type Screen = 'welcome' | 'menu'

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [employees, setEmployees] = useState<string>('')
  const [dish, setDish] = useState<Dish | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inputError, setInputError] = useState('')

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('ru-RU').format(value) + ' сум'

  const handleEmployeesChange = (value: string) => {
    setEmployees(value)
    if (Number(value) > 0) {
      setInputError('')
    }
  }

  const handleShowMenu = async () => {
    const count = Number(employees)
    if (employees.trim() === '' || count <= 0) {
      setInputError('напиши число')
      return
    }
    setInputError('')
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get<Dish[]>(
        `${import.meta.env.VITE_API_URL}/api/menu`
      )
      if (data && data.length > 0) {
        setDish(data[0])
        setScreen('menu')
      } else {
        setError('Меню пока недоступно. Попробуйте позже.')
      }
    } catch {
      setError('Не удалось загрузить меню. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = () => {
    alert('🎉 Заказ отправлен на кухню Lunchistan!')
  }

  const total = dish ? dish.price * Number(employees) : 0

  return (
    <div className="app">
      <div className="card">
        <div className="brand">
          <span className="logo">🍽️</span>
          <span>
            Lunch<span className="accent">istan</span>
          </span>
        </div>

        {screen === 'welcome' && (
          <>
            <p className="subtitle">Вкусные обеды для вашей команды</p>
            <label className="field-label" htmlFor="employees">
              Сколько сотрудников нужно накормить?
            </label>
            <input
              id="employees"
              className="input"
              type="number"
              min={1}
              value={employees}
              onChange={(e) => handleEmployeesChange(e.target.value)}
            />
            {inputError && <p className="error error-inline">{inputError}</p>}
            <button
              type="button"
              className="btn btn-primary mt"
              onClick={handleShowMenu}
            >
              {loading ? 'Загружаем...' : 'Смотреть меню'}
            </button>
            {error && <p className="error">{error}</p>}
          </>
        )}

        {screen === 'menu' && dish && (
          <>
            <img className="dish-image" src={dish.imageUrl} alt={dish.name} />
            <h2 className="dish-name">{dish.name}</h2>
            <p className="dish-description">{dish.description}</p>
            <span className="dish-price">
              {formatPrice(dish.price)} за порцию
            </span>

            <div className="calc">
              <div className="calc-row">
                <span>Количество человек</span>
                <span>{Number(employees)}</span>
              </div>
              <div className="calc-row">
                <span>Цена за порцию</span>
                <span>{formatPrice(dish.price)}</span>
              </div>
              <div className="calc-row calc-total">
                <span>Итого к оплате</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleOrder}
            >
              Оформить заказ
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setScreen('welcome')}
            >
              Назад
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default App
