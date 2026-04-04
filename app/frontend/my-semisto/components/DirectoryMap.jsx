import React, { useEffect, useRef, useState } from 'react'

/**
 * DirectoryMap — Leaflet map for the Semisto directory.
 * Follows the same vanilla-Leaflet pattern as LocationsMap.
 */

const SEMISTO_GREEN = '#2D6A4F'
const DEFAULT_CENTER = [50.35, 4.85] // Belgium (Wallonia)
const DEFAULT_ZOOM = 8

const AVATAR_COLORS = [
  '#2D6A4F', '#5B5781', '#B01A19', '#234766', '#EF9B0D',
  '#1B4332', '#7a8500', '#b27308', '#6B4226', '#4A6741'
]

function hashColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function createContactIcon(L, contact) {
  const color = hashColor(contact.name)
  const initials = getInitials(contact.name)

  if (contact.avatarUrl) {
    const html = `
      <div class="directory-marker-wrapper" style="position:relative;width:44px;height:52px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52" fill="none" style="position:absolute;top:0;left:0;">
          <defs>
            <filter id="ds-${contact.id}" x="-2" y="0" width="48" height="56" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.3"/>
            </filter>
          </defs>
          <g filter="url(#ds-${contact.id})">
            <path d="M22 4C13.163 4 6 11.163 6 20c0 11 16 28 16 28s16-17 16-28c0-8.837-7.163-16-16-16z" fill="${color}" stroke="white" stroke-width="2.5"/>
          </g>
        </svg>
        <img src="${contact.avatarUrl}" style="position:absolute;top:7px;left:10px;width:24px;height:24px;border-radius:50%;object-fit:cover;border:2px solid white;" />
      </div>
    `
    return L.divIcon({
      html,
      className: 'directory-marker',
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -46],
    })
  }

  const html = `
    <div class="directory-marker-wrapper" style="position:relative;width:44px;height:52px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52" fill="none" style="position:absolute;top:0;left:0;">
        <defs>
          <filter id="ds-${contact.id}" x="-2" y="0" width="48" height="56" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#ds-${contact.id})">
          <path d="M22 4C13.163 4 6 11.163 6 20c0 11 16 28 16 28s16-17 16-28c0-8.837-7.163-16-16-16z" fill="${color}" stroke="white" stroke-width="2.5"/>
        </g>
      </svg>
      <span style="position:absolute;top:9px;left:0;width:44px;text-align:center;font-size:13px;font-weight:700;color:white;line-height:1;pointer-events:none;">${initials}</span>
    </div>
  `
  return L.divIcon({
    html,
    className: 'directory-marker',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -46],
  })
}

function buildContactPopup(contact) {
  const expertiseTags = (contact.expertise || []).slice(0, 3).map((tag) =>
    `<span style="display:inline-flex;align-items:center;gap:3px;background:#2D6A4F12;color:#2D6A4F;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;">${tag}</span>`
  ).join('')

  const remaining = (contact.expertise || []).length - 3
  const moreTag = remaining > 0
    ? `<span style="font-size:11px;color:#a8a29e;padding:2px 4px;">+${remaining}</span>`
    : ''

  return `
    <div style="min-width:220px;max-width:280px;font-family:Inter,system-ui,sans-serif;padding:14px 16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        ${contact.avatarUrl
          ? `<img src="${contact.avatarUrl}" style="width:40px;height:40px;border-radius:12px;object-fit:cover;flex-shrink:0;" />`
          : `<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:${hashColor(contact.name)};color:white;font-weight:700;font-size:15px;flex-shrink:0;">${getInitials(contact.name)}</div>`
        }
        <div style="min-width:0;flex:1;">
          <div style="font-size:15px;font-weight:700;color:#1c1917;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${contact.name}</div>
          ${contact.city ? `<div style="display:flex;align-items:center;gap:3px;font-size:12px;color:#78716c;margin-top:1px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ${contact.city}
          </div>` : ''}
        </div>
      </div>
      ${contact.bio ? `<p style="margin:0 0 8px;font-size:12.5px;color:#57534e;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${contact.bio}</p>` : ''}
      ${expertiseTags ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${expertiseTags}${moreTag}</div>` : ''}
      <button data-contact-id="${contact.id}" style="margin-top:10px;width:100%;padding:7px 0;border:1px solid #d6d3d1;border-radius:10px;background:white;color:#44403c;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s;">
        Voir le profil
      </button>
    </div>
  `
}

