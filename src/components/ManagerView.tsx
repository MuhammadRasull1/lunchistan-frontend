import { useEffect, useState } from 'react'
import { LogOut, ClipboardCheck, CheckCircle2, Lock } from 'lucide-react'
import type { Lang } from '../types'
import { t, WEEKDAYS_SHORT } from '../locales/translations'
import { fetchManagerDates, fetchDayReport, confirmDay } from '../lib/api'
import type { DayReport, ManagerDate } from '../lib/api'

interface ManagerViewProps {
  lang: Lang
  userName: string
  companyName: string
  employeesCount: number
  onLogout: () => void
  onLangChange: (lang: Lang) => void
}

function dayLabel(date: string, lang: Lang): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = WEEKDAYS_SHORT[lang][new Date(y, m - 1, d).getDay()]
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')} · ${wd}`
}

export default function ManagerView({ lang, userName, companyName, employeesCount, onLogout, onLangChange }: ManagerViewProps) {
  const [dates, setDates] = useState<ManagerDate[]>([])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [report, setReport] = useState<DayReport | null>(null)
  const [loadingDates, setLoadingDates] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchManagerDates()
      .then(data => {
        if (cancelled) return
        setDates(data)
        setActiveDate(prev => prev ?? data.find(d => !d.locked)?.date ?? data[0]?.date ?? null)
      })
      .finally(() => {
        if (!cancelled) setLoadingDates(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeDate) return
    let cancelled = false
    fetchDayReport(activeDate)
      .then(data => {
        if (!cancelled) setReport(data)
      })
      .catch(() => {
        if (!cancelled) setReport(null)
      })
    return () => {
      cancelled = true
    }
  }, [activeDate])

  const onConfirm = async () => {
    if (!activeDate || confirming) return
    setConfirming(true)
    setMessage(null)
    try {
      const plan = await confirmDay(activeDate)
      setReport(plan)
      const refreshed = await fetchManagerDates()
      setDates(refreshed)
      setMessage(t(lang, 'confirmSuccess'))
    } catch {
      setMessage(t(lang, 'authError'))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="app">
      <header className="view__header">
        <div className="brand">
          <span className="brand__logo"><ClipboardCheck size={20} /></span>
          <span>Lunch<span className="brand__accent">istan</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="lang-switcher">
            <button className={`lang-btn${lang === 'ru' ? ' lang-btn--active' : ''}`} onClick={() => onLangChange('ru')}>
              {t(lang, 'langRu')}
            </button>
            <button className={`lang-btn${lang === 'uz' ? ' lang-btn--active' : ''}`} onClick={() => onLangChange('uz')}>
              {t(lang, 'langUz')}
            </button>
          </div>
          <button className="btn btn--outline" onClick={onLogout}>
            <LogOut size={16} /> {t(lang, 'logout')}
          </button>
        </div>
      </header>

      <main className="view__body">
        <div className="catalog__heading" style={{ marginTop: 28 }}>{t(lang, 'managerTitle')}</div>
        <p className="catalog__subtitle">
          {userName} · {companyName} · {t(lang, 'totalEmployees')}: {employeesCount}
        </p>

        <div className="manager-dates">
          {loadingDates && <p className="view__section-desc">…</p>}
          {!loadingDates && dates.length === 0 && <p className="view__section-desc">{t(lang, 'reportEmpty')}</p>}
          {dates.map(d => (
            <button
              key={d.date}
              className={`manager-dates__chip${activeDate === d.date ? ' manager-dates__chip--active' : ''}${d.confirmed ? ' manager-dates__chip--done' : ''}`}
              onClick={() => {
              setReport(null)
              setActiveDate(d.date)
            }}
            >
              {dayLabel(d.date, lang)}
              <span className="manager-dates__meta">
                {d.confirmed ? <CheckCircle2 size={12} /> : d.locked ? <Lock size={12} /> : `${d.scheduled}`}
              </span>
            </button>
          ))}
        </div>

        {report && (
          <div className="manager-report">
            <div className="manager-report__head">
              <h2 className="view__section-title">
                {dayLabel(report.date, lang)}
              </h2>
              <div className="manager-report__stats">
                <span className="stat-tile">
                  <b>{report.scheduled}</b>
                  {t(lang, 'scheduled').toLowerCase()}
                </span>
                <span className="stat-tile">
                  <b>{report.unpicked}</b>
                  {t(lang, 'waiting').toLowerCase()}
                </span>
                <span className="stat-tile stat-tile--sum">
                  <b>{report.totalSum.toLocaleString('ru-RU')}</b>
                  {t(lang, 'totalSum').toLowerCase()}
                </span>
              </div>
            </div>

            {report.perSet.length === 0 && <p className="view__section-desc">{t(lang, 'reportEmpty')}</p>}
            <div className="report-lines">
              {report.perSet.map(s => (
                <div key={s.setId} className="report-line">
                  <div className="report-line__info">
                    <span className="report-line__name">{s.setName}</span>
                    <span className="report-line__meta">
                      {s.setPrice.toLocaleString('ru-RU')} {lang === 'uz' ? "so'm" : 'сум'}
                      {s.defaults > 0 && ` · ${t(lang, 'waiting').toLowerCase()}: ${s.defaults}`}
                    </span>
                  </div>
                  <div className="report-line__count">{s.count} ×</div>
                </div>
              ))}
            </div>

            {message && <div className="auth-error auth-error--ok">{message}</div>}

            <div className="manager-report__actions">
              {report.confirmed ? (
                <div className="manager-report__confirmed">
                  <CheckCircle2 size={18} /> {t(lang, 'dayConfirmed')}
                </div>
              ) : (
                <button
                  className="btn btn--primary btn--lg"
                  onClick={onConfirm}
                  disabled={confirming || report.scheduled === 0}
                >
                  {confirming && <span className="btn__spinner" />}
                  {t(lang, 'confirmDay')}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}