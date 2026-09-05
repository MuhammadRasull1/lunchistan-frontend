import { useState } from 'react'
import { Users } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { login, registerTeam, joinTeam, apiErrorMessage } from '../lib/api'
import type { AuthResponse } from '../lib/api'

interface TeamsAuthProps {
  lang: Lang
  onAuth: (result: AuthResponse) => void
}

type Mode = 'login' | 'create' | 'join'

export default function TeamsAuth({ lang, onAuth }: TeamsAuthProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (busy) return
    if (!phone.trim() || !password.trim()) {
      setError(t(lang, 'authError'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      let result: AuthResponse
      if (mode === 'login') {
        result = await login({ phone: phone.trim(), password })
      } else if (mode === 'create') {
        if (!companyName.trim()) {
          setError(t(lang, 'authError'))
          return
        }
        const size = Number(companySize)
        result = await registerTeam({
          name: name.trim(),
          phone: phone.trim(),
          password,
          companyName: companyName.trim(),
          companySize: Number.isInteger(size) && size > 0 ? size : undefined,
        })
      } else {
        if (!companyCode.trim() || !name.trim()) {
          setError(t(lang, 'authError'))
          return
        }
        result = await joinTeam({
          name: name.trim(),
          phone: phone.trim(),
          password,
          companyCode: companyCode.trim(),
        })
      }
      onAuth(result)
    } catch (err) {
      setError(apiErrorMessage(err) ?? t(lang, 'authError'))
    } finally {
      setBusy(false)
    }
  }

  const isCreate = mode === 'create'

  return (
    <div className="auth-screen auth-screen--section">
      <form
        className="auth-card"
        onSubmit={e => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="auth-card__head">
          <span className="auth-card__logo"><Users size={26} strokeWidth={2.2} /></span>
          <h2 className="auth-card__title">{mode === 'login' ? t(lang, 'authTitle') : t(lang, 'registerTitle')}</h2>
          <p className="auth-card__subtitle">{t(lang, 'authSubtitle')}</p>
        </div>

        {mode !== 'login' && (
          <div className="auth-field">
            <label>{t(lang, 'name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          </div>
        )}

        <div className="auth-field">
          <label>{t(lang, 'phone')}</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
        </div>

        <div className="auth-field">
          <label>{t(lang, 'password')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {mode === 'create' && (
          <>
            <div className="auth-field">
              <label>{t(lang, 'teamName')}</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} autoComplete="organization" />
            </div>
            <div className="auth-field">
              <label>{t(lang, 'teamSize')}</label>
              <input
                value={companySize}
                onChange={e => setCompanySize(e.target.value)}
                inputMode="numeric"
                placeholder={t(lang, 'teamSizePlaceholder')}
              />
              <span className="auth-hint">{t(lang, 'teamSizeHint')}</span>
            </div>
          </>
        )}

        {mode === 'join' && (
          <div className="auth-field">
            <label>{t(lang, 'companyCode')}</label>
            <input value={companyCode} onChange={e => setCompanyCode(e.target.value)} placeholder={t(lang, 'companyCodePlaceholder')} />
            <span className="auth-hint">{t(lang, 'registerEmployeeHint')}</span>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button className="btn btn--primary btn--lg" type="submit" disabled={busy}>
          {busy && <span className="btn__spinner" />}
          {mode === 'login' ? t(lang, 'loginLabel') : isCreate ? t(lang, 'createTeam') : t(lang, 'joinTeam')}
        </button>

        <div className="auth-switch">
          {mode === 'login' && (
            <button type="button" className="auth-toggle" onClick={() => setMode('create')}>
              {t(lang, 'createTeamLink')}
            </button>
          )}
          {mode === 'login' && (
            <button type="button" className="auth-toggle auth-toggle--link" onClick={() => setMode('join')}>
              {t(lang, 'joinTeamLink')}
            </button>
          )}
          {mode !== 'login' && (
            <button type="button" className="auth-toggle" onClick={() => setMode('login')}>
              {t(lang, 'switchToLogin')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}