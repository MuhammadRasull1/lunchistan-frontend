import { Store, Users } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'

export type AppTab = 'catalog' | 'teams'

interface AppHeaderProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  lang: Lang
  onLangChange: (lang: Lang) => void
}

export default function AppHeader({ activeTab, onTabChange, lang, onLangChange }: AppHeaderProps) {
  return (
    <div className="catalog__header-top app-header">
      <div className="brand">
        <span className="brand__logo">
          {activeTab === 'teams' ? <Users size={22} strokeWidth={2.2} /> : <Store size={22} strokeWidth={2.2} />}
        </span>
        <span>
          Lunch<span className="brand__accent">istan</span>
        </span>
      </div>

      <nav className="app-tabs">
        <button
          type="button"
          className={`app-tabs__tab${activeTab === 'catalog' ? ' app-tabs__tab--active' : ''}`}
          onClick={() => onTabChange('catalog')}
        >
          {t(lang, 'tabCatalog')}
        </button>
        <button
          type="button"
          className={`app-tabs__tab${activeTab === 'teams' ? ' app-tabs__tab--active' : ''}`}
          onClick={() => onTabChange('teams')}
        >
          {t(lang, 'tabTeams')}
        </button>
      </nav>

      <div className="lang-switcher">
        <button
          type="button"
          className={`lang-btn${lang === 'ru' ? ' lang-btn--active' : ''}`}
          onClick={() => onLangChange('ru')}
          aria-label="Русский"
        >
          RU
        </button>
        <span className="lang-switcher__sep">|</span>
        <button
          type="button"
          className={`lang-btn${lang === 'uz' ? ' lang-btn--active' : ''}`}
          onClick={() => onLangChange('uz')}
          aria-label="O'zbek"
        >
          UZ
        </button>
      </div>
    </div>
  )
}