export default function DirectoryMap({ contacts, onContactClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    async function initMap() {
      if (!mapRef.current) return

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom avant', zoomOutTitle: 'Zoom arriere' }).addTo(map)

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

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    async function updateMarkers() {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current

      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      const geoContacts = contacts.filter(
        (c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)
      )

      if (geoContacts.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }

      geoContacts.forEach((contact) => {
        const icon = createContactIcon(L, contact)
        const marker = L.marker([contact.latitude, contact.longitude], { icon }).addTo(map)

        const popup = L.popup({
          closeButton: true,
          className: 'directory-popup',
          maxWidth: 300,
          minWidth: 220,
          offset: [0, -6],
          autoPan: true,
          autoPanPadding: [40, 40],
        }).setContent(buildContactPopup(contact))

        marker.bindPopup(popup)

        marker.on('popupopen', () => {
          const container = popup.getElement()
          if (!container) return
          container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-contact-id]')
            if (!btn) return
            const id = btn.dataset.contactId
            const c = contacts.find((ct) => ct.id === id)
            if (c && onContactClick) onContactClick(c)
          })
        })

        markersRef.current.push(marker)
      })

      if (geoContacts.length === 1) {
        map.setView([geoContacts[0].latitude, geoContacts[0].longitude], 12, { animate: true })
      } else {
        const bounds = L.latLngBounds(geoContacts.map((c) => [c.latitude, c.longitude]))
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true })
      }
    }

    updateMarkers()
  }, [contacts, mapReady, onContactClick])

  const geoCount = contacts.filter(
    (c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)
  ).length

  return (
    <>
      <style>{`
        .directory-marker {
          background: none !important;
          border: none !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .directory-marker:hover {
          transform: scale(1.15) translateY(-3px);
          z-index: 10000 !important;
        }
        .directory-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
          padding: 0 !important;
          overflow: hidden;
          border: none !important;
        }
        .directory-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .directory-popup .leaflet-popup-tip-container {
          display: none;
        }
        .directory-popup .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          width: 26px !important;
          height: 26px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.9) !important;
          backdrop-filter: blur(8px);
          border-radius: 8px !important;
          font-size: 16px !important;
          color: #78716c !important;
          transition: all 0.15s !important;
          z-index: 10 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }
        .directory-popup .leaflet-popup-close-button:hover {
          background: #f5f5f4 !important;
          color: #1c1917 !important;
        }
        .directory-popup [data-contact-id]:hover {
          background: #f5f5f4 !important;
          border-color: #a8a29e !important;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
        {/* Green accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-[2]"
          style={{ background: `linear-gradient(90deg, ${SEMISTO_GREEN}, #1B4332, ${SEMISTO_GREEN})` }}
        />

        <div
          ref={mapRef}
          className="w-full"
          style={{ height: '520px', zIndex: 1 }}
        />

        {/* Counter badge */}
        <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-stone-200/50">
          <span className="text-xs font-medium text-stone-600">
            {geoCount} membre{geoCount !== 1 ? 's' : ''} sur la carte
          </span>
        </div>

        {/* Empty state */}
        {geoCount === 0 && contacts.length > 0 && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-stone-50/80 backdrop-blur-sm">
            <div className="mb-4 rounded-full bg-white p-5 shadow-lg shadow-stone-200/50">
              <svg className="h-10 w-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-stone-700">Aucune localisation renseignee</p>
            <p className="mt-1 text-sm text-stone-500 text-center max-w-xs">
              Les membres apparaitront ici une fois qu'ils auront renseigne leur localisation dans leur profil
            </p>
          </div>
        )}
      </div>
    </>
  )
}
