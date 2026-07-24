import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FeatureCollection } from 'geojson'
import { EventPopup } from './components/EventPopup'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { Legend } from './components/Legend'
import { RelationsPopup } from './components/RelationsPopup'
import { Timeline } from './components/Timeline'
import { buildRelation, type RelationResult } from './data/buildRelation'
import {
  loadEvents,
  loadTerritoryManifest,
  loadTerritorySnapshot,
  pickSnapshotYear,
} from './data/loaders'
import { MapView } from './map/MapView'
import type { HistoricEvent, Lang, PolityProperties } from './types'
import { isEventVisible, MAX_YEAR, MIN_YEAR } from './utils/year'
import './App.css'

function extractPolities(fc: FeatureCollection | null): PolityProperties[] {
  if (!fc) return []
  const seen = new Set<string>()
  const out: PolityProperties[] = []
  for (const f of fc.features) {
    const p = f.properties as PolityProperties | null
    if (!p?.polityId || seen.has(p.polityId)) continue
    seen.add(p.polityId)
    out.push(p)
  }
  return out
}

/** Years where an event starts/ends or a territory snapshot begins. */
function buildMilestones(
  events: HistoricEvent[],
  snapshotYears: number[],
): number[] {
  const set = new Set<number>(snapshotYears)
  for (const e of events) {
    set.add(e.startYear)
    set.add(e.endYear)
  }
  return [...set]
    .filter((y) => y >= MIN_YEAR && y <= MAX_YEAR)
    .sort((a, b) => a - b)
}

export default function App() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language?.slice(0, 2) || 'en') as Lang
  const [year, setYear] = useState(-200)
  const [events, setEvents] = useState<HistoricEvent[]>([])
  const [snapshotYears, setSnapshotYears] = useState<number[]>([])
  const [territories, setTerritories] = useState<FeatureCollection | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredPolityId, setHoveredPolityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relationsMode, setRelationsMode] = useState(false)
  const [pickedPolities, setPickedPolities] = useState<string[]>([])
  const [relation, setRelation] = useState<RelationResult | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ev, manifest] = await Promise.all([
          loadEvents(),
          loadTerritoryManifest(),
        ])
        if (cancelled) return
        setEvents(ev)
        setSnapshotYears(
          manifest.snapshots.map((s) => s.year).sort((a, b) => a - b),
        )
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load data')
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (snapshotYears.length === 0) return
    const snap =
      pickSnapshotYear(snapshotYears, year) ?? snapshotYears[0] ?? null
    if (snap == null) return

    let cancelled = false
    void loadTerritorySnapshot(snap)
      .then((fc) => {
        if (!cancelled) setTerritories(fc)
      })
      .catch(() => {
        /* Keep previous territories visible on load errors */
      })
    return () => {
      cancelled = true
    }
  }, [year, snapshotYears])

  useEffect(() => {
    setHoveredPolityId(null)
    setPickedPolities([])
    setRelation(null)
  }, [year, territories])

  // Refresh open relation text when language changes.
  useEffect(() => {
    if (pickedPolities.length < 2) return
    setRelation(buildRelation(pickedPolities[0], pickedPolities[1], events, lang))
  }, [lang, events, pickedPolities])

  const milestones = useMemo(
    () => buildMilestones(events, snapshotYears),
    [events, snapshotYears],
  )

  const prevMilestone = useMemo(
    () => [...milestones].reverse().find((y) => y < year) ?? null,
    [milestones, year],
  )
  const nextMilestone = useMemo(
    () => milestones.find((y) => y > year) ?? null,
    [milestones, year],
  )

  const visibleEvents = events.filter((e) =>
    isEventVisible(e.startYear, e.endYear, year),
  )
  const selected = events.find((e) => e.id === selectedId) ?? null
  const polities = extractPolities(territories)

  const toggleRelationsMode = () => {
    setRelationsMode((on) => {
      if (on) {
        setPickedPolities([])
        setRelation(null)
        return false
      }
      setSelectedId(null)
      setPickedPolities([])
      setRelation(null)
      return true
    })
  }

  const handlePickPolity = (polityId: string) => {
    if (!relationsMode) return
    setPickedPolities((prev) => {
      if (prev.length === 0) return [polityId]
      if (prev.length === 1) {
        if (prev[0] === polityId) return prev
        const result = buildRelation(prev[0], polityId, events, lang)
        setRelation(result)
        return [prev[0], polityId]
      }
      // Restart selection with the new first pick.
      setRelation(null)
      return [polityId]
    })
  }

  const relationsHint =
    pickedPolities.length === 0
      ? t('relationsHintFirst')
      : pickedPolities.length === 1
        ? t('relationsHintSecond')
        : t('relationsHintDone')

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <h1 className="app-title">{t('appTitle')}</h1>
          <p className="app-subtitle">{t('subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="app-main">
        <div className="map-stage">
          {loading ? (
            <p className="app-status">{t('loading')}</p>
          ) : error ? (
            <p className="app-status app-error">{error}</p>
          ) : (
            <MapView
              territories={territories}
              events={visibleEvents}
              onSelectEvent={setSelectedId}
              onHoverPolity={setHoveredPolityId}
              relationsMode={relationsMode}
              selectedPolityIds={pickedPolities}
              onSelectPolity={handlePickPolity}
            />
          )}
          <div className="map-overlays">
            <div className="map-chrome">
              <button
                type="button"
                className={
                  relationsMode
                    ? 'relations-btn relations-btn--active'
                    : 'relations-btn'
                }
                onClick={toggleRelationsMode}
                aria-pressed={relationsMode}
              >
                {t('relationsButton')}
              </button>
              {relationsMode && (
                <p className="relations-hint">{relationsHint}</p>
              )}
            </div>
            <Legend
              polities={polities}
              highlightedPolityId={hoveredPolityId}
              selectedPolityIds={pickedPolities}
              relationsMode={relationsMode}
              onSelectPolity={handlePickPolity}
            />
          </div>
        </div>

        <footer className="app-footer">
          <p className="app-hint">{t('eventsHint')}</p>
          <Timeline
            year={Math.min(MAX_YEAR, Math.max(MIN_YEAR, year))}
            onChange={setYear}
            onPrevMilestone={() => {
              if (prevMilestone != null) setYear(prevMilestone)
            }}
            onNextMilestone={() => {
              if (nextMilestone != null) setYear(nextMilestone)
            }}
            canPrev={prevMilestone != null}
            canNext={nextMilestone != null}
          />
        </footer>
      </main>

      {selected && !relation && (
        <EventPopup event={selected} onClose={() => setSelectedId(null)} />
      )}

      {relation && (
        <RelationsPopup
          relation={relation}
          onClose={() => {
            setRelation(null)
            setPickedPolities([])
          }}
          onOpenEvent={(id) => {
            setRelation(null)
            setPickedPolities([])
            setRelationsMode(false)
            setSelectedId(id)
          }}
        />
      )}
    </div>
  )
}
