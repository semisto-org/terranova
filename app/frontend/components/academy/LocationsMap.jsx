import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Users, Home, Pencil, Trash2 } from 'lucide-react'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

/**
 * LocationsMap — An immersive Leaflet map for Academy training locations.
 *
 * Uses vanilla Leaflet (not react-leaflet) for maximum control over
 * custom markers, popups, and animations. The map tiles come from
 * OpenStreetMap via a beautiful Stamen-style or CartoDB layer.
 */

const ACADEMY_RED = '#B01A19'
const ACADEMY_RED_LIGHT = '#eac7b8'

// Default center: Belgium (Wallonia) — heart of Semisto
const DEFAULT_CENTER = [50.35, 4.85]
const DEFAULT_ZOOM = 8

function createCustomIcon(L, location) {
  const hasCoords = location.latitude !== 0 || location.longitude !== 0
  const color = hasCoords ? ACADEMY_RED : '#94a3b8'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none">
      <defs>
        <filter id="shadow-${location.id}" x="-4" y="-2" width="44" height="54" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow-${location.id})">
        <path d="M18 3C10.268 3 4 9.268 4 17c0 9.75 14 26 14 26s14-16.25 14-26c0-7.732-6.268-14-14-14z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="18" cy="16" r="5" fill="white" opacity="0.95"/>
      </g>
    </svg>
  `

  return L.divIcon({
    html: svg,
    className: 'location-marker',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -42],
  })
}

function buildPopupContent(location, actions) {
  const accommodationBadge = location.hasAccommodation
    ? `<div style="display:inline-flex;align-items:center;gap:4px;background:#ecfdf5;color:#047857;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:600;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Hébergement
       </div>`
    : ''

  const description = location.description
    ? `<p style="margin:0 0 12px;color:#57534e;font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${location.description}</p>`
    : ''

  return `
    <div style="min-width:260px;max-width:320px;font-family:Inter,system-ui,sans-serif;">
      <div style="padding:16px 18px 14px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <h3 style="margin:0;font-size:17px;font-weight:700;color:#1c1917;line-height:1.3;letter-spacing:-0.01em;">${location.name}</h3>
        </div>
        ${location.address ? `<p style="margin:0 0 10px;display:flex;align-items:center;gap:5px;color:#78716c;font-size:12.5px;line-height:1.4;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          ${location.address}
        </p>` : ''}
        ${description}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
          <div style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f4;color:#44403c;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ${location.capacity} personnes
          </div>
          ${accommodationBadge}
        </div>
        <div style="border-top:1px solid #e7e5e4;padding-top:12px;">
          <button data-action="edit" data-id="${location.id}" style="width:100%;padding:7px 0;border:1px solid #d6d3d1;border-radius:10px;background:white;color:#44403c;font-size:12.5px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;">
            Modifier
          </button>
        </div>
      </div>
    </div>
  `
}

