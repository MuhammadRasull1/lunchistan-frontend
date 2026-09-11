import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { hapticImpact } from '../lib/telegram'
import type { SaladOption } from './saladOptions'

interface SaladPickerModalProps {
  isOpen: boolean
  onClose: () => void
  lang: Lang
  salad: string
  onSelect: (salad: string) => void
  /** Салаты текущего меню (с бэкенда) — раньше бралось из статичной константы SALAD_OPTIONS */
  saladOptions: SaladOption[]
}

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 },
  },
  exit: {
    y: '100%',
    transition: { type: 'spring' as const, stiffness: 300, damping: 32, mass: 1 },
  },
}

function SaladPickerModal({ isOpen, onClose, lang, salad, onSelect, saladOptions }: SaladPickerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay modal-overlay--nested"
            key="salad-modal-overlay"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            className="modal-sheet modal-sheet--nested"
            key="salad-modal-sheet"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose()
              }
            }}
          >
            <div className="modal-sheet__handle" />

            <button
              type="button"
              className="modal-sheet__close"
              onClick={onClose}
              aria-label={t(lang, 'close')}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="modal-sheet__scroll">
              <div className="modal-sheet__header">
                <h2 className="modal-sheet__title">{t(lang, 'saladModalTitle')}</h2>
              </div>

              <div className="salad-modal__grid">
                {saladOptions.map(opt => {
                  const active = salad === opt.value
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      className={`salad-modal__slot${active ? ' salad-modal__slot--active' : ''}`}
                      onClick={() => {
                        hapticImpact('light')
                        onSelect(opt.value)
                      }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.15 }}
                    >
                      <img
                        className="salad-modal__slot-img"
                        src={opt.imageUrl}
                        alt={opt.value}
                        loading="lazy"
                      />
                      <span>{opt.value}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SaladPickerModal
