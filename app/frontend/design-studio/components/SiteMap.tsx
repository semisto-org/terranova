import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { apiRequest } from '../../lib/api'

const NODE_KEY = 'analyse-evaluation/cartographie-du-site'
const DEFAULT_CENTER: [number, number] = [50.35, 4.85]

const SECTEURS = ['Ensoleillement', 'Vent', 'Pente', 'Faune', 'Vues / intimité', 'Nuisances', 'Pollutions']
const ZONES = ['Zone 0', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Pôle', 'Flux']
const LAYER_COLOR: Record<string, string> = { secteur: '#EF9B0D', zone: '#234766' }

interface MapMarker {
  id: string
  lat: number
  lng: number
  layer: 'secteur' | 'zone'
  category: string
  note: string
}

function pinIcon(L: typeof import('leaflet').default, color: string, label: string) {
  return L.divIcon({
    html: `<div style="background:${color};color:white;border:2px solid white;border-radius:50% 50% 50% 0;width:26px;height:26px;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
             <span style="transform:rotate(45deg);font-size:10px;font-weight:700;">${label}</span>
           </div>`,
    className: 'site-map-pin',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

export function SiteMap({ projectId, coordinates }: { projectId: string; coordinates?: { lat: number; lng: number } }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<import('leaflet').Map | null>(null)
  const layerGroup = useRef<import('leaflet').LayerGroup | null>(null)
  const Lref = useRef<typeof import('leaflet').default | null>(null)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [ready, setReady] = useState(false)

  // L'écouteur de clic capture l'état initial — on lit via des refs pour rester à jour.
  const layerSel = useRef<'secteur' | 'zone'>('secteur')
  const categorySel = useRef<string>(SECTEURS[0])
  const [, forceRerender] = useState(0)

  const save = useCallback(
    (next: MapMarker[]) => {
      setMarkers(next)
      apiRequest(`/api/v1/design/${projectId}/analysis-section`, {
        method: 'PATCH',
        body: JSON.stringify({ node_key: NODE_KEY, data: { markers: next } }),
      }).catch(() => {})
    },
    [projectId],
  )

  const markersRef = useRef<MapMarker[]>([])
  markersRef.current = markers

  // Init carte (une fois).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !mapRef.current || mapInstance.current) return
      Lref.current = L
      const center: [number, number] =
        coordinates && (coordinates.lat || coordinates.lng) ? [coordinates.lat, coordinates.lng] : DEFAULT_CENTER
      const map = L.map(mapRef.current, { center, zoom: coordinates?.lat ? 17 : 9, scrollWheelZoom: false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 20,
      }).addTo(map)
      layerGroup.current = L.layerGroup().addTo(map)
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const m: MapMarker = {
          id: `${Date.now()}-${Math.round(performance.now())}`,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          layer: layerSel.current,
          category: categorySel.current,
          note: '',
        }
        save([...markersRef.current, m])
      })
      mapInstance.current = map
      setReady(true)
    })()
    return () => {
      cancelled = true
      mapInstance.current?.remove()
      mapInstance.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Charge les marqueurs existants.
  useEffect(() => {
    apiRequest(`/api/v1/design/${projectId}/analysis-sections`)
      .then((map) => setMarkers((map[NODE_KEY]?.markers as MapMarker[]) ?? []))
      .catch(() => {})
  }, [projectId])

  // Redessine les marqueurs quand ils changent.
  useEffect(() => {
    const L = Lref.current
    if (!ready || !L || !layerGroup.current) return
    layerGroup.current.clearLayers()
    markers.forEach((m) => {
      const label = m.layer === 'zone' ? m.category.replace(/\D/g, '') || 'P' : m.category.charAt(0)
      L.marker([m.lat, m.lng], { icon: pinIcon(L, LAYER_COLOR[m.layer], label) })
        .bindTooltip(`${m.category}${m.note ? ' — ' + m.note : ''}`)
        .addTo(layerGroup.current!)
    })
  }, [markers, ready])

  const updateNote = useCallback(
    (id: string, note: string) => save(markers.map((m) => (m.id === id ? { ...m, note } : m))),
    [markers, save],
  )
  const remove = useCallback((id: string) => save(markers.filter((m) => m.id !== id)), [markers, save])

  const categories = layerSel.current === 'secteur' ? SECTEURS : ZONES

  return (
    <div className="mt-3 rounded-xl bg-stone-50 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-stone-200">
          {(['secteur', 'zone'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                layerSel.current = l
                categorySel.current = (l === 'secteur' ? SECTEURS : ZONES)[0]
                forceRerender((n) => n + 1)
              }}
              className={`px-3 py-1.5 text-[12px] font-medium ${
                layerSel.current === l ? 'bg-[#AFBD00] text-white' : 'bg-white text-stone-600'
              }`}
            >
              {l === 'secteur' ? 'Secteurs' : 'Zones'}
            </button>
          ))}
        </div>
        <select
          defaultValue={categorySel.current}
          onChange={(e) => {
            categorySel.current = e.target.value
          }}
          key={layerSel.current}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-700"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-stone-400">Clique sur la carte pour poser un repère</span>
      </div>

      <div ref={mapRef} className="h-72 w-full overflow-hidden rounded-lg border border-stone-200" />

      <ul className="mt-2 space-y-1">
        {markers.map((m) => (
          <li key={m.id} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px]">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: LAYER_COLOR[m.layer] }}
            />
            <span className="w-32 shrink-0 truncate text-stone-700">{m.category}</span>
            <input
              defaultValue={m.note}
              onBlur={(e) => e.target.value !== m.note && updateNote(m.id, e.target.value)}
              placeholder="note…"
              className="flex-1 rounded border border-stone-200 px-2 py-1 text-[12px]"
            />
            <button type="button" onClick={() => remove(m.id)} className="rounded p-1 text-stone-300 hover:text-red-500">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
