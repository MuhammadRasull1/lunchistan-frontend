import { useCallback, useEffect, useState } from 'react'
import { LogOut, CalendarDays, UtensilsCrossed, Lock } from 'lucide-react'
import type { Lang } from '../types'
import { t, WEEKDAYS_SHORT } from '../locales/translations'
import { fetchMyDays, putMyDays, putMyChoice } from '../lib/api'
import type { MyDay } from '../lib/api'
import CalendarModal from './CalendarModal'
import SetPicker from './SetPicker'
import { addMonths, startOfMonth } from '../lib/calendar'

interface EmployeeViewProps {
  lang: Lang
  userName: string
  companyName: string
  onLogout: () => void
  onLangChange: (lang: Lang) => void
}

function dayLabel(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = WEEKDAYS_SHORT[lang][new Date(y, m - 1, d).getDay()]
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')} · ${wd}`
}

export default function EmployeeView({ lang, userName, companyName, onLogout, onLangChange }: EmployeeViewProps) {
  const [days, setDays] = useState<MyDay[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [pickFor, setPickFor] = useState<MyDay | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [minMonth] = useState(() => startOfMonth(new Date()))
  const maxMonth = addMonths(minMonth, 1)

  const reload = useCallback(async () => {
    try {
      const data = await fetchMyDays()
      setDays(data)
      setError(null)
    } catch {
      setError(t(lang, 'authError'))
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => {
    let cancelled = false
    fetchMyDays()
      .then(data => {
        if (!cancelled) {
          setDays(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError(t(lang, 'authError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  const applySchedule = async (dates: string[]) => {
    if (pickFor) return
    try {
      await putMyDays(dates)
      await reload()
    } catch {
      setError(t(lang, 'authError'))
    } finally {
      setCalendarOpen(false)
    }
  }

  const pickSet = async (setId: number) => {
    if (!pickFor) return
    try {
      await putMyChoice(pickFor.date, setId)
      await reload()
    } catch {
      setError(t(lang, 'authError'))
    } finally {
      setPickFor(null)
    }
  }

  const chosenCount = days.filter(d => d.choice).length

  return (
    <div className="app">
      <header className="view__header">
        <div className="brand">
          <span className="brand__logo"><UtensilsCrossed size={20} /></span>
          <span>Lunch<span className="brand__accent">istan</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="lang-switcher">
            <button
              className={`lang-btn${lang === 'ru' ? ' lang-btn--active' : ''}`}
              onClick={() => onLangChange('ru')}
            >
              {t(lang, 'langRu')}
            </button>
            <button
              className={`lang-btn${lang === 'uz' ? ' lang-btn--active' : ''}`}
              onClick={() => onLangChange('uz')}
            >
              {t(lang, 'langUz')}
            </button>
          </div>
          <button className="btn btn--outline" onClick={onLogout}>
            <LogOut size={16} /> {t(lang, 'logout')}
          </button>
        </div>
      </header>

      <main className="view__body">
        <div className="catalog__heading" style={{ marginTop: 28 }}>{userName}</div>
        <p className="catalog__subtitle">{companyName}</p>

        <div className="view__section-head">
          <h2 className="view__section-title">{t(lang, 'myDays')}</h2>
          <button className="btn btn--primary" onClick={() => setCalendarOpen(true)}>
            <CalendarDays size={16} /> {t(lang, 'chooseDates')}
          </button>
        </div>
        <p className="view__section-desc">
          {t(lang, 'myDaysSubtitle')} · {days.length} {t(lang, 'scheduled').toLowerCase()} · {chosenCount}{' '}
          {t(lang, 'chosenSets').toLowerCase()}
        </p>
        <p className="view__section-desc view__section-desc--muted">{t(lang, 'editingDisabledHint')}</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="days-list">
          {days.length === 0 && !loading && <p className="view__section-desc">{t(lang, 'myDaysEmpty')}</p>}
          {days.map(day => {
            const isLocked = day.locked
            return (
              <div key={day.date} className={`day-row${isLocked ? ' day-row--locked' : ''}`}>
                <div className="day-row__date">{dayLabel(day.date, lang)}</div>
                <div className="day-row__dish">
                  {day.choice ? (
                    <>
                      <span className="day-row__name">{day.choice.setName}</span>
                      <span className="day-row__hint">
                        {day.choice.setPrice.toLocaleString('ru-RU')} {lang === 'uz' ? "so'm" : 'сум'}
                      </span>
                    </>
                  ) : (
                    <span className="day-row__hint">{t(lang, 'defaultSetNote', { name: day.defaultSet.setName })}</span>
                  )}
                  {isLocked && (
                    <span className="day-row__lock">
                      <Lock size={13} /> {t(lang, 'dayLockedBadge')}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn--outline day-row__pick"
                  disabled={isLocked}
                  onClick={() => setPickFor(day)}
                >
                  {day.choice ? t(lang, 'changeSet') : t(lang, 'chooseSet')}
                </button>
              </div>
            )
          })}
        </div>
      </main>

      <CalendarModal
        isOpen={calendarOpen}
        initialSelectedDates={days.map(d => d.date)}
        minMonth={minMonth}
        maxMonth={maxMonth}
        lang={lang}
        onConfirm={applySchedule}
        onClose={() => setCalendarOpen(false)}
      />

      <SetPicker
        isOpen={pickFor !== null}
        lang={lang}
        current={pickFor?.choice ?? null}
        onPick={pickSet}
        onClose={() => setPickFor(null)}
      />
    </div>
  )
}