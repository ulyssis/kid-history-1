import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HistoricEvent, Lang } from '../types'
import type { RelationResult } from '../data/buildRelation'
import { assetUrl } from '../utils/assets'
import { formatYearRange } from '../utils/year'
import './RelationsPopup.css'

interface RelationsPopupProps {
  relation: RelationResult
  onClose: () => void
  onOpenEvent: (id: string) => void
}

const FALLBACK = assetUrl('/images/event-fallback.svg')

export function RelationsPopup({
  relation,
  onClose,
  onOpenEvent,
}: RelationsPopupProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const hero = relation.events.find((e) => e.image?.url) ?? relation.events[0]
  const [imgSrc, setImgSrc] = useState(
    hero?.image?.url ? assetUrl(hero.image.url) : FALLBACK,
  )

  useEffect(() => {
    setImgSrc(hero?.image?.url ? assetUrl(hero.image.url) : FALLBACK)
  }, [hero?.id, hero?.image?.url])

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relations-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relations-popup-title"
      >
        <button
          type="button"
          className="event-close"
          onClick={onClose}
          aria-label={t('close')}
        >
          ×
        </button>
        <h2 id="relations-popup-title" className="relations-title">
          {t('relationsBetween', {
            a: relation.labelA,
            b: relation.labelB,
          })}
        </h2>

        {hero && (
          <figure className="relations-figure">
            <img
              className="relations-image"
              src={imgSrc}
              alt=""
              loading="lazy"
              onError={() => setImgSrc(FALLBACK)}
            />
            {hero.image?.credit && (
              <figcaption className="event-image-credit">
                <span className="event-image-ref-label">
                  {t('imageReference')}:{' '}
                </span>
                <span>{hero.image.credit}</span>
              </figcaption>
            )}
          </figure>
        )}

        <section className="relations-section">
          <h3>{t('relationsOverall')}</h3>
          <p>{relation.overall}</p>
        </section>

        <section className="relations-section">
          <h3>{t('relationsEvents')}</h3>
          {relation.events.length === 0 ? (
            <p className="relations-empty">{t('relationsNoEvents')}</p>
          ) : (
            <ul className="relations-event-list">
              {relation.events.map((e) => (
                <RelationEventRow
                  key={e.id}
                  event={e}
                  lang={lang}
                  onOpen={() => onOpenEvent(e.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <button type="button" className="event-done" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </div>
  )
}

function RelationEventRow({
  event,
  lang,
  onOpen,
}: {
  event: HistoricEvent
  lang: Lang
  onOpen: () => void
}) {
  const text = event.i18n[lang] ?? event.i18n.en
  const thumb = event.image?.url ? assetUrl(event.image.url) : FALLBACK
  return (
    <li>
      <button type="button" className="relations-event-btn" onClick={onOpen}>
        <img src={thumb} alt="" className="relations-thumb" />
        <span className="relations-event-text">
          <strong>{text.name}</strong>
          <span>
            {formatYearRange(event.startYear, event.endYear, lang)}
          </span>
        </span>
      </button>
    </li>
  )
}
