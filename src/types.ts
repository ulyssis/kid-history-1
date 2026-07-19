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

export interface EventImage {
  url: string
  /** Short credit line shown under the picture */
  credit: string
  /** Link to the source page when the image is from the web */
  sourceUrl?: string
  /** License label, e.g. CC0, Public Domain, Original illustration */
  license?: string
  /** How the image was obtained */
  origin?: 'generated' | 'wikimedia' | 'met' | 'other-pd'
}

export interface HistoricEvent {
  id: string
  startYear: number
  endYear: number
  geometry: Geometry
  i18n: Record<Lang, LocalizedText>
  sources: EventSource[]
  image?: EventImage
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
