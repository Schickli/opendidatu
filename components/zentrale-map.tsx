'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from 'maplibre-gl'
import {
  swissToWgs84,
} from '@/lib/coordinates'
import { useData } from '@/lib/data-context'
import type { ImportedOverlayFeatureCollection } from '@/lib/contracts'
import type { Posten } from '@/lib/store'
import { PostenPopupContent } from './posten-popup-content'

type MapStyleSource = {
  tiles?: string[]
  url?: string
  [key: string]: unknown
}

type MapStyleDocument = Exclude<ConstructorParameters<typeof MapLibreMap>[0]['style'], string | undefined> & {
  glyphs?: string
  sprite?: string
  sources?: Record<string, MapStyleSource>
  [key: string]: unknown
}

type CircleFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Polygon'
      coordinates: number[][][]
    }
    properties: Record<string, never>
  }>
}

const ACTIVE_POSTEN_RADIUS_SOURCE_ID = 'active-posten-radius'
const ACTIVE_POSTEN_RADIUS_FILL_LAYER_ID = 'active-posten-radius-fill'
const ACTIVE_POSTEN_RADIUS_LINE_LAYER_ID = 'active-posten-radius-line'
const ACTIVE_POSTEN_RADIUS_METERS = 5_000
const IMPORTED_OVERLAY_SOURCE_ID = 'imported-overlay'
const IMPORTED_OVERLAY_FILL_LAYER_ID = 'imported-overlay-fill'
const IMPORTED_OVERLAY_LINE_LAYER_ID = 'imported-overlay-line'
const IMPORTED_OVERLAY_OUTLINE_LAYER_ID = 'imported-overlay-outline'
const IMPORTED_OVERLAY_POINT_LAYER_ID = 'imported-overlay-point'
const IMPORTED_OVERLAY_LABEL_LAYER_ID = 'imported-overlay-label'

function toAbsoluteMapUrl(url: string, origin: string) {
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
    return url
  }

  return new URL(url, origin).toString().replace(/%7B/gi, '{').replace(/%7D/gi, '}')
}

function absolutizeMapStyle(style: MapStyleDocument, origin: string) {
  if (style.glyphs) {
    style.glyphs = toAbsoluteMapUrl(style.glyphs, origin)
  }

  if (style.sprite) {
    style.sprite = toAbsoluteMapUrl(style.sprite, origin)
  }

  if (style.sources) {
    for (const source of Object.values(style.sources)) {
      if (source.url) {
        source.url = toAbsoluteMapUrl(source.url, origin)
      }

      if (source.tiles) {
        source.tiles = source.tiles.map((tileUrl) => toAbsoluteMapUrl(tileUrl, origin))
      }
    }
  }

  return style
}

async function loadMapStyle() {
  const response = await fetch('/api/map/style')

  if (!response.ok) {
    throw new Error(`Unable to load map style (${response.status}).`)
  }

  const style = (await response.json()) as MapStyleDocument
  return absolutizeMapStyle(style, window.location.origin)
}

function createPostenIcon(status: 'ok' | 'warning' | 'none', isSelected: boolean) {
  const size = isSelected ? 16 : 12
  let bg: string
  let border: string
  if (status === 'warning') {
    bg = 'transparent'
    border = `2px solid #c44`
  } else if (status === 'ok') {
    bg = '#222'
    border = isSelected ? '2px solid #000' : '1px solid #444'
  } else {
    bg = '#aaa'
    border = isSelected ? '2px solid #000' : '1px solid #888'
  }

  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'custom-posten-marker'
  element.style.width = `${size}px`
  element.style.height = `${size}px`
  element.style.background = bg
  element.style.border = border
  element.style.boxSizing = 'border-box'
  element.style.padding = '0'
  element.style.cursor = 'pointer'

  return element
}

function createEmptyFeatureCollection(): CircleFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

function createEmptyImportedOverlayFeatureCollection(): ImportedOverlayFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number'
}

function extendBoundsWithCoordinates(bounds: LngLatBounds, coordinates: unknown): boolean {
  if (isCoordinatePair(coordinates)) {
    bounds.extend([coordinates[0], coordinates[1]])
    return true
  }

  if (!Array.isArray(coordinates)) {
    return false
  }

  return coordinates.reduce((hasExtendedBounds, entry) => {
    return extendBoundsWithCoordinates(bounds, entry) || hasExtendedBounds
  }, false)
}

