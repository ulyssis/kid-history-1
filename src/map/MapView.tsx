import { useEffect, useRef } from 'react'
import maplibregl, { type Map, type GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import type { HistoricEvent } from '../types'
import './MapView.css'

const EURASIA_BOUNDS: [[number, number], [number, number]] = [
  [-20, 12],
  [155, 72],
]

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
        // Slightly muted so polity colors and event markers stay readable
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

function toFeatureCollection(events: HistoricEvent[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: events.map((e) => ({
      type: 'Feature',
      id: e.id,
      properties: { id: e.id },
      geometry: e.geometry as Geometry,
    })),
  }
}

interface MapViewProps {
  territories: FeatureCollection | null
  events: HistoricEvent[]
  onSelectEvent: (id: string) => void
  onHoverPolity?: (polityId: string | null) => void
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
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const readyRef = useRef(false)
  const onSelectRef = useRef(onSelectEvent)
  const onHoverPolityRef = useRef(onHoverPolity)
  const territoriesRef = useRef(territories)
  const eventsRef = useRef(events)
  const hoveredPolityRef = useRef<string | null>(null)
  onSelectRef.current = onSelectEvent
  onHoverPolityRef.current = onHoverPolity
  territoriesRef.current = territories
  eventsRef.current = events

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center: [55, 40],
      zoom: 2.4,
      maxBounds: [
        [EURASIA_BOUNDS[0][0] - 5, EURASIA_BOUNDS[0][1] - 5],
        [EURASIA_BOUNDS[1][0] + 5, EURASIA_BOUNDS[1][1] + 5],
      ],
      minZoom: 2,
      maxZoom: 8,
      attributionControl: {},
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
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
        paint: {
          'fill-color': '#c45c26',
          'fill-opacity': 0.28,
        },
      })
      map.addLayer({
        id: 'events-line',
        type: 'line',
        source: 'events-poly',
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

      // Points must stay above area fills for visibility + hit-testing preference.
      map.moveLayer('events-circle')

      map.on('click', (e) => {
        // Prefer point events when they sit on top of a long-running area event.
        // Use a small hit box so points stay easy to click over large fills.
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
        const id = atArea[0]?.properties?.id as string | undefined
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
    // Keep point markers above area polygons after data updates.
    if (map.getLayer('events-circle')) map.moveLayer('events-circle')
  }, [events])

  return <div ref={containerRef} className="map-view" />
}
