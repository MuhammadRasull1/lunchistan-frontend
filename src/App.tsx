import { useEffect, useState } from 'react'
import './App.css'
import type { Lang } from './types'
import AuthScreen from './components/AuthScreen'
import EmployeeView from './components/EmployeeView'
import ManagerView from './components/ManagerView'
import { getToken, setToken, fetchMe } from './lib/api'
import type { AuthResponse, AuthUser } from './lib/api'

const LANG_STORAGE_KEY = 'lunchistan_lang'

function loadInitialLang(): Lang {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY)
    return raw === 'uz' ? 'uz' : 'ru'
  } catch {
    return 'ru'
  }
}

function App() {
  const [lang, setLang] = useState<Lang>(loadInitialLang)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [employeesCount, setEmployeesCount] = useState(0)
  const [booted, setBooted] = useState(false)

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang)
    } catch {
      // ignore
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
  }

  const handleAuth = (result: AuthResponse) => {
    setToken(result.token)
    setUser(result.user)
    if (result.user.role === 'admin') {
      fetchMe()
        .then(data => setEmployeesCount(data.employeesCount))
        .catch(() => {})
    }
  }

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (!getToken()) {
        setBooted(true)
        return
      }
      try {
        const data = await fetchMe()
        if (!cancelled) {
          setUser(data.user)
          setEmployeesCount(data.employeesCount)
        }
      } catch {
        setToken(null)
      } finally {
        if (!cancelled) setBooted(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  if (!booted) {
    return <div className="app view__boot">…</div>
  }

  if (!user) {
    return <AuthScreen lang={lang} onAuth={handleAuth} />
  }

  if (user.role === 'admin') {
    return (
      <ManagerView
        lang={lang}
        userName={user.name}
        companyName={user.companyName}
        employeesCount={employeesCount}
        onLogout={handleLogout}
        onLangChange={handleLangChange}
      />
    )
  }

  return (
    <EmployeeView
      lang={lang}
      userName={user.name}
      companyName={user.companyName}
      onLogout={handleLogout}
      onLangChange={handleLangChange}
    />
  )
}

export default App