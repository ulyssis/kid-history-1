import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang, PolityProperties } from '../types'
import './Legend.css'

interface LegendProps {
  polities: PolityProperties[]
  highlightedPolityId?: string | null
}

export function Legend({ polities, highlightedPolityId = null }: LegendProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})

  useEffect(() => {
    if (!highlightedPolityId) return
    const el = itemRefs.current[highlightedPolityId]
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [highlightedPolityId])

  return (
    <aside className="legend" aria-label={t('legendTitle')}>
      <h2 className="legend-title">{t('legendTitle')}</h2>
      {polities.length === 0 ? (
        <p className="legend-empty">{t('noPolities')}</p>
      ) : (
        <ul className="legend-list">
          {polities.map((p) => {
            const active = p.polityId === highlightedPolityId
            return (
              <li
                key={p.polityId}
                ref={(node) => {
                  itemRefs.current[p.polityId] = node
                }}
                className={
                  active ? 'legend-item legend-item--active' : 'legend-item'
                }
              >
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                />
                <span className="legend-name">
                  {p.name[lang] ?? p.name.en}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="legend-note">{t('approxNote')}</p>
    </aside>
  )
}
