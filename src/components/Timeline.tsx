import { useTranslation } from 'react-i18next'
import { formatYear, MAX_YEAR, MIN_YEAR } from '../utils/year'
import './Timeline.css'

interface TimelineProps {
  year: number
  onChange: (year: number) => void
  onPrevMilestone: () => void
  onNextMilestone: () => void
  canPrev: boolean
  canNext: boolean
}

export function Timeline({
  year,
  onChange,
  onPrevMilestone,
  onNextMilestone,
  canPrev,
  canNext,
}: TimelineProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'en'

  return (
    <div className="timeline">
      <div className="timeline-year" aria-live="polite">
        <span className="timeline-year-label">{t('yearLabel')}</span>
        <span className="timeline-year-value">{formatYear(year, lang)}</span>
      </div>
      <div className="timeline-controls">
        <button
          type="button"
          className="timeline-nav"
          onClick={onPrevMilestone}
          disabled={!canPrev}
          aria-label={t('prevMilestone')}
          title={t('prevMilestone')}
        >
          ‹
        </button>
        <input
          className="timeline-slider"
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={t('yearLabel')}
        />
        <button
          type="button"
          className="timeline-nav"
          onClick={onNextMilestone}
          disabled={!canNext}
          aria-label={t('nextMilestone')}
          title={t('nextMilestone')}
        >
          ›
        </button>
      </div>
      <div className="timeline-ends">
        <span>{formatYear(MIN_YEAR, lang)}</span>
        <span>{formatYear(MAX_YEAR, lang)}</span>
      </div>
    </div>
  )
}
