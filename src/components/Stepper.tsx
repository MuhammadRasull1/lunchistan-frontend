import { useState } from 'react'
import { motion } from 'framer-motion'

interface StepperProps {
  value: number
  min: number
  max?: number
  onSet: (value: number) => void
  ariaDecrease?: string
  ariaIncrease?: string
}

/**
 * Счётчик с ручным вводом: кнопки «−» / «+» по бокам + кликабельный input type="number".
 * При клике на число пользователь может сразу вписать нужное значение с клавиатуры.
 */
function Stepper({ value, min, max, onSet, ariaDecrease, ariaIncrease }: StepperProps) {
  const [draft, setDraft] = useState<string>(String(value))
  const [prevValue, setPrevValue] = useState(value)
  const [focused, setFocused] = useState(false)

  const clamp = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n))

  // Синхронизация draft при изменении value извне (кнопки, сброс) — только когда поле не в фокусе
  if (value !== prevValue && !focused) {
    setPrevValue(value)
    setDraft(String(value))
  }

  const commit = () => {
    const parsed = parseInt(draft, 10)
    if (Number.isNaN(parsed)) {
      setDraft(String(value))
      return
    }
    const clamped = clamp(parsed)
    setDraft(String(clamped))
    onSet(clamped)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setDraft(raw)
    const parsed = parseInt(raw, 10)
    if (!Number.isNaN(parsed)) {
      onSet(clamp(parsed))
    }
  }

  const changeBy = (delta: number) => {
    const next = clamp(value + delta)
    setDraft(String(next))
    onSet(next)
  }

  const minusDisabled = value <= min
  const plusDisabled = max !== undefined && value >= max

  return (
    <div className="counter">
      <motion.button
        type="button"
        className="counter__btn"
        aria-label={ariaDecrease}
        disabled={minusDisabled}
        onClick={() => changeBy(-1)}
        whileTap={{ scale: 0.88 }}
      >
        −
      </motion.button>
      <input
        className="counter__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={handleInputChange}
        onFocus={(e) => {
          setFocused(true)
          e.target.select()
        }}
        onBlur={() => {
          setFocused(false)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      <motion.button
        type="button"
        className="counter__btn counter__btn--add"
        aria-label={ariaIncrease}
        disabled={plusDisabled}
        onClick={() => changeBy(1)}
        whileTap={{ scale: 0.88 }}
      >
        +
      </motion.button>
    </div>
  )
}

export default Stepper
