import { useTranslation } from 'react-i18next'
import type { Lang, PolityProperties } from '../types'
import './Legend.css'

interface LegendProps {
  polities: PolityProperties[]
}

export function Legend({ polities }: LegendProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang

  return (
    <aside className="legend" aria-label={t('legendTitle')}>
      <h2 className="legend-title">{t('legendTitle')}</h2>
      {polities.length === 0 ? (
        <p className="legend-empty">{t('noPolities')}</p>
      ) : (
        <ul className="legend-list">
          {polities.map((p) => (
            <li key={p.polityId} className="legend-item">
              <span
                className="legend-swatch"
                style={{ backgroundColor: p.color }}
                aria-hidden
              />
              <span>{p.name[lang] ?? p.name.en}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="legend-note">{t('approxNote')}</p>
    </aside>
  )
}
