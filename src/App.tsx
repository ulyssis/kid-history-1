import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FeatureCollection } from 'geojson'
import { EventPopup } from './components/EventPopup'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { Legend } from './components/Legend'
import { Timeline } from './components/Timeline'
import {
  loadEvents,
  loadTerritoryManifest,
  loadTerritorySnapshot,
  pickSnapshotYear,
} from './data/loaders'
import { MapView } from './map/MapView'
import type { HistoricEvent, PolityProperties } from './types'
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
  const { t } = useTranslation()
  const [year, setYear] = useState(-200)
  const [events, setEvents] = useState<HistoricEvent[]>([])
  const [snapshotYears, setSnapshotYears] = useState<number[]>([])
  const [territories, setTerritories] = useState<FeatureCollection | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredPolityId, setHoveredPolityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setSnapshotYears(manifest.snapshots.map((s) => s.year).sort((a, b) => a - b))
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
    // Always show a territory layer: use latest snapshot ≤ year, else earliest.
    const snap =
      pickSnapshotYear(snapshotYears, year) ?? snapshotYears[0] ?? null
    if (snap == null) return

    let cancelled = false
    void loadTerritorySnapshot(snap)
      .then((fc) => {
        if (!cancelled) setTerritories(fc)
      })
      .catch(() => {
        // Keep previous territories visible on load errors
      })
    return () => {
      cancelled = true
    }
  }, [year, snapshotYears])

  useEffect(() => {
    setHoveredPolityId(null)
  }, [year, territories])

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
            />
          )}
          <div className="map-overlays">
            <Legend
              polities={polities}
              highlightedPolityId={hoveredPolityId}
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

      {selected && (
        <EventPopup event={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
