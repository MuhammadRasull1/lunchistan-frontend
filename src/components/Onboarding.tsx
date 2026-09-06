import { useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { UtensilsCrossed, Check, KeyRound, UserRound } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { login, registerTeam, joinTeam, apiErrorMessage } from '../lib/api'
import type { AuthResponse } from '../lib/api'
import { isValidName } from '../lib/nameValidator'

interface OnboardingProps {
  lang: Lang
  onAuth: (result: AuthResponse) => void
}

type Phase = 'welcome' | 'name' | 'password' | 'path'
type PathMode = 'login' | 'create' | 'join'

const phaseVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: 'easeIn' } },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.35, delayChildren: 0.15 } },
}

const slowWord: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function SlowText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <motion.p
      className="ob-slow-text"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.14, delayChildren: delay } },
      }}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span key={i} className="ob-slow-word" variants={slowWord}>
          {word}
          {'\u00A0'}
        </motion.span>
      ))}
    </motion.p>
  )
}

export default function Onboarding({ lang, onAuth }: OnboardingProps) {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [mode, setMode] = useState<PathMode | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const nextRef = useRef<HTMLInputElement>(null)

  const nameValid = isValidName(name)
  const passwordValid = password.length >= 4
  const trimmedCode = companyCode.trim()

  const submit = async () => {
    if (busy) return
    if (mode === 'create' && !companyName.trim()) {
      setError(t(lang, 'obFieldError'))
      return
    }
    if (mode === 'join' && !trimmedCode) {
      setError(t(lang, 'obFieldError'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      let result: AuthResponse
      if (mode === 'login') {
        result = await login({ name: name.trim(), password })
      } else if (mode === 'create') {
        result = await registerTeam({
          name: name.trim(),
          password,
          companyName: companyName.trim(),
        })
      } else {
        result = await joinTeam({
          name: name.trim(),
          password,
          companyCode: trimmedCode,
        })
      }
      onAuth(result)
    } catch (err) {
      setError(apiErrorMessage(err) ?? t(lang, 'authError'))
    } finally {
      setBusy(false)
    }
  }

  const goName = () => {
    setTouched(true)
    if (!nameValid) return
    setError(null)
    setPhase('password')
    setTimeout(() => nextRef.current?.focus(), 350)
  }

  const goPassword = () => {
    if (!passwordValid) {
      setError(t(lang, 'obPasswordError'))
      return
    }
    setError(null)
    setPhase('path')
  }

  return (
    <div className="auth-screen auth-screen--section ob-screen">
      <div className="auth-card ob-card">
        <AnimatePresence mode="wait">
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              className="ob-phase"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="ob-logo-wrap"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.span className="auth-card__logo" variants={slowWord}>
                  <UtensilsCrossed size={30} strokeWidth={2} />
                </motion.span>
                <motion.h1 className="ob-title" variants={slowWord}>
                  {t(lang, 'obWelcomeTitle')}
                </motion.h1>
                <motion.p className="ob-overline" variants={slowWord}>
                  {t(lang, 'obWelcomeOverline')}
                </motion.p>
              </motion.div>

              <SlowText text={t(lang, 'obWelcomeP1')} delay={0.9} />
              <SlowText text={t(lang, 'obWelcomeP2')} delay={1.7} />

              <motion.div
                className="ob-start-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 0.45, ease: 'easeOut' }}
              >
                <button
                  className="btn btn--primary btn--lg"
                  type="button"
                  onClick={() => setPhase('name')}
                >
                  {t(lang, 'obStart')}
                </button>
              </motion.div>
            </motion.div>
          )}

          {phase === 'name' && (
            <motion.div
              key="name"
              className="ob-phase"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span className="ob-step">{t(lang, 'obStepName')}</span>
              <h2 className="ob-h2">{t(lang, 'obNameTitle')}</h2>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  goName()
                }}
              >
                <div className="ob-field">
                  <div className="ob-field__row">
                    <UserRound size={18} strokeWidth={2} />
                    <input
                      ref={nextRef}
                      value={name}
                      onChange={e => {
                        setName(e.target.value)
                        setTouched(false)
                        setError(null)
                      }}
                      placeholder="Иван"
                      autoFocus
                      autoComplete="name"
                      maxLength={50}
                    />
                    {nameValid && <Check className="ob-field__ok" size={18} strokeWidth={2.5} />}
                  </div>
                  <p className="ob-hint">{t(lang, 'obNameHint')}</p>
                  {touched && !nameValid && <div className="auth-error">{t(lang, 'obNameError')}</div>}
                </div>

                <button className="btn btn--primary btn--lg ob-next" type="submit">
                  {t(lang, 'obNext')}
                </button>
              </form>
            </motion.div>
          )}

          {phase === 'password' && (
            <motion.div
              key="password"
              className="ob-phase"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span className="ob-step">{t(lang, 'obStepPassword')}</span>
              <h2 className="ob-h2">{t(lang, 'obPasswordTitle')}</h2>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  goPassword()
                }}
              >
                <div className="ob-field">
                  <div className="ob-field__row">
                    <KeyRound size={18} strokeWidth={2} />
                    <input
                      ref={nextRef}
                      type="password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="••••"
                      autoFocus
                      autoComplete="new-password"
                    />
                    {passwordValid && <Check className="ob-field__ok" size={18} strokeWidth={2.5} />}
                  </div>
                  <p className="ob-hint">{t(lang, 'obPasswordHint')}</p>
                </div>

                <button className="btn btn--primary btn--lg ob-next" type="submit">
                  {t(lang, 'obNext')}
                </button>
              </form>

              <button className="ob-back" type="button" onClick={() => setPhase('name')}>
                {t(lang, 'obBack')}
              </button>
            </motion.div>
          )}

          {phase === 'path' && (
            <motion.div
              key="path"
              className="ob-phase"
              variants={phaseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span className="ob-step">{t(lang, 'obPathOverline')}</span>
              <h2 className="ob-h2 ob-h2--center">{t(lang, 'obPathTitle')}</h2>
              <p className="ob-sub">{t(lang, 'obPathSubtitle')}</p>

              <div className="ob-paths">
                <button className={`ob-path ${mode === 'login' ? 'ob-path--active' : ''}`} type="button" onClick={() => { setMode('login'); setError(null) }}>
                  <span className="ob-path__emoji">👋</span>
                  {t(lang, 'obPathLogin')}
                </button>
                <button className={`ob-path ${mode === 'create' ? 'ob-path--active' : ''}`} type="button" onClick={() => { setMode('create'); setError(null) }}>
                  <span className="ob-path__emoji">🏢</span>
                  {t(lang, 'obPathCreate')}
                </button>
                <button className={`ob-path ${mode === 'join' ? 'ob-path--active' : ''}`} type="button" onClick={() => { setMode('join'); setError(null) }}>
                  <span className="ob-path__emoji">🔑</span>
                  {t(lang, 'obPathJoin')}
                </button>
              </div>

              {mode && (
                <form className="ob-submit-area" onSubmit={e => { e.preventDefault(); submit() }}>
                  {mode === 'create' && (
                    <div className="ob-field">
                      <div className="ob-field__row">
                        <input
                          value={companyName}
                          onChange={e => { setCompanyName(e.target.value); setError(null) }}
                          placeholder={t(lang, 'obCompanyNameLabel')}
                          autoFocus
                          autoComplete="organization"
                          maxLength={80}
                        />
                      </div>
                    </div>
                  )}
                  {mode === 'join' && (
                    <div className="ob-field">
                      <div className="ob-field__row">
                        <input
                          value={companyCode}
                          onChange={e => { setCompanyCode(e.target.value); setError(null) }}
                          placeholder={t(lang, 'obCompanyCodePlaceholder')}
                          autoFocus
                          autoComplete="off"
                          maxLength={10}
                        />
                      </div>
                      <p className="ob-hint">{t(lang, 'obCompanyCodeHint')}</p>
                    </div>
                  )}

                  {error && <div className="auth-error">{error}</div>}

                  <button className="btn btn--primary btn--lg ob-next" type="submit" disabled={busy}>
                    {busy && <span className="btn__spinner" />}
                    {mode === 'login'
                      ? t(lang, 'obSubmitLogin')
                      : mode === 'create'
                        ? t(lang, 'obSubmitCreate')
                        : t(lang, 'obSubmitJoin')}
                  </button>
                </form>
              )}

              <button className="ob-back" type="button" onClick={() => setPhase('password')}>
                {t(lang, 'obBack')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}