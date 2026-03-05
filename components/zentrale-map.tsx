'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useData } from '@/lib/data-context'
import type { Posten, Nachricht } from '@/lib/store'

function getMessagesLastHour(
  postenId: string,
  nachrichten: { postenId: string; erstelltAm: string }[]
) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return nachrichten.filter(
    (n) => n.postenId === postenId && new Date(n.erstelltAm).getTime() > oneHourAgo
  ).length
}

function createPostenIcon(status: 'ok' | 'warning' | 'none', isSelected: boolean) {
  const size = isSelected ? 16 : 12
  // ok = dark fill, warning = red outline, none = gray
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

  return L.divIcon({
    className: 'custom-posten-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      border: ${border};
      box-sizing: border-box;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
}

export function ZentraleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const {
    posten,
    nachrichten,
    nachrichtentypen,
    selectedPostenId,
    setSelectedPostenId,
  } = useData()

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    const map = L.map(mapRef.current, {
      center: [46.95, 7.45],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    })

    // Use a grayscale/minimal tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    leafletMapRef.current = map

    return () => {
      map.remove()
      leafletMapRef.current = null
    }
  }, [])

  // Update markers
  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    posten.forEach((p: Posten) => {
      const postenNachrichten = nachrichten.filter(
        (n: Nachricht) => n.postenId === p.id
      )
      const msgsLastHour = getMessagesLastHour(p.id, nachrichten)
      const isSelected = selectedPostenId === p.id

      let status: 'ok' | 'warning' | 'none'
      if (p.minNachrichtenProStunde === 0) {
        status = postenNachrichten.length > 0 ? 'ok' : 'none'
      } else if (msgsLastHour >= p.minNachrichtenProStunde) {
        status = 'ok'
      } else {
        status = 'warning'
      }

      const icon = createPostenIcon(status, isSelected)
      const marker = L.marker([p.coordinates.lat, p.coordinates.lng], {
        icon,
      }).addTo(map)

      // Build popup content
      const statusLabel =
        status === 'ok'
          ? `<span style="color: #333;">&#10003; ${msgsLastHour}/${p.minNachrichtenProStunde} N/h</span>`
          : status === 'warning'
            ? `<span style="color: #c44;">&#9888; ${msgsLastHour}/${p.minNachrichtenProStunde} N/h</span>`
            : `<span style="color: #999;">${msgsLastHour} N/h</span>`

      let popupContent = `<div style="font-family: monospace; font-size: 12px; min-width: 180px; padding: 4px 0;">
        <div style="font-weight: 700; font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>${p.name}</span>
          ${statusLabel}
        </div>
        <div style="color: #666; font-size: 11px; margin-bottom: 4px;">${p.coordinates.lat.toFixed(4)}, ${p.coordinates.lng.toFixed(4)}</div>`

      if (p.kommentar) {
        popupContent += `<div style="color: #444; font-size: 11px; margin-bottom: 6px;">${p.kommentar}</div>`
      }

      if (postenNachrichten.length > 0) {
        popupContent += `<div style="border-top: 1px solid #eee; padding-top: 4px; font-size: 11px; color: #666;">Letzte Nachrichten:</div>`
        postenNachrichten.slice(0, 3).forEach((n: Nachricht) => {
          const typ = nachrichtentypen.find(
            (t) => t.id === n.nachrichtentypId
          )
          const wertStr = n.werte
            .map((w) => `${w.kategorieName}: ${w.wert}`)
            .join(' | ')
          popupContent += `<div style="font-size: 11px; padding: 2px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="font-weight: 600;">${typ?.name || '?'}</span> 
            <span style="color: #888;">${formatTime(n.erstelltAm)}</span><br/>
            <span style="color: #555;">${wertStr}</span>
          </div>`
        })
      } else {
        popupContent += `<div style="font-size: 11px; color: #999; padding-top: 4px;">Keine Nachrichten</div>`
      }

      popupContent += `</div>`

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-popup',
      })

      marker.on('click', () => {
        setSelectedPostenId(p.id)
      })

      markersRef.current.push(marker)
    })
  }, [posten, nachrichten, nachrichtentypen, selectedPostenId, setSelectedPostenId])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 0;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          border: 1px solid #ccc;
          padding: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 8px 10px;
        }
        .custom-popup .leaflet-popup-tip {
          display: none;
        }
        .custom-posten-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #ccc !important;
          border-radius: 0 !important;
        }
        .leaflet-control-zoom a {
          border-radius: 0 !important;
          border-bottom: 1px solid #ccc !important;
          font-family: monospace !important;
        }
      `}</style>
    </div>
  )
}