function getImportedOverlayBounds(featureCollection: ImportedOverlayFeatureCollection) {
  const bounds = new LngLatBounds()

  const hasBounds = featureCollection.features.reduce((hasAnyBounds, feature) => {
    if (!feature || typeof feature !== 'object' || !('geometry' in feature)) {
      return hasAnyBounds
    }

    const geometry = feature.geometry

    if (!geometry || typeof geometry !== 'object' || !('coordinates' in geometry)) {
      return hasAnyBounds
    }

    return extendBoundsWithCoordinates(bounds, geometry.coordinates) || hasAnyBounds
  }, false)

  return hasBounds ? bounds : null
}

function createCircleFeatureCollection(
  center: [number, number],
  radiusMeters: number,
  steps = 64,
): CircleFeatureCollection {
  const [centerLng, centerLat] = center
  const angularDistance = radiusMeters / 6_371_008.8
  const latitudeRadians = (centerLat * Math.PI) / 180
  const longitudeRadians = (centerLng * Math.PI) / 180
  const coordinates: number[][] = []

  for (let index = 0; index <= steps; index += 1) {
    const bearing = (index / steps) * Math.PI * 2
    const sinLatitude = Math.sin(latitudeRadians)
    const cosLatitude = Math.cos(latitudeRadians)
    const sinDistance = Math.sin(angularDistance)
    const cosDistance = Math.cos(angularDistance)
    const latitude = Math.asin(
      sinLatitude * cosDistance + cosLatitude * sinDistance * Math.cos(bearing),
    )
    const longitude = longitudeRadians + Math.atan2(
      Math.sin(bearing) * sinDistance * cosLatitude,
      cosDistance - sinLatitude * Math.sin(latitude),
    )

    coordinates.push([
      (longitude * 180) / Math.PI,
      (latitude * 180) / Math.PI,
    ])
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
        properties: {},
      },
    ],
  }
}

