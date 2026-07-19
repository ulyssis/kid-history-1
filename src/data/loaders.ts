import type { FeatureCollection } from 'geojson'
import type { HistoricEvent, TerritoryManifest } from '../types'

export async function loadEvents(): Promise<HistoricEvent[]> {
  const res = await fetch('/data/events.json')
  if (!res.ok) throw new Error('Failed to load events')
  return (await res.json()) as HistoricEvent[]
}

export async function loadTerritoryManifest(): Promise<TerritoryManifest> {
  const res = await fetch('/data/territories/manifest.json')
  if (!res.ok) throw new Error('Failed to load territory manifest')
  return (await res.json()) as TerritoryManifest
}

export async function loadTerritorySnapshot(
  year: number,
): Promise<FeatureCollection> {
  const res = await fetch(`/data/territories/${year}.geojson`)
  if (!res.ok) throw new Error(`Failed to load territory snapshot ${year}`)
  return (await res.json()) as FeatureCollection
}

/** Pick latest snapshot year that is ≤ selected year. */
export function pickSnapshotYear(
  snapshotYears: number[],
  selectedYear: number,
): number | null {
  const eligible = snapshotYears.filter((y) => y <= selectedYear)
  if (eligible.length === 0) return null
  return Math.max(...eligible)
}
