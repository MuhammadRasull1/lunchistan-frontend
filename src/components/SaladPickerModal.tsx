import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock } from 'lucide-react'
import type { Salad, Lang } from '../types'
import { t } from '../locales/translations'
import { hapticImpact } from '../lib/telegram'
import { SALAD_OPTIONS } from './saladOptions'

interface SaladPickerModalProps {
  isOpen: boolean
  onClose: () => void
  lang: Lang
  salad: Salad
  onSelect: (salad: Salad) => void
}

const LOCKED_SLOT_COUNT = 12

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

function SaladPickerModal({ isOpen, onClose, lang, salad, onSelect }: SaladPickerModalProps) {
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
                {SALAD_OPTIONS.map(opt => {
                  const active = salad === opt.value
                  const OptIcon = opt.icon
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
                      <OptIcon size={22} strokeWidth={active ? 2.6 : 2.2} />
                      <span>{opt.value}</span>
                    </motion.button>
                  )
                })}

                {Array.from({ length: LOCKED_SLOT_COUNT }).map((_, i) => (
                  <div
                    key={`locked-${i}`}
                    className="salad-modal__slot salad-modal__slot--locked"
                    aria-disabled="true"
                  >
                    <Lock size={18} strokeWidth={2.2} />
                    <span>{t(lang, 'comingSoon')}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SaladPickerModal
