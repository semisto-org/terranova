import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FileText,
  ClipboardList,
  Heart,
  BookOpen,
  Calendar,
  Check,
  X,
  Loader2,
  ChevronRight,
  Leaf,
  MapPin,
  Users,
  TreePine,
  Shrub,
  Flower2,
  Map,
  Download,
  Camera,
  Receipt,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Sprout,
} from 'lucide-react'

/* ─── Utilities ─── */

function getClientToken() {
  return new URLSearchParams(window.location.search).get('token') || ''
}

function getCsrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta ? meta.getAttribute('content') : ''
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
      'X-Client-Token': getClientToken(),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch (_) { /* no-op */ }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

/* ─── Constants ─── */

const ACCENT = '#AFBD00'
const ACCENT_DARK = '#7a8200'
const BG = '#e1e6d8'

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTH_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const LAYER_LABELS = {
  canopy: 'Canopée',
  'sub-canopy': 'Sous-canopée',
  shrub: 'Arbustes',
  herbaceous: 'Herbacées',
  'ground-cover': 'Couvre-sol',
  vine: 'Lianes',
  root: 'Racines',
}

const LAYER_ICONS = {
  canopy: TreePine,
  'sub-canopy': TreePine,
  shrub: Shrub,
  herbaceous: Flower2,
  'ground-cover': Sprout,
  vine: Leaf,
  root: Leaf,
}

const LAYER_COLORS = {
  canopy: '#2d5016',
  'sub-canopy': '#3d6b22',
  shrub: '#5a8a2e',
  herbaceous: '#7aab3a',
  'ground-cover': '#96c24e',
  vine: '#6b8e23',
  root: '#8b7355',
}

const PHASE_LABELS = {
  offre: 'Offre',
  'pre-projet': 'Pré-projet',
  'projet-detaille': 'Projet détaillé',
  'mise-en-oeuvre': 'Mise en œuvre',
  'co-gestion': 'Co-gestion',
  termine: 'Terminé',
}

const PHASE_ORDER = ['offre', 'pre-projet', 'projet-detaille', 'mise-en-oeuvre', 'co-gestion', 'termine']

const SECTIONS = [
  { id: 'welcome', label: 'Mon projet', icon: Leaf },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'palette', label: 'Palette végétale', icon: Sprout },
  { id: 'plan', label: 'Plan de plantation', icon: Map },
  { id: 'harvest', label: 'Calendrier récolte', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'album', label: 'Album photo', icon: Camera },
  { id: 'expenses', label: 'Dépenses', icon: Receipt },
  { id: 'quotes', label: 'Devis', icon: FileText },
  { id: 'questionnaire', label: 'Questionnaire', icon: ClipboardList },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'journal', label: 'Journal', icon: BookOpen },
]

/* ─── Scroll Observer ─── */

function useActiveSection(sectionIds) {
  const [active, setActive] = useState(sectionIds[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return active
}

/* ─── Animated Section Wrapper ─── */

function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      {children}
    </section>
  )
}

/* ─── Card ─── */

