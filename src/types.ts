import type { Geometry } from 'geojson'

export type Lang = 'en' | 'de' | 'zh'

export interface LocalizedText {
  name: string
  location: string
  consequence: string
}

export interface EventSource {
  label: string
  url: string
}

export interface HistoricEvent {
  id: string
  startYear: number
  endYear: number
  geometry: Geometry
  i18n: Record<Lang, LocalizedText>
  sources: EventSource[]
}

export interface PolityProperties {
  polityId: string
  color: string
  name: Record<Lang, string>
  note?: string
}

export interface TerritorySnapshotMeta {
  year: number
  sources: EventSource[]
}

export interface TerritoryManifest {
  snapshots: TerritorySnapshotMeta[]
}
