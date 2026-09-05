import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, Building2, Users } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { register, login } from '../lib/api'
import type { AuthResponse } from '../lib/api'

interface AuthScreenProps {
  lang: Lang
  onAuth: (result: AuthResponse) => void
}

export default function AuthScreen({ lang, onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showCompanyCode, setShowCompanyCode] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const result = await login(phone.trim(), password)
        onAuth(result)
      } else {
        const result = await register({
          name: name.trim(),
          phone: phone.trim(),
          password,
          companyName: showCompanyCode ? undefined : companyName.trim(),
          companyCode: showCompanyCode ? companyCode.trim() : undefined,
        })
        onAuth(result)
      }
    } catch {
      setError(t(lang, 'authError'))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setShowCompanyCode(false)
    setError(null)
  }

  return (
    <div className="auth-screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="auth-card"
      >
        <div className="auth-card__head">
          <div className="brand">
            <span className="brand__logo"><Building2 size={20} /></span>
            <span>Lunch<span className="brand__accent">istan</span></span>
          </div>
          <h1 className="auth-card__title">{t(lang, 'authTitle')}</h1>
          <p className="auth-card__subtitle">{t(lang, 'authSubtitle')}</p>
        </div>

        {mode === 'register' && (
          <label className="auth-field">
            <span className="auth-field__label">{t(lang, 'name')}</span>
            <input
              className="auth-field__input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Алишер"
              autoComplete="name"
            />
          </label>
        )}

        <label className="auth-field">
          <span className="auth-field__label">{t(lang, 'phone')}</span>
          <input
            className="auth-field__input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>

        <label className="auth-field">
          <span className="auth-field__label">{t(lang, 'password')}</span>
          <input
            className="auth-field__input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {mode === 'register' && !showCompanyCode && (
          <label className="auth-field">
            <span className="auth-field__label">{t(lang, 'companyName')}</span>
            <input
              className="auth-field__input"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Tech Corp"
            />
          </label>
        )}

        {mode === 'register' && showCompanyCode && (
          <label className="auth-field">
            <span className="auth-field__label">{t(lang, 'companyCode')}</span>
            <input
              className="auth-field__input"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              placeholder={t(lang, 'companyCodePlaceholder')}
              maxLength={6}
            />
            <span className="auth-field__hint">{t(lang, 'registerEmployeeHint')}</span>
          </label>
        )}

        {mode === 'register' && !showCompanyCode && (
          <button type="button" className="auth-switch-link" onClick={() => setShowCompanyCode(true)}>
            <Users size={15} /> {t(lang, 'companyCodeLabel')}
          </button>
        )}
        {mode === 'register' && showCompanyCode && (
          <button type="button" className="auth-switch-link" onClick={() => setShowCompanyCode(false)}>
            <Building2 size={15} /> {t(lang, 'createCompany')}
          </button>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn--primary btn--lg" onClick={submit} disabled={busy}>
          {busy ? <span className="btn__spinner" /> : mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {mode === 'login' ? t(lang, 'loginLabel') : t(lang, 'registerLabel')}
        </button>

        <button type="button" className="auth-switch-link auth-switch-link--center" onClick={switchMode}>
          {mode === 'login' ? t(lang, 'switchToRegister') : t(lang, 'switchToLogin')}
        </button>

        {mode === 'register' && !showCompanyCode && (
          <p className="auth-note">{t(lang, 'createCompanyHint')}</p>
        )}
      </motion.div>
    </div>
  )
}