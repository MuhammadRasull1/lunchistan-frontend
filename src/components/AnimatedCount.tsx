import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface AnimatedCountProps {
  value: number
  format?: (n: number) => string
  className?: string
  suffix?: string
}

function AnimatedCount({ value, format, className, suffix = '' }: AnimatedCountProps) {
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, {
    stiffness: 120,
    damping: 24,
    mass: 0.8,
  })
  const rounded = useTransform(spring, (v) => Math.round(v))

  // Устанавливаем новое значение — spring плавно доанимирует до него
  motionValue.set(value)

  const displayValue = useTransform(rounded, (v) => {
    return format ? format(v) : `${v}${suffix}`
  })

  // Используем motion.span, чтобы корректно отображать MotionValue как children
  return <motion.span className={className}>{displayValue}</motion.span>
}

export default AnimatedCount
