import { useTranslation } from 'react-i18next'
import type { Lang } from '../types'
import './LanguageSwitcher.css'

const LANGS: { code: Lang; labelKey: string }[] = [
  { code: 'en', labelKey: 'langEn' },
  { code: 'de', labelKey: 'langDe' },
  { code: 'zh', labelKey: 'langZh' },
]

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = (i18n.language?.slice(0, 2) || 'en') as Lang

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {LANGS.map(({ code, labelKey }) => (
        <button
          key={code}
          type="button"
          className={current === code ? 'lang-btn active' : 'lang-btn'}
          onClick={() => void i18n.changeLanguage(code)}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