function Card({ children, className = '', noPad = false }) {
  return (
    <div className={`rounded-2xl border border-stone-200/60 bg-white/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.02)] ${noPad ? '' : 'p-6 sm:p-8'} ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle, color = ACCENT }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
      <div>
        <h2
          className="text-xl font-semibold text-stone-900 tracking-tight"
          style={{ fontFamily: 'var(--font-heading, serif)' }}
        >
          {title}
        </h2>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ─── Interactive Planting Plan ─── */

function PlantingPlanViewer({ plantingPlan, paletteItems }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 })

  const markers = plantingPlan?.markers || []
  const imageUrl = plantingPlan?.imageUrl
  const scaleData = plantingPlan?.scaleData

  const paletteMap = useMemo(() => {
    const map = {}
    ;(paletteItems || []).forEach((item) => { map[item.id] = item })
    return map
  }, [paletteItems])

  // Compute pixels-per-cm from scale calibration data
  const pixelsPerCm = useMemo(() => {
    if (!scaleData || !renderedSize.width || !renderedSize.height) return null
    const p1 = scaleData.point1
    const p2 = scaleData.point2
    if (!p1 || !p2 || !scaleData.realWorldCm) return null
    const dx = (p2.x - p1.x) * renderedSize.width
    const dy = (p2.y - p1.y) * renderedSize.height
    const pixelDistance = Math.hypot(dx, dy)
    return pixelDistance / scaleData.realWorldCm
  }, [scaleData, renderedSize])

  const updateRenderedSize = useCallback(() => {
    if (imgRef.current) {
      setRenderedSize({ width: imgRef.current.clientWidth, height: imgRef.current.clientHeight })
    }
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(5, prev.scale * delta)),
    }))
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    setDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }, [transform.x, transform.y])

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }))
  }, [dragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
    setDragStart(null)
  }, [])

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
    setSelectedMarker(null)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  if (!imageUrl) {
    return (
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-12 text-center">
        <Map className="w-12 h-12 text-stone-300 mx-auto mb-3" strokeWidth={1} />
        <p className="text-sm text-stone-500">Le plan de plantation sera disponible prochainement.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(5, p.scale * 1.3) }))}
          className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
          title="Zoom +"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.5, p.scale * 0.7) }))}
          className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
          title="Zoom -"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors"
          title="Réinitialiser"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className="text-xs text-stone-400 ml-2">{Math.round(transform.scale * 100)}%</span>
      </div>

      {/* Plan viewer */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-stone-200 overflow-hidden bg-stone-100"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Image + markers wrapper: sized by the image naturally */}
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Plan de plantation"
              className="block max-w-full select-none pointer-events-none"
              style={{ maxHeight: 'min(520px, 60vh)' }}
              draggable={false}
              onLoad={updateRenderedSize}
            />
            {/* Diameter circles (SVG overlay) */}
            {pixelsPerCm && pixelsPerCm > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {markers
                  .filter((m) => m.diameterCm && m.diameterCm > 0)
                  .map((marker) => {
                    const radiusCm = marker.diameterCm / 2
                    const radiusPx = radiusCm * pixelsPerCm
                    const radiusPct = renderedSize.width > 0 ? (radiusPx / renderedSize.width) * 100 : 0
                    const paletteItem = marker.paletteItemId ? paletteMap[marker.paletteItemId] : null
                    const color = paletteItem ? (LAYER_COLORS[paletteItem.layer] || '#78716C') : '#78716C'
                    return (
                      <circle
                        key={`dim-${marker.id}`}
                        cx={`${marker.x * 100}%`}
                        cy={`${marker.y * 100}%`}
                        r={`${radiusPct}%`}
                        fill={color}
                        fillOpacity={0.2}
                        stroke={color}
                        strokeOpacity={0.5}
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                      />
                    )
                  })}
              </svg>
            )}
            {/* Markers positioned relative to the image */}
            {markers.map((marker) => {
              const paletteItem = marker.paletteItemId ? paletteMap[marker.paletteItemId] : null
              const layerColor = paletteItem ? (LAYER_COLORS[paletteItem.layer] || ACCENT) : ACCENT
              const isSelected = selectedMarker?.id === marker.id

              return (
                <button
                  key={marker.id}
                  type="button"
                  className="absolute flex items-center justify-center rounded-full border-2 text-white text-[10px] font-bold leading-none transition-all hover:scale-125 hover:z-20"
                  style={{
                    left: `${marker.x * 100}%`,
                    top: `${marker.y * 100}%`,
                    width: 24 / transform.scale,
                    height: 24 / transform.scale,
                    fontSize: `${Math.max(8, 10 / transform.scale)}px`,
                    backgroundColor: layerColor,
                    borderColor: '#fff',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: isSelected ? `0 0 0 3px ${layerColor}40` : '0 1px 3px rgba(0,0,0,0.3)',
                    zIndex: isSelected ? 30 : 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedMarker(isSelected ? null : marker)
                  }}
                  title={`#${marker.number} ${marker.speciesName || ''}`}
                >
                  {marker.number}
                </button>
              )
            })}
          </div>
        </div>

        {/* Marker popover */}
        {selectedMarker && (() => {
          const paletteItem = selectedMarker.paletteItemId ? paletteMap[selectedMarker.paletteItemId] : null
          return (
            <div
              className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg p-4 z-40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: paletteItem ? (LAYER_COLORS[paletteItem.layer] || ACCENT) : ACCENT }}
                    >
                      {selectedMarker.number}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {selectedMarker.speciesName || 'Plante'}
                    </span>
                  </div>
                  {selectedMarker.varietyName && (
                    <p className="text-xs text-stone-500 ml-8">var. {selectedMarker.varietyName}</p>
                  )}
                  {paletteItem && (
                    <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                      {paletteItem.commonName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {paletteItem.commonName}
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: LAYER_COLORS[paletteItem.layer] || ACCENT }}
                      >
                        {LAYER_LABELS[paletteItem.layer] || paletteItem.layer}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMarker(null)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      {markers.length > 0 && (
        <MarkerLegend markers={markers} paletteMap={paletteMap} onSelect={setSelectedMarker} selectedId={selectedMarker?.id} />
      )}
    </div>
  )
}

function MarkerLegend({ markers, paletteMap, onSelect, selectedId }) {
  const [expanded, setExpanded] = useState(false)
  const visibleMarkers = expanded ? markers : markers.slice(0, 12)

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Légende — {markers.length} plantes
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-stone-100">
        {visibleMarkers.map((marker) => {
          const paletteItem = marker.paletteItemId ? paletteMap[marker.paletteItemId] : null
          const layerColor = paletteItem ? (LAYER_COLORS[paletteItem.layer] || ACCENT) : ACCENT
          const isSelected = selectedId === marker.id

          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : marker)}
              className={`flex items-center gap-2 px-3 py-2.5 text-left bg-white hover:bg-stone-50 transition-colors ${isSelected ? 'ring-2 ring-inset' : ''}`}
              style={isSelected ? { ringColor: layerColor } : {}}
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-bold shrink-0"
                style={{ backgroundColor: layerColor }}
              >
                {marker.number}
              </span>
              <span className="text-xs text-stone-700 truncate leading-tight">
                {marker.speciesName || 'Plante'}
              </span>
            </button>
          )
        })}
      </div>
      {markers.length > 12 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 border-t border-stone-100 flex items-center justify-center gap-1 transition-colors"
        >
          {expanded ? 'Voir moins' : `Voir les ${markers.length} plantes`}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

/* ─── Harvest Calendar ─── */

function HarvestCalendarGrid({ autoHarvestCalendar }) {
  if (!autoHarvestCalendar || autoHarvestCalendar.length === 0) {
    return (
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-12 text-center">
        <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" strokeWidth={1} />
        <p className="text-sm text-stone-500">
          Le calendrier de récolte sera généré automatiquement à partir de votre palette végétale.
        </p>
      </div>
    )
  }

  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider pb-3 pr-4 sticky left-0 bg-white/95 backdrop-blur-sm z-10" style={{ minWidth: 180 }}>
              Plante
            </th>
            {MONTH_LABELS.map((label, i) => (
              <th
                key={i}
                className={`text-center text-[10px] font-semibold uppercase tracking-wider pb-3 px-0.5 ${currentMonth === i + 1 ? 'text-stone-900' : 'text-stone-400'}`}
                style={{ width: '6%' }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {autoHarvestCalendar.map((item, idx) => {
            const layerColor = LAYER_COLORS[item.layer] || ACCENT
            return (
              <tr key={item.paletteItemId || idx} className="border-t border-stone-100/60">
                <td className="py-2.5 pr-4 sticky left-0 bg-white/95 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: layerColor }}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-stone-800 truncate block">
                        {item.commonName || item.speciesName}
                      </span>
                      {item.commonName && (
                        <span className="text-[10px] text-stone-400 italic truncate block">
                          {item.speciesName}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {Array.from({ length: 12 }, (_, m) => {
                  const month = m + 1
                  const isHarvest = item.harvestMonths.includes(month)
                  const isFruiting = (item.fruitingMonths || []).includes(month)
                  const isCurrent = currentMonth === month

                  return (
                    <td key={m} className="px-0.5 py-2.5">
                      <div
                        className={`h-6 rounded-md transition-all ${isCurrent ? 'ring-1 ring-stone-300' : ''}`}
                        style={{
                          backgroundColor: isHarvest ? layerColor : isFruiting ? `${layerColor}30` : 'transparent',
                          opacity: isHarvest ? 0.85 : 1,
                        }}
                        title={isHarvest ? `Récolte : ${MONTH_FULL[m]}` : isFruiting ? `Fructification : ${MONTH_FULL[m]}` : ''}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#5a8a2e', opacity: 0.85 }} />
          <span className="text-[11px] text-stone-500">Récolte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#5a8a2e30' }} />
          <span className="text-[11px] text-stone-500">Fructification</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded-sm ring-1 ring-stone-300" />
          <span className="text-[11px] text-stone-500">Mois actuel</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Phase Progress ─── */

function PhaseProgress({ currentPhase }) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase)

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {PHASE_ORDER.map((phase, idx) => {
        const isCurrent = idx === currentIdx
        const isPast = idx < currentIdx

        return (
          <React.Fragment key={phase}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 transition-all ${
                  isCurrent
                    ? 'border-[#AFBD00] bg-[#AFBD00] scale-125'
                    : isPast
                      ? 'border-[#AFBD00] bg-[#AFBD00]/40'
                      : 'border-stone-300 bg-white'
                }`}
              />
              <span
                className={`text-[9px] sm:text-[10px] leading-tight text-center max-w-[60px] ${
                  isCurrent ? 'font-semibold text-stone-900' : 'text-stone-400'
                }`}
              >
                {PHASE_LABELS[phase] || phase}
              </span>
            </div>
            {idx < PHASE_ORDER.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full min-w-[12px] sm:min-w-[20px] -mt-4 ${
                  isPast ? 'bg-[#AFBD00]/50' : 'bg-stone-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ─── Main Component ─── */

export default function ClientPortal({ initialProjectId }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [payload, setPayload] = useState(null)
  const [questionnaire, setQuestionnaire] = useState({
    sun_observations: '',
    wet_areas: '',
    wind_patterns: '',
    soil_history: '',
    existing_wildlife: '',
  })
  const [wishlistItem, setWishlistItem] = useState({ item_type: 'plant', description: '' })
  const [journalEntry, setJournalEntry] = useState({ plant_id: '', species_name: '', text: '' })

  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), [])
  const activeSection = useActiveSection(sectionIds)

  const projectId = useMemo(
    () => initialProjectId || window.location.pathname.split('/').at(-1),
    [initialProjectId]
  )

  const loadPortal = useCallback(async () => {
    const data = await apiRequest(`/api/v1/design/${projectId}/client-portal`)
    setPayload(data)
  }, [projectId])

  useEffect(() => {
    let mounted = true
    async function boot() {
      setBusy(true)
      setError(null)
      try {
        await loadPortal()
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setBusy(false)
      }
    }
    boot()
    return () => { mounted = false }
  }, [loadPortal])

  // Pre-fill questionnaire from existing data
  useEffect(() => {
    if (!payload?.clientContributions?.terrainQuestionnaire?.responses) return
    const r = payload.clientContributions.terrainQuestionnaire.responses
    setQuestionnaire({
      sun_observations: r.sunObservations || '',
      wet_areas: r.wetAreas || '',
      wind_patterns: r.windPatterns || '',
      soil_history: r.soilHistory || '',
      existing_wildlife: r.existingWildlife || '',
    })
  }, [payload?.clientContributions?.terrainQuestionnaire])

  const runMutation = useCallback(
    async (handler, successMessage) => {
      setBusy(true)
      setError(null)
      try {
        await handler()
        await loadPortal()
        if (successMessage) {
          setNotice(successMessage)
          setTimeout(() => setNotice(null), 4000)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    [loadPortal]
  )

  const handleApproveQuote = (quote) => {
    runMutation(
      () =>
        apiRequest(`/api/v1/design/client/quotes/${quote.id}/approve`, {
          method: 'PATCH',
          body: JSON.stringify({ approved_by: 'client-portal' }),
        }),
      'Devis approuvé avec succès.'
    )
  }

  const handleRejectQuote = (quote) => {
    const comment = window.prompt('Raison du refus ?')
    if (!comment) return
    runMutation(
      () =>
        apiRequest(`/api/v1/design/client/quotes/${quote.id}/reject`, {
          method: 'PATCH',
          body: JSON.stringify({ comment }),
        }),
      'Devis rejeté.'
    )
  }

  /* ─── Loading State ─── */
  if (!payload) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-4 text-stone-700">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <Leaf className="w-8 h-8 text-[#AFBD00]" strokeWidth={1.5} />
            </div>
            {busy && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#AFBD00]" />
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-heading, serif)' }}>
              {busy ? 'Chargement de votre espace...' : error ? 'Portail indisponible' : 'Chargement...'}
            </p>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </main>
    )
  }

  /* ─── Data Extraction ─── */

  const project = payload.project
  const teamMembers = payload.teamMembers || []
  const paletteItems = payload.plantPalette?.items || []
  const paletteTotals = payload.plantPalette?.totals
  const plantingPlan = payload.plantingPlan
  const documents = payload.documents || []
  const quotes = payload.quotes || []
  const autoHarvestCalendar = payload.autoHarvestCalendar || []
  const clientExpenses = payload.clientExpenses || { categories: [], total: 0 }
  const wishlist = payload.clientContributions?.wishlist || []
  const plantJournal = payload.clientContributions?.plantJournal || []

  // Group palette by layer
  const layerOrder = ['canopy', 'sub-canopy', 'shrub', 'herbaceous', 'ground-cover', 'vine', 'root']
  const paletteByLayer = layerOrder.reduce((acc, layer) => {
    const items = paletteItems.filter((i) => i.layer === layer)
    if (items.length > 0) acc.push({ layer, items })
    return acc
  }, [])

  const formatDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  /* ─── Input classes ─── */
  const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:border-[#AFBD00] focus:ring-2 focus:ring-[#AFBD00]/20 outline-none transition-all'
  const btnPrimaryCls = 'rounded-xl bg-[#AFBD00] px-5 py-2.5 text-sm font-semibold text-stone-900 hover:bg-[#9aa800] transition-colors shadow-sm'

  /* ─── Visible sections (hide empty ones from nav) ─── */
  const visibleSections = SECTIONS.filter((s) => {
    if (s.id === 'team' && teamMembers.length === 0) return false
    if (s.id === 'album' && !project.googlePhotosUrl) return false
    if (s.id === 'expenses' && clientExpenses.categories.length === 0) return false
    return true
  })

  return (
    <main className="min-h-screen" style={{ background: BG }}>
      {/* Decorative top gradient */}
      <div className="h-1 bg-gradient-to-r from-[#2d5016] via-[#AFBD00] to-[#96c24e]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Sticky Navigation ─── */}
          <nav className="lg:w-52 shrink-0 lg:sticky lg:top-6 self-start" aria-label="Sections du portail">
            <div className="rounded-2xl border border-stone-200/60 bg-white/80 backdrop-blur-sm p-2.5 shadow-sm">
              <div className="px-2.5 py-2 mb-1">
                <p
                  className="text-sm font-semibold text-stone-900 truncate"
                  style={{ fontFamily: 'var(--font-heading, serif)' }}
                >
                  {project.name}
                </p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">Portail client</p>
              </div>
              <ul className="space-y-0.5">
                {visibleSections.map(({ id, label, icon: Icon }) => {
                  const isActive = activeSection === id
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all ${
                          isActive
                            ? 'bg-[#AFBD00]/15 text-stone-900'
                            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                        {label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>

          {/* ─── Content ─── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* ════ WELCOME ════ */}
            <Section id="welcome">
              <Card className="relative overflow-hidden">
                {/* Subtle decorative corner */}
                <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.04] pointer-events-none">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-[#AFBD00]">
                    <circle cx="80" cy="20" r="60" />
                  </svg>
                </div>

                <div className="relative">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#AFBD00] mb-3">
                    Votre jardin-forêt
                  </p>
                  <h1
                    className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight leading-tight"
                    style={{ fontFamily: 'var(--font-heading, serif)' }}
                  >
                    {project.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-stone-600">
                    {project.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                        {project.address}
                      </span>
                    )}
                    {project.area > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-stone-400">·</span>
                        {project.area.toLocaleString('fr-BE')} m²
                      </span>
                    )}
                    {project.startDate && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-stone-400">·</span>
                        Débuté le {formatDate(project.startDate)}
                      </span>
                    )}
                  </div>

                  {/* Phase progress */}
                  {project.phase && (
                    <div className="mt-6 pt-6 border-t border-stone-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
                        Avancement du projet
                      </p>
                      <PhaseProgress currentPhase={project.phase} />
                    </div>
                  )}

                  {/* Key dates */}
                  {project.plantingDate && (
                    <div className="mt-5 pt-5 border-t border-stone-100">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#AFBD00]/10 text-sm">
                        <Sprout className="w-4 h-4 text-[#AFBD00]" strokeWidth={1.8} />
                        <span className="text-stone-700">
                          Plantation prévue le <strong className="text-stone-900">{formatDate(project.plantingDate)}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Section>

            {/* ════ TEAM ════ */}
            {teamMembers.length > 0 && (
              <Section id="team">
                <Card>
                  <SectionTitle icon={Users} title="Votre équipe" subtitle="Les personnes qui s'occupent de votre projet" />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 p-4"
                      >
                        <div className="w-11 h-11 rounded-xl bg-[#e1e6d8] flex items-center justify-center shrink-0 overflow-hidden">
                          {member.memberAvatar ? (
                            <img src={member.memberAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-semibold text-[#6B7A00]">
                              {(member.memberName || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 text-sm truncate">{member.memberName}</p>
                          <p className="text-xs text-stone-500 capitalize">{member.role === 'project-manager' ? 'Chef de projet' : member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            )}

            {/* ════ PALETTE ════ */}
            <Section id="palette">
              <Card>
                <SectionTitle
                  icon={Sprout}
                  title="Palette végétale"
                  subtitle={paletteTotals ? `${paletteTotals.totalPlants} plants répartis en ${paletteByLayer.length} strates` : 'Les plantes sélectionnées pour votre jardin-forêt'}
                  color="#3d6b22"
                />

                {paletteItems.length === 0 ? (
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-12 text-center">
                    <Sprout className="w-12 h-12 text-stone-300 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-stone-500">La palette végétale est en cours de composition.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {paletteByLayer.map(({ layer, items }) => {
                      const Icon = LAYER_ICONS[layer] || Leaf
                      const color = LAYER_COLORS[layer] || ACCENT

                      return (
                        <div key={layer} className="rounded-xl border border-stone-100 overflow-hidden">
                          {/* Layer header */}
                          <div
                            className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100"
                            style={{ backgroundColor: `${color}08` }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
                            </div>
                            <span className="text-sm font-semibold text-stone-800">
                              {LAYER_LABELS[layer] || layer}
                            </span>
                            <span className="text-xs text-stone-400 ml-auto">
                              {items.reduce((s, i) => s + (i.quantity || 1), 0)} plants
                            </span>
                          </div>

                          {/* Plants list */}
                          <div className="divide-y divide-stone-50">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                                <div
                                  className="w-2 h-8 rounded-full shrink-0"
                                  style={{ backgroundColor: color, opacity: 0.6 }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-stone-800">
                                    <span className="font-medium">
                                      {item.commonName || item.speciesName}
                                    </span>
                                    {item.commonName && item.speciesName && (
                                      <span className="text-stone-400 italic ml-1.5 text-xs">
                                        {item.speciesName}
                                      </span>
                                    )}
                                  </p>
                                  {item.varietyName && (
                                    <p className="text-xs text-stone-500">var. {item.varietyName}</p>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-stone-600 tabular-nums shrink-0">
                                  ×{item.quantity || 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Totals */}
                    {paletteTotals && (
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 border border-stone-100">
                          <span className="text-sm text-stone-500">Total</span>
                          <span className="text-sm font-semibold text-stone-900">{paletteTotals.totalPlants} plants</span>
                        </div>
                        {paletteTotals.totalCost > 0 && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 border border-stone-100">
                            <span className="text-sm text-stone-500">Budget plants</span>
                            <span className="text-sm font-semibold text-stone-900">
                              {Number(paletteTotals.totalCost).toLocaleString('fr-BE')} €
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Section>

            {/* ════ PLANTING PLAN ════ */}
            <Section id="plan">
              <Card>
                <SectionTitle
                  icon={Map}
                  title="Plan de plantation"
                  subtitle="Cliquez sur un numéro pour voir les détails de chaque plante"
                  color="#234766"
                />
                <PlantingPlanViewer plantingPlan={plantingPlan} paletteItems={paletteItems} />
              </Card>
            </Section>

            {/* ════ HARVEST CALENDAR ════ */}
            <Section id="harvest">
              <Card>
                <SectionTitle
                  icon={Calendar}
                  title="Calendrier de récolte"
                  subtitle="Découvrez mois par mois ce que votre jardin-forêt vous offrira"
                  color="#EF9B0D"
                />
                <HarvestCalendarGrid autoHarvestCalendar={autoHarvestCalendar} />
              </Card>
            </Section>

            {/* ════ DOCUMENTS ════ */}
            <Section id="documents">
              <Card>
                <SectionTitle
                  icon={FileText}
                  title="Documents"
                  subtitle="Les documents de votre projet"
                />
                {documents.length === 0 ? (
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-8 text-center">
                    <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-stone-500">Aucun document pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-stone-100 px-4 py-3 hover:bg-stone-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#AFBD00]/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#AFBD00]" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800 truncate">{doc.name}</p>
                          {doc.category && (
                            <p className="text-xs text-stone-400">{doc.category}</p>
                          )}
                        </div>
                        <Download className="w-4 h-4 text-stone-400 group-hover:text-[#AFBD00] transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            {/* ════ ALBUM PHOTO ════ */}
            {project.googlePhotosUrl && (
              <Section id="album">
                <Card>
                  <SectionTitle
                    icon={Camera}
                    title="Album photo"
                    subtitle="Photos et vidéos de votre projet"
                    color="#EF9B0D"
                  />
                  <a
                    href={project.googlePhotosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-xl border-2 border-dashed border-[#EF9B0D]/30 bg-[#EF9B0D]/5 p-6 hover:border-[#EF9B0D]/50 hover:bg-[#EF9B0D]/10 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#EF9B0D]/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Camera className="w-7 h-7 text-[#EF9B0D]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">Ouvrir l'album Google Photos</p>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{project.googlePhotosUrl}</p>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-stone-400 group-hover:text-[#EF9B0D] transition-colors shrink-0" />
                  </a>
                </Card>
              </Section>
            )}

            {/* ════ EXPENSES ════ */}
            {clientExpenses.categories.length > 0 && (
              <Section id="expenses">
                <Card>
                  <SectionTitle
                    icon={Receipt}
                    title="Dépenses du projet"
                    subtitle="Résumé des dépenses facturables"
                    color="#5B5781"
                  />
                  <div className="space-y-2">
                    {clientExpenses.categories.map((cat, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-[#5B5781]/60 shrink-0" />
                          <span className="text-sm text-stone-700 truncate">{cat.category}</span>
                          <span className="text-xs text-stone-400">({cat.count})</span>
                        </div>
                        <span className="text-sm font-medium text-stone-900 tabular-nums shrink-0">
                          {cat.subtotal.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200">
                    <span className="text-sm font-semibold text-stone-700">Total</span>
                    <span className="text-lg font-bold text-stone-900 tabular-nums">
                      {clientExpenses.total.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </Card>
              </Section>
            )}

            {/* ════ QUOTES ════ */}
            <Section id="quotes">
              <Card>
                <SectionTitle icon={FileText} title="Devis" subtitle="Consultez et validez vos devis" />
                {quotes.length === 0 ? (
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-8 text-center">
                    <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-sm text-stone-500">Aucun devis pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        onApprove={handleApproveQuote}
                        onReject={handleRejectQuote}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            {/* ════ QUESTIONNAIRE ════ */}
            <Section id="questionnaire">
              <Card>
                <SectionTitle
                  icon={ClipboardList}
                  title="Questionnaire terrain"
                  subtitle="Partagez vos observations pour affiner le design"
                />
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/questionnaire`, {
                          method: 'PATCH',
                          body: JSON.stringify(questionnaire),
                        }),
                      'Questionnaire envoyé.'
                    )
                  }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="sm:col-span-2 grid gap-1.5">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Observations soleil</span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Quelles zones sont ensoleillées, à quel moment..."
                        value={questionnaire.sun_observations}
                        onChange={(e) => setQuestionnaire((p) => ({ ...p, sun_observations: e.target.value }))}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Zones humides</span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Zones humides ou mal drainées..."
                        value={questionnaire.wet_areas}
                        onChange={(e) => setQuestionnaire((p) => ({ ...p, wet_areas: e.target.value }))}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Vents dominants</span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Direction, force..."
                        value={questionnaire.wind_patterns}
                        onChange={(e) => setQuestionnaire((p) => ({ ...p, wind_patterns: e.target.value }))}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Historique du sol</span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Ancien usage, amendements..."
                        value={questionnaire.soil_history}
                        onChange={(e) => setQuestionnaire((p) => ({ ...p, soil_history: e.target.value }))}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Faune observée</span>
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Oiseaux, insectes, mammifères..."
                        value={questionnaire.existing_wildlife}
                        onChange={(e) => setQuestionnaire((p) => ({ ...p, existing_wildlife: e.target.value }))}
                      />
                    </label>
                  </div>
                  <button type="submit" className={btnPrimaryCls}>
                    Envoyer le questionnaire
                  </button>
                </form>
              </Card>
            </Section>

            {/* ════ WISHLIST ════ */}
            <Section id="wishlist">
              <Card>
                <SectionTitle
                  icon={Heart}
                  title="Wishlist"
                  subtitle="Vos souhaits pour le jardin-forêt"
                  color="#B01A19"
                />
                <form
                  className="flex flex-wrap gap-3 mb-6"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    await runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/wishlist`, {
                          method: 'POST',
                          body: JSON.stringify(wishlistItem),
                        }),
                      'Souhait ajouté.'
                    )
                    setWishlistItem({ item_type: 'plant', description: '' })
                  }}
                >
                  <select
                    className={`${inputCls} w-auto`}
                    value={wishlistItem.item_type}
                    onChange={(e) => setWishlistItem((p) => ({ ...p, item_type: e.target.value }))}
                  >
                    <option value="plant">Plante</option>
                    <option value="feature">Aménagement</option>
                    <option value="material">Matériau</option>
                  </select>
                  <input
                    type="text"
                    className={`${inputCls} flex-1 min-w-[200px]`}
                    placeholder="Décrivez votre souhait..."
                    value={wishlistItem.description}
                    onChange={(e) => setWishlistItem((p) => ({ ...p, description: e.target.value }))}
                    required
                  />
                  <button type="submit" className={btnPrimaryCls}>Ajouter</button>
                </form>
                {wishlist.length === 0 ? (
                  <p className="text-sm text-stone-400 py-2">Ajoutez vos premiers souhaits ci-dessus.</p>
                ) : (
                  <div className="space-y-2">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-100 px-4 py-3"
                      >
                        <Heart className="w-4 h-4 text-red-300 shrink-0" fill="currentColor" />
                        <span className="text-xs font-medium text-stone-500 capitalize min-w-[60px]">{item.type === 'plant' ? 'Plante' : item.type === 'feature' ? 'Aménagement' : 'Matériau'}</span>
                        <span className="text-sm text-stone-700">{item.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            {/* ════ JOURNAL ════ */}
            <Section id="journal">
              <Card>
                <SectionTitle
                  icon={BookOpen}
                  title="Journal des plantes"
                  subtitle="Notez vos observations au fil des saisons"
                  color="#234766"
                />
                <form
                  className="flex flex-wrap gap-3 mb-6"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    await runMutation(
                      () =>
                        apiRequest(`/api/v1/design/${projectId}/client/journal`, {
                          method: 'POST',
                          body: JSON.stringify(journalEntry),
                        }),
                      'Entrée journal ajoutée.'
                    )
                    setJournalEntry({ plant_id: '', species_name: '', text: '' })
                  }}
                >
                  <input
                    type="text"
                    className={`${inputCls} w-32`}
                    placeholder="Plant #"
                    value={journalEntry.plant_id}
                    onChange={(e) => setJournalEntry((p) => ({ ...p, plant_id: e.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    className={`${inputCls} w-40`}
                    placeholder="Espèce"
                    value={journalEntry.species_name}
                    onChange={(e) => setJournalEntry((p) => ({ ...p, species_name: e.target.value }))}
                  />
                  <input
                    type="text"
                    className={`${inputCls} flex-1 min-w-[200px]`}
                    placeholder="Votre observation..."
                    value={journalEntry.text}
                    onChange={(e) => setJournalEntry((p) => ({ ...p, text: e.target.value }))}
                    required
                  />
                  <button type="submit" className={btnPrimaryCls}>Ajouter</button>
                </form>
                {plantJournal.length === 0 ? (
                  <p className="text-sm text-stone-400 py-2">Aucune observation pour le moment.</p>
                ) : (
                  <div className="space-y-4">
                    {plantJournal.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-stone-100 p-4">
                        <p className="text-sm font-medium text-stone-800 mb-2">
                          {entry.speciesName || entry.plantId || 'Plante'}
                        </p>
                        <div className="space-y-1.5">
                          {(entry.entries || []).map((detail) => (
                            <div key={detail.id} className="flex gap-3 text-xs pl-3 border-l-2 border-[#234766]/20">
                              <span className="text-stone-400 shrink-0 tabular-nums">{detail.date}</span>
                              <span className="text-stone-600">{detail.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Section>

            {/* Footer */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-stone-400">
                <Leaf className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs">Semisto — Design de jardins-forêts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toast notifications ─── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" aria-live="polite">
        {busy && (
          <div className="rounded-xl bg-stone-800/90 backdrop-blur-sm text-white text-sm px-4 py-3 flex items-center gap-2 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Synchronisation...
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-600/90 backdrop-blur-sm text-white text-sm px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" className="p-1 rounded-lg hover:bg-red-500 transition-colors shrink-0" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {notice && (
          <div className="rounded-xl bg-emerald-600/90 backdrop-blur-sm text-white text-sm px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <span>{notice}</span>
            <button type="button" className="text-xs font-medium underline hover:no-underline shrink-0" onClick={() => setNotice(null)}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

/* ─── Quote Card ─── */

function QuoteCard({ quote, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const lines = quote.lines || []
  const statusMap = {
    approved: { label: 'Approuvé', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'Rejeté', cls: 'bg-red-50 text-red-700 border-red-200' },
    sent: { label: 'Envoyé', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    draft: { label: 'Brouillon', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  }
  const status = statusMap[quote.status] || statusMap.draft

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      {/* Quote header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">{quote.title}</span>
              <span className="text-xs text-stone-400">v{quote.version}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.cls}`}>
                {status.label}
              </span>
              {quote.validUntil && (
                <span className="text-[10px] text-stone-400">
                  Valide jusqu'au {new Date(quote.validUntil).toLocaleDateString('fr-BE')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-stone-900 tabular-nums">
            {quote.total.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €
          </span>
        </div>
      </div>

      {/* Expandable lines */}
      {lines.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 bg-stone-50/50 border-t border-stone-100 transition-colors"
          >
            {expanded ? 'Masquer le détail' : `Voir le détail (${lines.length} lignes)`}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {expanded && (
            <div className="border-t border-stone-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50/80 text-xs text-stone-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-2 font-medium">Description</th>
                    <th className="text-right px-3 py-2 font-medium">Qté</th>
                    <th className="text-right px-3 py-2 font-medium">P.U.</th>
                    <th className="text-right px-5 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-5 py-2.5 text-stone-700">{line.description}</td>
                      <td className="px-3 py-2.5 text-right text-stone-600 tabular-nums">{line.quantity}{line.unit ? ` ${line.unit}` : ''}</td>
                      <td className="px-3 py-2.5 text-right text-stone-600 tabular-nums">{line.unitPrice.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €</td>
                      <td className="px-5 py-2.5 text-right font-medium text-stone-800 tabular-nums">{line.total.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-stone-200 text-xs text-stone-500">
                    <td colSpan={3} className="px-5 py-2 text-right">Sous-total HT</td>
                    <td className="px-5 py-2 text-right font-medium text-stone-700 tabular-nums">{quote.subtotal.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €</td>
                  </tr>
                  <tr className="text-xs text-stone-500">
                    <td colSpan={3} className="px-5 py-1 text-right">TVA ({quote.vatRate}%)</td>
                    <td className="px-5 py-1 text-right tabular-nums">{quote.vatAmount.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €</td>
                  </tr>
                  <tr className="text-sm font-semibold text-stone-900">
                    <td colSpan={3} className="px-5 py-2 text-right">Total TTC</td>
                    <td className="px-5 py-2 text-right tabular-nums">{quote.total.toLocaleString('fr-BE', { minimumFractionDigits: 2 })} €</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      {quote.status !== 'approved' && quote.status !== 'rejected' && (
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-stone-50/50 border-t border-stone-100">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            onClick={() => onApprove(quote)}
          >
            <Check className="w-4 h-4" />
            Approuver
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            onClick={() => onReject(quote)}
          >
            <X className="w-4 h-4" />
            Rejeter
          </button>
        </div>
      )}

      {/* Client comment */}
      {quote.clientComment && (
        <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100 text-xs text-amber-800">
          <span className="font-medium">Commentaire :</span> {quote.clientComment}
        </div>
      )}
    </div>
  )
}