export default function LocationsMap({ locations, actions, onCreateLocation }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const requestDelete = useCallback((id) => {
    const location = locations.find((l) => l.id === id)
    setDeleteConfirm({ id, name: location?.name || 'ce lieu' })
  }, [locations])

  // Initialize map
  useEffect(() => {
    let L
    let map

    async function initMap() {
      if (!mapRef.current) return

      L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      if (!mapRef.current) return

      map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      })

      // CartoDB Voyager — beautiful, clean, modern tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      // Custom zoom control — French labels
      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom avant', zoomOutTitle: 'Zoom arrière' }).addTo(map)

      // Subtle attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" style="color:#78716c">OSM</a> &copy; <a href="https://carto.com/" style="color:#78716c">CARTO</a>')
        .addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when locations change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    async function updateMarkers() {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current

      // Clear existing markers
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      const validLocations = locations.filter(
        (loc) => loc.latitude !== 0 || loc.longitude !== 0
      )

      if (validLocations.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }

      validLocations.forEach((location) => {
        const icon = createCustomIcon(L, location)
        const marker = L.marker([location.latitude, location.longitude], { icon })
          .addTo(map)

        const popup = L.popup({
          closeButton: true,
          className: 'location-popup',
          maxWidth: 340,
          minWidth: 260,
          offset: [0, -6],
          autoPan: true,
          autoPanPadding: [40, 40],
        }).setContent(buildPopupContent(location, actions))

        marker.bindPopup(popup)

        // Handle popup button clicks via event delegation
        marker.on('popupopen', () => {
          const container = popup.getElement()
          if (!container) return

          container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]')
            if (!btn) return
            const action = btn.dataset.action
            const id = btn.dataset.id
            if (action === 'edit') actions.editLocation(id)
            if (action === 'delete') requestDelete(id)
          })
        })

        markersRef.current.push(marker)
      })

      // Fit bounds with padding
      if (validLocations.length === 1) {
        map.setView(
          [validLocations[0].latitude, validLocations[0].longitude],
          13,
          { animate: true }
        )
      } else {
        const bounds = L.latLngBounds(
          validLocations.map((loc) => [loc.latitude, loc.longitude])
        )
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true })
      }
    }

    updateMarkers()
  }, [locations, mapReady, actions])

  const locationsWithCoords = locations.filter(
    (loc) => loc.latitude !== 0 || loc.longitude !== 0
  )
  const locationsWithoutCoords = locations.filter(
    (loc) => loc.latitude === 0 && loc.longitude === 0
  )

  return (
    <>
      <style>{`
        .location-marker {
          background: none !important;
          border: none !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .location-marker:hover {
          transform: scale(1.15) translateY(-3px);
          z-index: 10000 !important;
        }
        .location-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
          padding: 0 !important;
          overflow: hidden;
          border: none !important;
        }
        .location-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .location-popup .leaflet-popup-tip-container {
          display: none;
        }
        .location-popup .leaflet-popup-close-button {
          top: 10px !important;
          right: 10px !important;
          width: 28px !important;
          height: 28px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.9) !important;
          backdrop-filter: blur(8px);
          border-radius: 8px !important;
          font-size: 18px !important;
          color: #78716c !important;
          transition: all 0.15s !important;
          z-index: 10 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }
        .location-popup .leaflet-popup-close-button:hover {
          background: #f5f5f4 !important;
          color: #1c1917 !important;
        }
        .location-popup [data-action="edit"]:hover {
          background: #f5f5f4 !important;
          border-color: #a8a29e !important;
        }
        .location-popup [data-action="delete"]:hover {
          background: #fecaca !important;
          border-color: #f87171 !important;
        }

        @keyframes mapFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">
              Lieux de formation
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              {locations.length} lieu{locations.length !== 1 ? 'x' : ''}
            </p>
          </div>
          <button
            className="group relative overflow-hidden rounded-xl bg-[#B01A19] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#8f1514] hover:shadow-lg hover:shadow-[#B01A19]/20 active:scale-[0.98]"
            onClick={onCreateLocation}
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau lieu
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#B01A19] to-[#8f1514] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>

        {/* Map container */}
        <div
          className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm"
          style={{ animation: 'mapFadeIn 0.6s ease-out' }}
        >
          {/* Decorative top gradient bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 z-[2]"
            style={{
              background: `linear-gradient(90deg, ${ACADEMY_RED}, ${ACADEMY_RED_LIGHT}, ${ACADEMY_RED})`,
            }}
          />

          <div
            ref={mapRef}
            className="w-full"
            style={{ height: '520px', zIndex: 1 }}
          />

          {/* Empty state overlay */}
          {locations.length === 0 && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-stone-50/80 backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-white p-5 shadow-lg shadow-stone-200/50">
                <svg className="h-10 w-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-stone-700">Aucun lieu de formation</p>
              <p className="mt-1 text-sm text-stone-500">Ajoutez votre premier lieu pour le voir sur la carte</p>
              <button
                onClick={onCreateLocation}
                className="mt-5 rounded-xl bg-[#B01A19] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#8f1514] hover:shadow-md active:scale-[0.98]"
              >
                Ajouter un lieu
              </button>
            </div>
          )}

          {/* No-coords overlay when all locations lack coordinates */}
          {locations.length > 0 && locationsWithCoords.length === 0 && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-stone-50/80 backdrop-blur-sm">
              <div className="mb-4 rounded-full bg-white p-5 shadow-lg shadow-stone-200/50">
                <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-stone-700">Coordonnées manquantes</p>
              <p className="mt-1 text-sm text-stone-500 text-center max-w-xs">
                Modifiez vos lieux pour ajouter leurs coordonnées GPS et les afficher sur la carte
              </p>
            </div>
          )}
        </div>

        {/* Locations without coordinates — sidebar list */}
        {locationsWithoutCoords.length > 0 && locationsWithCoords.length > 0 && (
          <div
            className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5"
            style={{ animation: 'slideUp 0.4s ease-out 0.3s both' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-semibold text-amber-800">
                {locationsWithoutCoords.length} lieu{locationsWithoutCoords.length !== 1 ? 'x' : ''} sans coordonnées
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {locationsWithoutCoords.map((loc, index) => (
                <button
                  key={loc.id}
                  onClick={() => actions.editLocation(loc.id)}
                  className="group flex items-center gap-3 rounded-xl border border-amber-200/60 bg-white/80 p-3 text-left transition-all hover:border-amber-300 hover:bg-white hover:shadow-sm active:scale-[0.99]"
                  style={{ animation: `slideUp 0.3s ease-out ${0.1 + index * 0.05}s both` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">{loc.name}</p>
                    <p className="text-xs text-stone-500 truncate">{loc.address || 'Aucune adresse'}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table of all locations */}
        {locations.length > 0 && (
          <div
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}
          >
            <div
              className="h-1 w-full shrink-0"
              style={{
                background: `linear-gradient(90deg, ${ACADEMY_RED}, ${ACADEMY_RED_LIGHT}, ${ACADEMY_RED})`,
              }}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80">
                    <th className="px-5 py-3.5 font-semibold text-stone-700">Lieu</th>
                    <th className="px-5 py-3.5 font-semibold text-stone-700">Capacité</th>
                    <th className="px-5 py-3.5 font-semibold text-stone-700">Hébergement</th>
                    <th className="px-5 py-3.5 font-semibold text-stone-700 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => {
                    return (
                      <tr
                        key={loc.id}
                        className="border-b border-stone-100 transition-colors hover:bg-stone-50/60 last:border-b-0"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-stone-900">{loc.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-stone-600">
                            <Users className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                            {loc.capacity ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {loc.hasAccommodation ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <Home className="h-3.5 w-3.5" />
                              Oui
                            </span>
                          ) : (
                            <span className="text-stone-400">Non</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => actions.editLocation(loc.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(loc.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <ConfirmDeleteModal
            title="Supprimer ce lieu ?"
            message={`Le lieu « ${deleteConfirm.name} » sera supprimé définitivement.`}
            onConfirm={() => {
              actions.deleteLocation(deleteConfirm.id)
              setDeleteConfirm(null)
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </section>
    </>
  )
}
