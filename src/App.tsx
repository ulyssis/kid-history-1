import { useEffect, useState } from 'react'
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

export default function App() {
  const { t } = useTranslation()
  const [year, setYear] = useState(0)
  const [events, setEvents] = useState<HistoricEvent[]>([])
  const [snapshotYears, setSnapshotYears] = useState<number[]>([])
  const [territories, setTerritories] = useState<FeatureCollection | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
    const snap = pickSnapshotYear(snapshotYears, year)
    if (snap == null) {
      setTerritories(null)
      return
    }
    let cancelled = false
    void loadTerritorySnapshot(snap)
      .then((fc) => {
        if (!cancelled) setTerritories(fc)
      })
      .catch(() => {
        if (!cancelled) setTerritories(null)
      })
    return () => {
      cancelled = true
    }
  }, [year, snapshotYears])

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
            />
          )}
          <div className="map-overlays">
            <Legend polities={polities} />
          </div>
        </div>

        <footer className="app-footer">
          <p className="app-hint">{t('eventsHint')}</p>
          <Timeline
            year={Math.min(MAX_YEAR, Math.max(MIN_YEAR, year))}
            onChange={setYear}
          />
        </footer>
      </main>

      {selected && (
        <EventPopup event={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
