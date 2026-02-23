import { useEffect, useRef, useState } from 'react'
import type { Project } from '../types'

const DESIGN_GREEN = '#AFBD00'
const DEFAULT_CENTER: [number, number] = [50.35, 4.85]
const DEFAULT_ZOOM = 8

function createProjectIcon(L: typeof import('leaflet').default, color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none">
      <defs>
        <filter id="project-shadow" x="-4" y="-2" width="44" height="54" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#project-shadow)">
        <path d="M18 3C10.268 3 4 9.268 4 17c0 9.75 14 26 14 26s14-16.25 14-26c0-7.732-6.268-14-14-14z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="18" cy="16" r="5" fill="white" opacity="0.95"/>
      </g>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'project-marker',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -42],
  })
}

function buildPopupContent(project: Project, onViewProject?: (id: string) => void) {
  const locality = project.city || project.address || '—'
  const area = project.area > 0 ? `${project.area} m²` : '—'
  const client = project.clientName || '—'

  const viewBtn = onViewProject
    ? `<button data-action="view" data-id="${project.id}" style="width:100%;padding:7px 0;border:none;border-radius:10px;background:#AFBD00;color:#1c1917;font-size:12.5px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;">
        Voir le projet
      </button>`
    : ''

  return `
    <div style="min-width:240px;max-width:300px;font-family:Inter,system-ui,sans-serif;">
      <div style="padding:16px 18px 14px;">
        <h3 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1c1917;line-height:1.3;">${project.name}</h3>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
          <p style="margin:0;display:flex;align-items:center;gap:5px;color:#78716c;font-size:12.5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
            ${locality}
          </p>
          <p style="margin:0;display:flex;align-items:center;gap:5px;color:#78716c;font-size:12.5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/></svg>
            ${area}
          </p>
          <p style="margin:0;display:flex;align-items:center;gap:5px;color:#78716c;font-size:12.5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M4 18a2 2 0 00-2 2v2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2"/></svg>
            ${client}
          </p>
        </div>
        ${viewBtn ? `<div style="border-top:1px solid #e7e5e4;padding-top:12px;">${viewBtn}</div>` : ''}
      </div>
    </div>
  `
}

interface ProjectsMapProps {
  projects: Project[]
  onViewProject?: (id: string) => void
}

export function ProjectsMap({ projects, onViewProject }: ProjectsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  const projectsWithCoords = projects.filter(
    (p) => p.coordinates && (p.coordinates.lat !== 0 || p.coordinates.lng !== 0)
  )

  useEffect(() => {
    let L: typeof import('leaflet').default

    async function initMap() {
      if (!mapRef.current) return

      L = (await import('leaflet')).default
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

      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Zoom avant', zoomOutTitle: 'Zoom arrière' }).addTo(map)
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

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    const valid = projects.filter(
      (p) => p.coordinates && (p.coordinates.lat !== 0 || p.coordinates.lng !== 0)
    )

    async function updateMarkers() {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current!
      const icon = createProjectIcon(L, DESIGN_GREEN)

      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      if (valid.length === 0) {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
        return
      }

      valid.forEach((project) => {
        const { lat, lng } = project.coordinates
        const marker = L.marker([lat, lng], { icon }).addTo(map)

        const popup = L.popup({
          closeButton: true,
          className: 'project-popup',
          maxWidth: 340,
          minWidth: 240,
          offset: [0, -6],
          autoPan: true,
          autoPanPadding: [40, 40],
        }).setContent(buildPopupContent(project, onViewProject))

        marker.bindPopup(popup)

        marker.on('popupopen', () => {
          const container = popup.getElement()
          if (!container || !onViewProject) return

          container.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('[data-action]')
            if (!btn) return
            const action = (btn as HTMLElement).dataset.action
            const id = (btn as HTMLElement).dataset.id
            if (action === 'view' && id) onViewProject(id)
          })
        })

        markersRef.current.push(marker)
      })

      if (valid.length === 1) {
        map.setView([valid[0].coordinates.lat, valid[0].coordinates.lng], 13, { animate: true })
      } else {
        const bounds = L.latLngBounds(
          valid.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number])
        )
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true })
      }
    }

    updateMarkers()
  }, [projects, mapReady, onViewProject])

  return (
    <>
      <style>{`
        .project-marker {
          background: none !important;
          border: none !important;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .project-marker:hover {
          transform: scale(1.15) translateY(-3px);
          z-index: 10000 !important;
        }
        .project-popup .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
          padding: 0 !important;
          overflow: hidden;
          border: none !important;
        }
        .project-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .project-popup .leaflet-popup-tip-container {
          display: none;
        }
        .project-popup .leaflet-popup-close-button {
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
        .project-popup .leaflet-popup-close-button:hover {
          background: #f5f5f4 !important;
          color: #1c1917 !important;
        }
        .project-popup [data-action="view"]:hover {
          background: #9BAA00 !important;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
        <div
          className="absolute top-0 left-0 right-0 h-1 z-[2]"
          style={{ background: `linear-gradient(90deg, ${DESIGN_GREEN}, #e1e6d8, ${DESIGN_GREEN})` }}
        />
        <div
          ref={mapRef}
          className="w-full"
          style={{ height: '360px', zIndex: 1 }}
        />
        {projectsWithCoords.length === 0 && projects.length > 0 && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-stone-50/80 backdrop-blur-sm">
            <div className="mb-4 rounded-full bg-white p-5 shadow-lg shadow-stone-200/50">
              <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-stone-700">Aucun projet géolocalisé</p>
            <p className="mt-1 text-sm text-stone-500 text-center max-w-xs">
              Modifiez vos projets pour ajouter leurs coordonnées GPS
            </p>
          </div>
        )}
      </div>
    </>
  )
}
