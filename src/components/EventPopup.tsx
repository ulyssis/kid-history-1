import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HistoricEvent, Lang } from '../types'
import { assetUrl } from '../utils/assets'
import { formatYearRange } from '../utils/year'
import './EventPopup.css'

interface EventPopupProps {
  event: HistoricEvent
  onClose: () => void
}

const FALLBACK_IMAGE = assetUrl('/images/event-fallback.svg')

export function EventPopup({ event, onClose }: EventPopupProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const text = event.i18n[lang] ?? event.i18n.en
  const resolvedImage = event.image?.url
    ? assetUrl(event.image.url)
    : FALLBACK_IMAGE
  const [imgSrc, setImgSrc] = useState(resolvedImage)

  useEffect(() => {
    setImgSrc(
      event.image?.url ? assetUrl(event.image.url) : FALLBACK_IMAGE,
    )
  }, [event.id, event.image?.url])

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

        <figure className="event-figure">
          <img
            className="event-image"
            src={imgSrc}
            alt={text.name}
            loading="lazy"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          <figcaption className="event-image-credit">
            <span className="event-image-ref-label">{t('imageReference')}: </span>
            {event.image?.sourceUrl ? (
              <a href={event.image.sourceUrl} target="_blank" rel="noreferrer">
                {event.image.credit}
              </a>
            ) : (
              <span>{event.image?.credit ?? t('imageReference')}</span>
            )}
            {event.image?.license ? (
              <span className="event-image-license"> ({event.image.license})</span>
            ) : null}
          </figcaption>
        </figure>

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
