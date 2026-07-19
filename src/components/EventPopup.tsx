import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { HistoricEvent, Lang } from '../types'
import { formatYearRange } from '../utils/year'
import './EventPopup.css'

interface EventPopupProps {
  event: HistoricEvent
  onClose: () => void
}

export function EventPopup({ event, onClose }: EventPopupProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const text = event.i18n[lang] ?? event.i18n.en

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="event-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="event-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="event-close"
          onClick={onClose}
          aria-label={t('close')}
        >
          ×
        </button>

        <dl className="event-fields">
          <div>
            <dt>{t('eventName')}</dt>
            <dd id="event-popup-title">{text.name}</dd>
          </div>
          <div>
            <dt>{t('eventLocation')}</dt>
            <dd>{text.location}</dd>
          </div>
          <div>
            <dt>{t('eventTime')}</dt>
            <dd>{formatYearRange(event.startYear, event.endYear, lang)}</dd>
          </div>
          <div>
            <dt>{t('eventConsequence')}</dt>
            <dd>{text.consequence}</dd>
          </div>
          <div>
            <dt>{t('eventSources')}</dt>
            <dd>
              <ul className="event-sources">
                {event.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <button type="button" className="event-done" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  )
}
