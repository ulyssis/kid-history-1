import { useEffect, useRef } from 'react'
import maplibregl, { type Map, type GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import type { HistoricEvent } from '../types'
import './MapView.css'

const EURASIA_BOUNDS: [[number, number], [number, number]] = [
  [-20, 12],
  [155, 72],
]

const MUTED_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
      paint: {
        'raster-saturation': -0.55,
        'raster-contrast': -0.15,
        'raster-brightness-min': 0.35,
        'raster-opacity': 0.85,
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

export function MapView({ territories, events, onSelectEvent }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const readyRef = useRef(false)
  const onSelectRef = useRef(onSelectEvent)
  const territoriesRef = useRef(territories)
  const eventsRef = useRef(events)
  onSelectRef.current = onSelectEvent
  territoriesRef.current = territories
  eventsRef.current = events

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MUTED_STYLE,
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
      })
      map.addLayer({
        id: 'territories-fill',
        type: 'fill',
        source: 'territories',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.42,
        },
      })
      map.addLayer({
        id: 'territories-outline',
        type: 'line',
        source: 'territories',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.2,
          'line-opacity': 0.75,
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
          'line-width': 2,
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
          'circle-radius': 8,
          'circle-color': '#d35400',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff8ef',
          'circle-opacity': 0.92,
        },
      })

      const clickLayers = ['events-circle', 'events-fill']
      for (const layer of clickLayers) {
        map.on('click', layer, (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined
          if (id) onSelectRef.current(id)
        })
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = ''
        })
      }

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
  }, [events])

  return <div ref={containerRef} className="map-view" />
}
