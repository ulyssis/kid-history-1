import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lang, PolityProperties } from '../types'
import './Legend.css'

interface LegendProps {
  polities: PolityProperties[]
  highlightedPolityId?: string | null
  selectedPolityIds?: string[]
  relationsMode?: boolean
  onSelectPolity?: (polityId: string) => void
}

export function Legend({
  polities,
  highlightedPolityId = null,
  selectedPolityIds = [],
  relationsMode = false,
  onSelectPolity,
}: LegendProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const selected = new Set(selectedPolityIds)

  useEffect(() => {
    const focusId = highlightedPolityId ?? selectedPolityIds[selectedPolityIds.length - 1]
    if (!focusId) return
    const el = itemRefs.current[focusId]
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [highlightedPolityId, selectedPolityIds])

  return (
    <aside className="legend" aria-label={t('legendTitle')}>
      <div className="legend-head">
        <h2 className="legend-title">{t('legendTitle')}</h2>
        <p className="legend-note">{t('approxNote')}</p>
      </div>
      {polities.length === 0 ? (
        <p className="legend-empty">{t('noPolities')}</p>
      ) : (
        <ul className="legend-list">
          {polities.map((p) => {
            const active = p.polityId === highlightedPolityId
            const picked = selected.has(p.polityId)
            const className = [
              'legend-item',
              active ? 'legend-item--active' : '',
              picked ? 'legend-item--picked' : '',
              relationsMode ? 'legend-item--clickable' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li
                key={p.polityId}
                ref={(node) => {
                  itemRefs.current[p.polityId] = node
                }}
                className={className}
              >
                {relationsMode && onSelectPolity ? (
                  <button
                    type="button"
                    className="legend-item-btn"
                    onClick={() => onSelectPolity(p.polityId)}
                  >
                    <span
                      className="legend-swatch"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <span className="legend-name">
                      {p.name[lang] ?? p.name.en}
                    </span>
                  </button>
                ) : (
                  <>
                    <span
                      className="legend-swatch"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <span className="legend-name">
                      {p.name[lang] ?? p.name.en}
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
