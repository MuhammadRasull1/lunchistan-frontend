import { useState } from 'react'
import './App.css'
import Catalog from './components/Catalog'
import Cart from './components/Cart'
import Success from './components/Success'
import { MONTHLY_SETS, SET_PRICE } from './data/mockMenu'
import type { CartState, Screen, PaymentMethod, Beverage, Lang } from './types'
import { formatPrice } from './types'
import { t } from './locales/translations'
import { showTelegramAlert } from './lib/telegram'

const MAX_WORK_DAYS = MONTHLY_SETS.length

function App() {
  const [screen, setScreen] = useState<Screen>('catalog')
  const [employeeCount, setEmployeeCount] = useState<number>(1)
  const [workDaysCount, setWorkDaysCount] = useState<number>(MAX_WORK_DAYS)
  const [lang, setLang] = useState<Lang>('ru')
  const [cartState, setCartState] = useState<CartState>(() => {
    const initial: CartState = {}
    MONTHLY_SETS.forEach(set => {
      initial[set.id] = { active: true, portions: 1, beverage: 'Вода', excludedIngredients: [] }
    })
    return initial
  })

  // Показываем только первые workDaysCount сетов
  const visibleSets = MONTHLY_SETS.slice(0, workDaysCount)

  /**
   * Установить количество рабочих дней.
   * При уменьшении — дни за пределами лимита деактивируются.
   * При увеличении — новые дни АВТОМАТИЧЕСКИ активируются (подгружаются в подписку).
   */
  const handleWorkDaysSet = (count: number) => {
    const clamped = Math.max(1, Math.min(MAX_WORK_DAYS, count))
    const prev = workDaysCount
    if (clamped === prev) return
    setWorkDaysCount(clamped)
    setCartState(prevState => {
      let changed = false
      const updated: CartState = {}
      for (const [id, item] of Object.entries(prevState)) {
        const numId = Number(id)
        let nextActive = item.active
        if (clamped > prev) {
          if (numId > prev && numId <= clamped && !item.active) {
            nextActive = true
            changed = true
          }
        } else if (clamped < prev) {
          if (numId > clamped && item.active) {
            nextActive = false
            changed = true
          }
        }
        updated[id] = nextActive === item.active ? item : { ...item, active: nextActive }
      }
      return changed ? updated : prevState
    })
  }

  const handleBeverageChange = (setId: string | number, beverage: Beverage) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, beverage },
      }
    })
  }

  const handleToggleDay = (setId: string | number) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, active: !item.active },
      }
    })
  }

  const handlePortionsChange = (setId: string | number, portions: number) => {
    const clamped = Math.max(1, portions)
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, portions: clamped },
      }
    })
  }

  const handleExcludeIngredients = (setId: string | number, excluded: string[]) => {
    setCartState(prev => {
      const item = prev[setId]
      if (!item) return prev
      return {
        ...prev,
        [setId]: { ...item, excludedIngredients: excluded },
      }
    })
  }

  const handleSelectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [id, item] of Object.entries(prev)) {
        const numId = Number(id)
        next[id] = { ...item, active: numId <= workDaysCount }
      }
      return next
    })
  }

  const handleDeselectAll = () => {
    setCartState(prev => {
      const next: CartState = {}
      for (const [id, item] of Object.entries(prev)) {
        const numId = Number(id)
        next[id] = { ...item, active: numId > workDaysCount ? item.active : false }
      }
      return next
    })
  }

  const handleEmployeeCountChange = (count: number) => {
    setEmployeeCount(Math.max(1, count))
  }

  // Динамический расчёт: сумма порций активных дней × employeeCount × SET_PRICE
  const activeDays = Object.values(cartState).filter(item => item?.active).length
  const totalPortionsFromActive = Object.values(cartState)
    .filter(item => item?.active)
    .reduce((sum, item) => sum + (item?.portions ?? 1), 0)
  const totalMonthlyPrice = totalPortionsFromActive * employeeCount * SET_PRICE
  const totalItems = totalPortionsFromActive * employeeCount

  const handlePlaceOrder = (method: PaymentMethod) => {
    try {
      const methodLabels: Record<PaymentMethod, string> = {
        corporate: t(lang, 'corporateLabel'),
        card: t(lang, 'cardLabel'),
        cash: t(lang, 'cashLabel'),
      }
      const lines = Object.entries(cartState)
        .filter(([, item]) => item?.active)
        .map(([id, item]) => {
          const set = MONTHLY_SETS.find(s => String(s.id) === id)
          const portions = item?.portions ?? 1
          const totalPortions = portions * employeeCount
          const excludedIngredients = item?.excludedIngredients ?? []
          const beverageExcluded = excludedIngredients.includes('Напиток')
          return {
            day: Number(id),
            setName: set?.name,
            portions,
            beverage: beverageExcluded ? null : item?.beverage ?? 'Вода',
            excludedIngredients,
            unitPrice: set?.price ?? SET_PRICE,
            lineTotal: (set?.price ?? SET_PRICE) * totalPortions,
          }
        })
      console.log('Заказ оформлен:', {
        employeeCount,
        workDaysCount,
        activeDays,
        lines,
        totalMonthlyPrice,
        paymentMethod: method,
      })
      showTelegramAlert(t(lang, 'orderAlert', {
        employees: employeeCount,
        method: methodLabels[method],
        price: formatPrice(totalMonthlyPrice),
      }))
      setScreen('success')
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error)
      showTelegramAlert(t(lang, 'orderError'))
    }
  }

  const handleNewOrder = () => {
    const reset: CartState = {}
    MONTHLY_SETS.forEach(set => {
      reset[set.id] = { active: true, portions: 1, beverage: 'Вода', excludedIngredients: [] }
    })
    setCartState(reset)
    setEmployeeCount(1)
    setWorkDaysCount(MAX_WORK_DAYS)
    setScreen('catalog')
  }

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang)
  }

  return (
    <div className="app">
      {screen === 'catalog' && (
        <Catalog
          sets={visibleSets}
          allSetsCount={MAX_WORK_DAYS}
          cartState={cartState}
          employeeCount={employeeCount}
          workDaysCount={workDaysCount}
          totalMonthlyPrice={totalMonthlyPrice}
          setPrice={SET_PRICE}
          lang={lang}
          onToggleDay={handleToggleDay}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onEmployeeCountChange={handleEmployeeCountChange}
          onWorkDaysSet={handleWorkDaysSet}
          onBeverageChange={handleBeverageChange}
          onPortionsChange={handlePortionsChange}
          onExcludeIngredients={handleExcludeIngredients}
          onGoToCart={() => setScreen('cart')}
          onLangChange={handleLangChange}
        />
      )}

      {screen === 'cart' && (
        <Cart
          sets={MONTHLY_SETS}
          cartState={cartState}
          totalMonthlyPrice={totalMonthlyPrice}
          employeeCount={employeeCount}
          totalItems={totalItems}
          lang={lang}
          onBack={() => setScreen('catalog')}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {screen === 'success' && (
        <Success lang={lang} onNewOrder={handleNewOrder} />
      )}
    </div>
  )
}

export default App
