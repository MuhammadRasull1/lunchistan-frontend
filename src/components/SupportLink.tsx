import { LifeBuoy } from 'lucide-react'
import type { Lang } from '../types'
import { t } from '../locales/translations'
import { openTelegramLink, hapticImpact } from '../lib/telegram'

// Контакт техподдержки Lunchistan (Telegram).
// Основная ссылка — по username (открывается у любого клиента).
// Numeric id — запасной ориентир: tg://-ссылка срабатывает только внутри
// Telegram и лишь если пользователь уже в контактах, поэтому это fallback href.
const SUPPORT_USERNAME = 'burn1ng_sky'
const SUPPORT_TG_ID = '6635199967'

interface SupportLinkProps {
  lang: Lang
}

export default function SupportLink({ lang }: SupportLinkProps) {
  const open = () => {
    hapticImpact('light')
    openTelegramLink(`https://t.me/${SUPPORT_USERNAME}`)
  }

  return (
    <section className="support-note">
      <div className="support-note__text">
        <span className="support-note__title">{t(lang, 'supportTitle')}</span>
        <span className="support-note__desc">{t(lang, 'supportDesc')}</span>
      </div>
      <a
        className="btn btn--outline support-note__btn"
        href={`tg://user?id=${SUPPORT_TG_ID}`}
        onClick={e => {
          e.preventDefault()
          open()
        }}
      >
        <LifeBuoy size={15} /> {t(lang, 'supportButton')}
      </a>
    </section>
  )
}
