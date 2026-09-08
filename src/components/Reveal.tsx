import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  /** Задержка появления, сек (для каскада/стаггера списков) */
  delay?: number
  /** Стартовое смещение по Y, px */
  y?: number
  className?: string
  /** Перерисовывать при каждом изменении children (иначе — только первое появление) */
  once?: boolean
}

/** Плавное появление блока: fade + подъём снизу. */
export default function Reveal({ children, delay = 0, y = 18, className, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={once ? { opacity: 1, y: 0 } : undefined}
      whileInView={once ? undefined : { opacity: 1, y: 0 }}
      viewport={once ? undefined : { once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}