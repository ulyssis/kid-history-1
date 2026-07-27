import { useEffect, useRef } from 'react'
import maplibregl, { type Map, type GeoJSONSource } from 'maplibre-gl'
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson'
import type { HistoricEvent } from '../types'
import './MapView.css'

const EURASIA_BOUNDS: [[number, number], [number, number]] = [
  [-20, 12],
  [155, 72],
]

/** Expand the navigable frame to ~1.5× the core Eurasia extent. */
function expandBounds(
  bounds: [[number, number], [number, number]],
  factor: number,
): [[number, number], [number, number]] {
  const [[w, s], [e, n]] = bounds
  const cx = (w + e) / 2
  const cy = (s + n) / 2
  const halfW = ((e - w) / 2) * factor
  const halfH = ((n - s) / 2) * factor
  return [
    [cx - halfW, Math.max(-85, cy - halfH)],
    [cx + halfW, Math.min(85, cy + halfH)],
  ]
}

const MAP_MAX_BOUNDS = expandBounds(EURASIA_BOUNDS, 1.5)

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: {
        'raster-saturation': -0.15,
        'raster-brightness-min': 0.15,
        'raster-opacity': 0.92,
      },
    },
  ],
}

function emptyCollection(): FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

/** Approximate polygon area for relative stacking (lon/lat shoelace). */
function ringArea(ring: Position[]): number {
  if (ring.length < 3) return 0
  let sum = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

function geometryArea(geometry: Geometry): number {
  if (geometry.type === 'Polygon') {
    return ringArea(geometry.coordinates[0] ?? [])
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce(
      (acc, poly) => acc + ringArea(poly[0] ?? []),
      0,
    )
  }
  return 0
}

function toFeatureCollection(events: HistoricEvent[]): FeatureCollection {
  const features: Feature[] = events.map((e) => {
    const area = geometryArea(e.geometry as Geometry)
    return {
      type: 'Feature',
      id: e.id,
      properties: { id: e.id, area },
      geometry: e.geometry as Geometry,
    }
  })
  // Largest first in the array; fill-sort-key also uses area so smaller draws on top.
  features.sort(
    (a, b) =>
      ((b.properties?.area as number) ?? 0) -
      ((a.properties?.area as number) ?? 0),
  )
  return { type: 'FeatureCollection', features }
}

function pickSmallestAreaFeature(
  features: maplibregl.MapGeoJSONFeature[],
): maplibregl.MapGeoJSONFeature | undefined {
  if (features.length === 0) return undefined
  return features.reduce((best, f) => {
    const a = Number(f.properties?.area ?? Number.POSITIVE_INFINITY)
    const b = Number(best.properties?.area ?? Number.POSITIVE_INFINITY)
    return a < b ? f : best
  })
}

interface MapViewProps {
  territories: FeatureCollection | null
  events: HistoricEvent[]
  onSelectEvent: (id: string) => void
  onHoverPolity?: (polityId: string | null) => void
  relationsMode?: boolean
  selectedPolityIds?: string[]
  onSelectPolity?: (polityId: string) => void
  /** Bumps when the map container size changes (e.g. map-focus layout). */
  layoutEpoch?: number
}

function splitEvents(events: HistoricEvent[]): {
  points: HistoricEvent[]
  polys: HistoricEvent[]
} {
  const points: HistoricEvent[] = []
  const polys: HistoricEvent[] = []
  for (const e of events) {
    const t = e.geometry.type
    if (t === 'Point' || t === 'MultiPoint') points.push(e)
    else polys.push(e)
  }
  return { points, polys }
}

export function MapView({
  territories,
  events,
  onSelectEvent,
  onHoverPolity,
  relationsMode = false,
  selectedPolityIds = [],
  onSelectPolity,
  layoutEpoch = 0,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const readyRef = useRef(false)
  const onSelectRef = useRef(onSelectEvent)
  const onHoverPolityRef = useRef(onHoverPolity)
  const onSelectPolityRef = useRef(onSelectPolity)
  const relationsModeRef = useRef(relationsMode)
  const territoriesRef = useRef(territories)
  const eventsRef = useRef(events)
  const hoveredPolityRef = useRef<string | null>(null)
  const selectedPolityIdsRef = useRef(selectedPolityIds)
  const relationLineStartRef = useRef<[number, number] | null>(null)
  onSelectRef.current = onSelectEvent
  onHoverPolityRef.current = onHoverPolity
  onSelectPolityRef.current = onSelectPolity
  relationsModeRef.current = relationsMode
  territoriesRef.current = territories
  eventsRef.current = events
  selectedPolityIdsRef.current = selectedPolityIds

  const setRelationLink = (
    map: Map,
    start: [number, number] | null,
    end: [number, number] | null,
  ) => {
    const src = map.getSource('relations-link') as GeoJSONSource | undefined
    if (!src) return
    if (!start) {
      src.setData(emptyCollection())
      return
    }
    const features: Feature[] = [
      {
        type: 'Feature',
        properties: { kind: 'start' },
        geometry: { type: 'Point', coordinates: start },
      },
    ]
    if (end) {
      features.push({
        type: 'Feature',
        properties: { kind: 'link' },
        geometry: { type: 'LineString', coordinates: [start, end] },
      })
    }
    src.setData({ type: 'FeatureCollection', features })
  }

  const polityCentroid = (polityId: string): [number, number] | null => {
    const fc = territoriesRef.current
    if (!fc) return null
    const f = fc.features.find((x) => x.properties?.polityId === polityId)
    if (!f?.geometry) return null
    const g = f.geometry as Geometry
    let ring: Position[] | null = null
    if (g.type === 'Polygon') ring = g.coordinates[0] ?? null
    else if (g.type === 'MultiPolygon') ring = g.coordinates[0]?.[0] ?? null
    if (!ring || ring.length === 0) return null
    let sx = 0
    let sy = 0
    let n = 0
    for (const p of ring) {
      if (p.length < 2) continue
      sx += p[0]
      sy += p[1]
      n++
    }
    if (n === 0) return null
    return [sx / n, sy / n]
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: [55, 40],
      zoom: 2.4,
      maxBounds: MAP_MAX_BOUNDS,
      // Allow enough zoom-out for the western Mediterranean and China
      // to stay visible together even on narrower screens.
      minZoom: 0.7,
      maxZoom: 8,
      attributionControl: {},
    })

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    )
    mapRef.current = map

    map.on('load', () => {
      map.addSource('territories', {
        type: 'geojson',
        data: territoriesRef.current ?? emptyCollection(),
        promoteId: 'polityId',
      })
      map.addLayer({
        id: 'territories-fill',
        type: 'fill',
        source: 'territories',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.78,
            ['boolean', ['feature-state', 'hover'], false],
            0.72,
            0.48,
          ],
        },
      })
      map.addLayer({
        id: 'territories-outline',
        type: 'line',
        source: 'territories',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.4,
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.6,
          ],
          'line-opacity': 0.9,
        },
      })

      const { points, polys } = splitEvents(eventsRef.current)
      map.addSource('events-poly', {
        type: 'geojson',
        data: toFeatureCollection(polys),
      })
      map.addLayer({
        id: 'events-fill',
        type: 'fill',
        source: 'events-poly',
        layout: {
          // Smaller area → higher sort key → drawn on top.
          'fill-sort-key': ['*', ['get', 'area'], -1],
        },
        paint: {
          'fill-color': '#c45c26',
          'fill-opacity': 0.28,
        },
      })
      map.addLayer({
        id: 'events-line',
        type: 'line',
        source: 'events-poly',
        layout: {
          'line-sort-key': ['*', ['get', 'area'], -1],
        },
        paint: {
          'line-color': '#a84315',
          'line-width': 2.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      })

      map.addSource('events-point', {
        type: 'geojson',
        data: toFeatureCollection(points),
      })
      map.addLayer({
        id: 'events-circle',
        type: 'circle',
        source: 'events-point',
        paint: {
          'circle-radius': 9,
          'circle-color': '#d35400',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff8ef',
          'circle-opacity': 0.95,
        },
      })

      map.addSource('relations-link', {
        type: 'geojson',
        data: emptyCollection(),
      })
      map.addLayer({
        id: 'relations-link-line',
        type: 'line',
        source: 'relations-link',
        paint: {
          'line-color': '#2f5d48',
          'line-width': 3,
          'line-dasharray': [1.5, 1.2],
          'line-opacity': 0.95,
        },
      })
      map.addLayer({
        id: 'relations-link-dot',
        type: 'circle',
        source: 'relations-link',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#2f5d48',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff8ef',
        },
      })

      map.moveLayer('events-circle')
      map.moveLayer('relations-link-line')
      map.moveLayer('relations-link-dot')

      map.on('click', (e) => {
        if (relationsModeRef.current) {
          const terrHits = map.queryRenderedFeatures(e.point, {
            layers: ['territories-fill'],
          })
          const polityId = terrHits[0]?.properties?.polityId as
            | string
            | undefined
          if (!polityId) return
          const prev = selectedPolityIdsRef.current
          if (prev.length === 0) {
            relationLineStartRef.current = [e.lngLat.lng, e.lngLat.lat]
            setRelationLink(map, relationLineStartRef.current, null)
          } else if (prev.length === 1) {
            relationLineStartRef.current = null
            setRelationLink(map, null, null)
          } else {
            relationLineStartRef.current = [e.lngLat.lng, e.lngLat.lat]
            setRelationLink(map, relationLineStartRef.current, null)
          }
          onSelectPolityRef.current?.(polityId)
          return
        }

        const pad = 6
        const box: [maplibregl.PointLike, maplibregl.PointLike] = [
          [e.point.x - pad, e.point.y - pad],
          [e.point.x + pad, e.point.y + pad],
        ]
        const atPoint = map.queryRenderedFeatures(box, {
          layers: ['events-circle'],
        })
        if (atPoint.length > 0) {
          const id = atPoint[0]?.properties?.id as string | undefined
          if (id) onSelectRef.current(id)
          return
        }
        const atArea = map.queryRenderedFeatures(e.point, {
          layers: ['events-fill'],
        })
        const smallest = pickSmallestAreaFeature(atArea)
        const id = smallest?.properties?.id as string | undefined
        if (id) onSelectRef.current(id)
      })

      const clearTerritoryHover = () => {
        const prev = hoveredPolityRef.current
        if (prev != null) {
          try {
            map.setFeatureState(
              { source: 'territories', id: prev },
              { hover: false },
            )
          } catch {
            /* source may be empty */
          }
          hoveredPolityRef.current = null
        }
        onHoverPolityRef.current?.(null)
      }

      const setTerritoryHover = (polityId: string | null) => {
        if (polityId === hoveredPolityRef.current) return
        const prev = hoveredPolityRef.current
        if (prev != null) {
          try {
            map.setFeatureState(
              { source: 'territories', id: prev },
              { hover: false },
            )
          } catch {
            /* ignore */
          }
        }
        hoveredPolityRef.current = polityId
        if (polityId != null) {
          try {
            map.setFeatureState(
              { source: 'territories', id: polityId },
              { hover: true },
            )
          } catch {
            /* ignore */
          }
        }
        onHoverPolityRef.current?.(polityId)
      }

      map.on('mousemove', (e) => {
        if (relationsModeRef.current) {
          const terrHits = map.queryRenderedFeatures(e.point, {
            layers: ['territories-fill'],
          })
          const polityId =
            (terrHits[0]?.properties?.polityId as string | undefined) ?? null
          map.getCanvas().style.cursor = polityId ? 'pointer' : 'crosshair'
          setTerritoryHover(polityId)
          const start = relationLineStartRef.current
          if (start && selectedPolityIdsRef.current.length === 1) {
            setRelationLink(map, start, [e.lngLat.lng, e.lngLat.lat])
          }
          return
        }

        const pad = 6
        const box: [maplibregl.PointLike, maplibregl.PointLike] = [
          [e.point.x - pad, e.point.y - pad],
          [e.point.x + pad, e.point.y + pad],
        ]
        const pointHits = map.queryRenderedFeatures(box, {
          layers: ['events-circle'],
        })
        const areaHits =
          pointHits.length > 0
            ? []
            : map.queryRenderedFeatures(e.point, { layers: ['events-fill'] })
        map.getCanvas().style.cursor =
          pointHits.length > 0 || areaHits.length > 0 ? 'pointer' : ''

        const terrHits = map.queryRenderedFeatures(e.point, {
          layers: ['territories-fill'],
        })
        const polityId =
          (terrHits[0]?.properties?.polityId as string | undefined) ?? null
        setTerritoryHover(polityId)
      })
      map.on('mouseout', () => {
        map.getCanvas().style.cursor = ''
        clearTerritoryHover()
      })

      readyRef.current = true
      map.fitBounds(EURASIA_BOUNDS, { padding: 40, duration: 0 })
    })

    return () => {
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const src = map.getSource('territories') as GeoJSONSource | undefined
    if (src) src.setData(territories ?? emptyCollection())
  }, [territories])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return

    const { points, polys } = splitEvents(events)
    const pointSrc = map.getSource('events-point') as GeoJSONSource | undefined
    const polySrc = map.getSource('events-poly') as GeoJSONSource | undefined
    if (pointSrc) pointSrc.setData(toFeatureCollection(points))
    if (polySrc) polySrc.setData(toFeatureCollection(polys))
    if (map.getLayer('events-circle')) map.moveLayer('events-circle')
  }, [events])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const fc = territoriesRef.current
    if (!fc) return
    const selected = new Set(selectedPolityIds)
    for (const f of fc.features) {
      const id = f.properties?.polityId as string | undefined
      if (!id) continue
      try {
        map.setFeatureState(
          { source: 'territories', id },
          { selected: selected.has(id) },
        )
      } catch {
        /* ignore */
      }
    }
  }, [selectedPolityIds, territories])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    map.getCanvas().style.cursor = relationsMode ? 'crosshair' : ''
    if (!relationsMode) {
      relationLineStartRef.current = null
      setRelationLink(map, null, null)
    }
  }, [relationsMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    // Defer until CSS flex layout has applied after map-focus toggle.
    const id = window.requestAnimationFrame(() => {
      map.resize()
    })
    return () => window.cancelAnimationFrame(id)
  }, [layoutEpoch])

  // Legend picks: start the rubber-band from the polity centroid.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!relationsMode) return
    if (selectedPolityIds.length === 0) {
      relationLineStartRef.current = null
      setRelationLink(map, null, null)
      return
    }
    if (selectedPolityIds.length === 1) {
      if (!relationLineStartRef.current) {
        const c = polityCentroid(selectedPolityIds[0])
        if (c) {
          relationLineStartRef.current = c
          setRelationLink(map, c, null)
        }
      }
      return
    }
    // Two selected: clear the temporary drag line.
    relationLineStartRef.current = null
    setRelationLink(map, null, null)
  }, [selectedPolityIds, relationsMode, territories])

  return (
    <div
      ref={containerRef}
      className={
        relationsMode ? 'map-view map-view--relations' : 'map-view'
      }
    />
  )
}