export function ZentraleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const hasFittedInitialBoundsRef = useRef(false)
  const lastImportedOverlayFitKeyRef = useRef<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const {
    posten,
    messageTypes,
    lastHourCounts,
    recentMeldungenByPosten,
    selectedPostenId,
    setSelectedPostenId,
    importedOverlay,
  } = useData()

  const lastHourCountLookup = useMemo(() => {
    return new Map(
      lastHourCounts.map((entry) => [`${entry.postenId}:${entry.typeId}`, entry.count]),
    )
  }, [lastHourCounts])

  const recentMeldungenLookup = useMemo(() => {
    return new Map(
      recentMeldungenByPosten.map((entry) => [entry.postenId, entry.meldungen]),
    )
  }, [recentMeldungenByPosten])

  function getLastHourCount(postenId: number, typeId: number) {
    return lastHourCountLookup.get(`${postenId}:${typeId}`) ?? 0
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false
    const frameId = window.requestAnimationFrame(() => {
      void (async () => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return

        try {
          const style = await loadMapStyle()

          if (cancelled || !mapRef.current || mapInstanceRef.current) return

          const map = new MapLibreMap({
            container: mapRef.current,
            style,
            center: [8.265, 46.786],
            zoom: 10,
            attributionControl: {},
          })

          map.on('load', () => {
            map.addSource(ACTIVE_POSTEN_RADIUS_SOURCE_ID, {
              type: 'geojson',
              data: createEmptyFeatureCollection(),
            })

            map.addSource(IMPORTED_OVERLAY_SOURCE_ID, {
              type: 'geojson',
              data: createEmptyImportedOverlayFeatureCollection() as Parameters<GeoJSONSource['setData']>[0],
            })

            map.addLayer({
              id: ACTIVE_POSTEN_RADIUS_FILL_LAYER_ID,
              type: 'fill',
              source: ACTIVE_POSTEN_RADIUS_SOURCE_ID,
              paint: {
                'fill-color': '#1f2937',
                'fill-opacity': 0.1,
              },
            })

            map.addLayer({
              id: ACTIVE_POSTEN_RADIUS_LINE_LAYER_ID,
              type: 'line',
              source: ACTIVE_POSTEN_RADIUS_SOURCE_ID,
              paint: {
                'line-color': '#111827',
                'line-opacity': 0.45,
                'line-width': 2,
              },
            })

            map.addLayer({
              id: IMPORTED_OVERLAY_FILL_LAYER_ID,
              type: 'fill',
              source: IMPORTED_OVERLAY_SOURCE_ID,
              filter: ['==', ['geometry-type'], 'Polygon'],
              paint: {
                'fill-color': '#0f766e',
                'fill-opacity': 0.16,
              },
            })

            map.addLayer({
              id: IMPORTED_OVERLAY_LINE_LAYER_ID,
              type: 'line',
              source: IMPORTED_OVERLAY_SOURCE_ID,
              filter: ['==', ['geometry-type'], 'LineString'],
              paint: {
                'line-color': '#0f766e',
                'line-width': 3,
                'line-opacity': 0.9,
              },
            })

            map.addLayer({
              id: IMPORTED_OVERLAY_OUTLINE_LAYER_ID,
              type: 'line',
              source: IMPORTED_OVERLAY_SOURCE_ID,
              filter: ['==', ['geometry-type'], 'Polygon'],
              paint: {
                'line-color': '#115e59',
                'line-width': 2,
                'line-opacity': 0.95,
              },
            })

            map.addLayer({
              id: IMPORTED_OVERLAY_POINT_LAYER_ID,
              type: 'circle',
              source: IMPORTED_OVERLAY_SOURCE_ID,
              filter: [
                'all',
                ['==', ['geometry-type'], 'Point'],
                ['!=', ['coalesce', ['get', 'type'], ''], 'annotation'],
              ],
              paint: {
                'circle-radius': 5,
                'circle-color': '#0f766e',
                'circle-stroke-color': '#042f2e',
                'circle-stroke-width': 1.5,
              },
            })

            map.addLayer({
              id: IMPORTED_OVERLAY_LABEL_LAYER_ID,
              type: 'symbol',
              source: IMPORTED_OVERLAY_SOURCE_ID,
              filter: [
                'all',
                ['==', ['geometry-type'], 'Point'],
                [
                  'any',
                  ['has', 'name'],
                  ['has', 'title'],
                  ['has', 'label'],
                  ['==', ['coalesce', ['get', 'type'], ''], 'annotation'],
                ],
              ],
              layout: {
                'text-field': ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ''],
                'text-size': ['*', 12, ['coalesce', ['to-number', ['get', 'label-scale']], 1]],
                'text-font': ['Noto Sans Regular'],
                'text-offset': [0, -1.1],
                'text-anchor': 'top',
                'text-allow-overlap': true,
                'text-ignore-placement': true,
              },
              paint: {
                'text-color': ['coalesce', ['get', 'label-color'], '#111827'],
                'text-opacity': ['coalesce', ['to-number', ['get', 'label-opacity']], 1],
                'text-halo-color': 'rgba(255, 255, 255, 0.9)',
                'text-halo-width': 1.5,
              },
            })

            setMapReady(true)
          })

          map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
          mapInstanceRef.current = map

          resizeObserverRef.current = new ResizeObserver(() => {
            map.resize()
          })
          resizeObserverRef.current.observe(mapRef.current)
        } catch (error) {
          console.error('Failed to initialize map style.', error)
        }
      })()
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
      setMapReady(false)
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      const map = mapInstanceRef.current
      if (map) {
        map.remove()
      }
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    const source = map.getSource(ACTIVE_POSTEN_RADIUS_SOURCE_ID) as GeoJSONSource | undefined
    if (!source) return

    const selectedPosten = posten.find((entry) => entry.id === selectedPostenId)

    if (!selectedPosten) {
      source.setData(createEmptyFeatureCollection())
      return
    }

    const [lng, lat] = swissToWgs84(selectedPosten.coordinates)
    source.setData(
      createCircleFeatureCollection([lng, lat], ACTIVE_POSTEN_RADIUS_METERS),
    )
  }, [mapReady, posten, selectedPostenId])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    const source = map.getSource(IMPORTED_OVERLAY_SOURCE_ID) as GeoJSONSource | undefined
    if (!source) return

    if (!importedOverlay) {
      lastImportedOverlayFitKeyRef.current = null
      source.setData(createEmptyImportedOverlayFeatureCollection() as Parameters<GeoJSONSource['setData']>[0])
      return
    }

    source.setData(importedOverlay.data as Parameters<GeoJSONSource['setData']>[0])

    const fitKey = `${importedOverlay.fileName}:${importedOverlay.uploadedAt}`

    if (lastImportedOverlayFitKeyRef.current === fitKey) {
      return
    }

    const bounds = getImportedOverlayBounds(importedOverlay.data)

    if (!bounds) {
      return
    }

    lastImportedOverlayFitKeyRef.current = fitKey
    map.fitBounds(bounds, {
      padding: 56,
      maxZoom: 14,
      duration: 0,
    })
  }, [importedOverlay, mapReady])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const typesWithMinimum = messageTypes.filter((type) => type.minPerHour > 0)
    const bounds = new LngLatBounds()
    let hasBounds = false

    posten.forEach((p: Posten) => {
      const postenMeldungen = recentMeldungenLookup.get(p.id) ?? []
      const isSelected = selectedPostenId === p.id

      // Determine status based on per-type minimums
      let status: 'ok' | 'warning' | 'none'
      if (typesWithMinimum.length === 0) {
        status = postenMeldungen.length > 0 ? 'ok' : 'none'
      } else {
        const allFulfilled = typesWithMinimum.every((type) => {
          const count = getLastHourCount(p.id, type.id)
          return count >= type.minPerHour
        })
        status = allFulfilled ? 'ok' : 'warning'
      }

      const [lng, lat] = swissToWgs84(p.coordinates)
      const markerElement = createPostenIcon(status, isSelected)

      bounds.extend([lng, lat])
      hasBounds = true

      const statusRows = typesWithMinimum.map((type) => ({
        id: type.id,
        name: type.name,
        count: getLastHourCount(p.id, type.id),
        minPerHour: type.minPerHour,
      }))

      const popupMarkup = renderToStaticMarkup(
        <PostenPopupContent
          posten={p}
          statusRows={statusRows}
          recentMeldungen={postenMeldungen}
          getTypeName={(typeId) =>
            messageTypes.find((entry) => entry.id === typeId)?.name || '?'
          }
        />
      )

      const popup = new Popup({
        closeButton: true,
        className: 'custom-popup',
        maxWidth: '320px',
      })
        .setHTML(popupMarkup)

      const marker = new Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      markerElement.addEventListener('click', () => {
        setSelectedPostenId(p.id)
      })

      if (isSelected) {
        marker.togglePopup()
      }

      markersRef.current.push(marker)
    })

    if (hasBounds && !hasFittedInitialBoundsRef.current) {
      hasFittedInitialBoundsRef.current = true

      if (posten.length === 1) {
        const [lng, lat] = swissToWgs84(posten[0].coordinates)
        map.jumpTo({ center: [lng, lat], zoom: 13 })
      } else {
        map.fitBounds(bounds, {
          padding: 40,
          maxZoom: 13,
          duration: 0,
        })
      }
    }
  }, [lastHourCountLookup, mapReady, messageTypes, posten, recentMeldungenLookup, selectedPostenId, setSelectedPostenId])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <style jsx global>{`
        .maplibregl-canvas {
          cursor: default;
        }
        .custom-popup .maplibregl-popup-content {
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          border: 1px solid #ccc;
          border-radius: 0;
          margin: 0;
          padding: 8px 10px;
        }
        .custom-popup .maplibregl-popup-tip {
          border-top-color: #ccc;
        }
        .custom-popup .maplibregl-popup-close-button {
          top: 0;
          right: 0;
          width: 28px;
          height: 28px;
          font-size: 18px;
          line-height: 28px;
          color: #444;
        }
        .custom-popup .maplibregl-popup-close-button:hover {
          background: transparent;
          color: #000;
        }
        .custom-posten-marker {
          appearance: none;
          outline: none;
        }
        .custom-posten-marker:focus-visible {
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
        }
        .maplibregl-ctrl-group {
          border: 1px solid #ccc !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .maplibregl-ctrl button {
          border-radius: 0 !important;
          border-bottom: 1px solid #ccc !important;
          font-family: monospace !important;
        }
      `}</style>
    </div>
  )
}
