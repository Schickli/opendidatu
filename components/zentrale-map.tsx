'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import { useEffect, useRef, useState } from 'react'
import {
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
import type { Posten, Meldung } from '@/lib/store'
import { PostenPopupContent } from './posten-popup-content'

function getMeldungenLastHourByTyp(
  postenId: string,
  typeId: string,
  meldungen: {
    postenId: string
    typeId: string
    createdAt: string
    isValid: boolean
  }[]
) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return meldungen.filter(
    (n) =>
      n.isValid &&
      n.postenId === postenId &&
      n.typeId === typeId &&
      new Date(n.createdAt).getTime() > oneHourAgo
  ).length
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

export function ZentraleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const hasFittedInitialBoundsRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const {
    posten,
    meldungen,
    messageTypes,
    selectedPostenId,
    setSelectedPostenId,
  } = useData()

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return

      const map = new MapLibreMap({
        container: mapRef.current,
        style: 'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json',
        center: [8.265, 46.786],
        zoom: 10,
        attributionControl: {},
      })

      map.on('load', () => {
        setMapReady(true)
      })

      map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
      mapInstanceRef.current = map

      resizeObserverRef.current = new ResizeObserver(() => {
        map.resize()
      })
      resizeObserverRef.current.observe(mapRef.current)
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

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const typesWithMinimum = messageTypes.filter((type) => type.minPerHour > 0)
    const bounds = new LngLatBounds()
    let hasBounds = false

    posten.forEach((p: Posten) => {
      const postenMeldungen = meldungen.filter(
        (n: Meldung) => n.postenId === p.id
      )
      const isSelected = selectedPostenId === p.id

      // Determine status based on per-type minimums
      let status: 'ok' | 'warning' | 'none'
      if (typesWithMinimum.length === 0) {
        status = postenMeldungen.length > 0 ? 'ok' : 'none'
      } else {
        const allFulfilled = typesWithMinimum.every((type) => {
          const count = getMeldungenLastHourByTyp(p.id, type.id, meldungen)
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
        count: getMeldungenLastHourByTyp(p.id, type.id, meldungen),
        minPerHour: type.minPerHour,
      }))

      const popupMarkup = renderToStaticMarkup(
        <PostenPopupContent
          posten={p}
          statusRows={statusRows}
          recentMeldungen={postenMeldungen.slice(0, 3)}
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
  }, [mapReady, posten, meldungen, messageTypes, selectedPostenId, setSelectedPostenId])

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
