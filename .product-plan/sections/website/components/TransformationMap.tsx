import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, useMap, ZoomControl, useMapEvents } from 'react-leaflet'
import * as L from 'leaflet'
import type { TransformationMapProps, MapProject, PotentialZone, ProjectStatus } from '../types'
import 'leaflet/dist/leaflet.css'

// =============================================================================
// DESIGN SYSTEM
// =============================================================================

const COLORS = {
  completed: { primary: '#2d5016', light: '#4a7c23', bg: 'rgba(45, 80, 22, 0.12)' },
  'in-progress': { primary: '#5B5781', light: '#7b759a', bg: 'rgba(91, 87, 129, 0.12)' },
  funding: { primary: '#b45309', light: '#d97706', bg: 'rgba(180, 83, 9, 0.12)' },
  zone: { primary: '#0369a1', light: '#0ea5e9', bg: 'rgba(3, 105, 161, 0.08)' },
  neutral: { dark: '#1c1917', medium: '#57534e', light: '#a8a29e', faint: '#e7e5e4' }
}

// Unsplash images for food forests / gardens
const UNSPLASH_IMAGES = {
  completed: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop',
  ],
  'in-progress': [
    'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=300&fit=crop',
  ],
  funding: [
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1495908333425-29a1e0918c5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  ]
}

// Get consistent images for a project based on its ID
function getProjectImages(projectId: string, status: ProjectStatus): string[] {
  const images = UNSPLASH_IMAGES[status]
  const hash = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const startIndex = hash % images.length
  return [...images.slice(startIndex), ...images.slice(0, startIndex)]
}

// =============================================================================
// CUSTOM MARKERS
// =============================================================================

const createClusterIcon = (count: number, dominantStatus: ProjectStatus) => {
  const color = COLORS[dominantStatus].primary
  const size = Math.min(52, 32 + Math.log10(count) * 10)

  return L.divIcon({
    className: 'nyt-cluster',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: ${Math.max(11, size / 3.5)}px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        letter-spacing: -0.02em;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
        transition: transform 0.15s ease;
        cursor: pointer;
      ">
        ${count > 999 ? Math.round(count / 1000) + 'k' : count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

const createProjectIcon = (status: ProjectStatus, isSelected: boolean, isHovered: boolean) => {
  const { primary } = COLORS[status]
  const size = isSelected ? 16 : isHovered ? 14 : 10
  const ringSize = isSelected ? 28 : 0

  return L.divIcon({
    className: 'nyt-marker',
    html: `
      <div style="position: relative; width: ${Math.max(size, ringSize)}px; height: ${Math.max(size, ringSize)}px; cursor: pointer;">
        ${isSelected ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${ringSize}px;
            height: ${ringSize}px;
            border: 1.5px solid ${primary};
            border-radius: 50%;
            opacity: 0.4;
          "></div>
        ` : ''}
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          background: ${primary};
          border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          transition: all 0.15s ease;
        "></div>
      </div>
    `,
    iconSize: [Math.max(size, ringSize), Math.max(size, ringSize)],
    iconAnchor: [Math.max(size, ringSize) / 2, Math.max(size, ringSize) / 2]
  })
}

// =============================================================================
// CLUSTERING LOGIC
// =============================================================================

function clusterByGrid(
  projects: MapProject[],
  zoom: number,
  bounds: L.LatLngBounds | null
): { clusters: Array<{ center: [number, number]; projects: MapProject[]; dominantStatus: ProjectStatus }>; singles: MapProject[] } {
  if (!bounds || zoom >= 11) {
    const visible = bounds
      ? projects.filter(p => bounds.contains([p.coordinates.lat, p.coordinates.lng]))
      : projects
    return { clusters: [], singles: visible }
  }

  const gridSize = 120 / Math.pow(2, zoom)
  const grid: Map<string, MapProject[]> = new Map()

  projects.forEach(project => {
    if (bounds && !bounds.contains([project.coordinates.lat, project.coordinates.lng])) return
    const cellX = Math.floor(project.coordinates.lng / gridSize)
    const cellY = Math.floor(project.coordinates.lat / gridSize)
    const key = `${cellX},${cellY}`
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key)!.push(project)
  })

  const clusters: Array<{ center: [number, number]; projects: MapProject[]; dominantStatus: ProjectStatus }> = []
  const singles: MapProject[] = []

  grid.forEach(group => {
    if (group.length <= 2) {
      singles.push(...group)
    } else {
      const avgLat = group.reduce((sum, p) => sum + p.coordinates.lat, 0) / group.length
      const avgLng = group.reduce((sum, p) => sum + p.coordinates.lng, 0) / group.length
      const statusCount = { completed: 0, 'in-progress': 0, funding: 0 }
      group.forEach(p => statusCount[p.status]++)
      const dominantStatus = (Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0][0]) as ProjectStatus
      clusters.push({ center: [avgLat, avgLng], projects: group, dominantStatus })
    }
  })

  return { clusters, singles }
}

// =============================================================================
// MAP COMPONENTS
// =============================================================================

function MapEventsHandler({
  projects,
  onClusteringUpdate,
  onZoomChange
}: {
  projects: MapProject[]
  onClusteringUpdate: (result: ReturnType<typeof clusterByGrid>) => void
  onZoomChange: (zoom: number) => void
}) {
  const map = useMapEvents({
    moveend: () => {
      onClusteringUpdate(clusterByGrid(projects, map.getZoom(), map.getBounds()))
    },
    zoomend: () => {
      const zoom = map.getZoom()
      onZoomChange(zoom)
      onClusteringUpdate(clusterByGrid(projects, zoom, map.getBounds()))
    }
  })

  useEffect(() => {
    onClusteringUpdate(clusterByGrid(projects, map.getZoom(), map.getBounds()))
  }, [projects, map, onClusteringUpdate])

  return null
}

function MapAnimator({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    map.flyTo(center, zoom, { duration: 0.6, easeLinearity: 0.5 })
  }, [center, zoom, map])

  return null
}

// =============================================================================
// AIRBNB-STYLE POPUP CARD WITH CAROUSEL
// =============================================================================

function AirbnbPopupCard({
  project,
  position,
  onClose,
  onViewProject
}: {
  project: MapProject
  position: { x: number; y: number }
  onClose: () => void
  onViewProject: () => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const images = useMemo(() => getProjectImages(project.id, project.status), [project.id, project.status])
  const name = project.id.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const { primary } = COLORS[project.status]
  const statusLabel = { completed: 'Terminé', 'in-progress': 'En cours', funding: 'Financement' }[project.status]

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return
    const endX = e.changedTouches[0].clientX
    const diff = startX - endX

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1)
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1)
      }
    }
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    const diff = startX - e.clientX

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1)
      } else if (diff < 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1)
      }
    }
    setIsDragging(false)
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Reset image loaded state when index changes
  useEffect(() => {
    setIsImageLoaded(false)
  }, [currentImageIndex])

  // Calculate position to keep card in viewport
  const cardWidth = 320
  const cardHeight = 340
  const padding = 16

  let left = position.x - cardWidth / 2
  let top = position.y - cardHeight - 20

  // Adjust horizontal position
  if (left < padding) left = padding
  if (left + cardWidth > window.innerWidth - padding) {
    left = window.innerWidth - cardWidth - padding
  }

  // If card would go above viewport, show below marker
  if (top < padding + 56) {
    top = position.y + 20
  }

  return (
    <div
      ref={cardRef}
      className="fixed z-[2000] animate-in fade-in zoom-in-95 duration-200"
      style={{ left, top }}
    >
      <div className="w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Image Carousel */}
        <div
          className="relative h-[200px] bg-stone-100 overflow-hidden cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Images */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {images.map((src, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 relative">
                {!isImageLoaded && idx === currentImageIndex && (
                  <div className="absolute inset-0 bg-stone-200 animate-pulse" />
                )}
                <img
                  src={src}
                  alt={`${name} - Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => idx === currentImageIndex && setIsImageLoaded(true)}
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev - 1) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105"
            >
              <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentImageIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev + 1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105"
            >
              <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Dots indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentImageIndex
                    ? 'bg-white w-4'
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
          >
            <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Status badge */}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.9)', color: primary }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-stone-900 mb-1 leading-tight">
            {name}
          </h3>

          <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{project.coordinates.lat.toFixed(2)}°N, {project.coordinates.lng.toFixed(2)}°E</span>
          </div>

          <button
            onClick={onViewProject}
            className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90"
            style={{ background: primary }}
          >
            Voir le projet
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function ImpactCounter({ value, label, color }: { value: number; label: string; color: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 800
    const start = Date.now()
    const startVal = displayed

    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(startVal + (value - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tracking-tight" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
        {displayed.toLocaleString()}
      </div>
      <div className="text-[11px] text-stone-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

function ProjectListItem({
  project,
  isSelected,
  onClick
}: {
  project: MapProject
  isSelected: boolean
  onClick: () => void
}) {
  const name = project.id.split('-').slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const { primary, bg } = COLORS[project.status]
  const statusLabel = { completed: 'Terminé', 'in-progress': 'En cours', funding: 'Financement' }[project.status]
  const images = getProjectImages(project.id, project.status)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-stone-100 dark:border-stone-800 transition-colors ${
        isSelected ? 'bg-stone-50 dark:bg-stone-800/50' : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
          <img
            src={images[0]}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate leading-tight">
            {name}
          </h4>
          <span
            className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: bg, color: primary }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </button>
  )
}

function ZoneListItem({
  zone,
  isSelected,
  onClick
}: {
  zone: PotentialZone
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-dashed border-stone-200 dark:border-stone-700 transition-colors ${
        isSelected ? 'bg-sky-50/50 dark:bg-sky-900/20' : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-stone-900"
          style={{ background: COLORS.zone.primary, ringColor: COLORS.zone.light }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate leading-tight">
            {zone.name}
          </h4>
          <p className="text-xs text-stone-400 mt-0.5 truncate">
            {zone.addedBy}
          </p>
        </div>
      </div>
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TransformationMap({
  projects,
  potentialZones,
  onProjectClick,
  onZoneClick,
  onAddZone
}: TransformationMapProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.5, 3.5])
  const [mapZoom, setMapZoom] = useState(5)
  const [currentZoom, setCurrentZoom] = useState(5)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'projects' | 'zones'>('projects')
  const [clusterData, setClusterData] = useState<ReturnType<typeof clusterByGrid>>({ clusters: [], singles: [] })

  // Popup state
  const [popupProject, setPopupProject] = useState<MapProject | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Filtered data
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter(p => p.id.toLowerCase().includes(q))
  }, [projects, searchQuery])

  const filteredZones = useMemo(() => {
    if (!searchQuery) return potentialZones
    const q = searchQuery.toLowerCase()
    return potentialZones.filter(z => z.name.toLowerCase().includes(q) || z.description.toLowerCase().includes(q))
  }, [potentialZones, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    funding: projects.filter(p => p.status === 'funding').length,
    zones: potentialZones.length
  }), [projects, potentialZones])

  // Handlers
  const handleProjectSelect = useCallback((project: MapProject, screenPos?: { x: number; y: number }) => {
    setSelectedItem(project.id)
    setMapCenter([project.coordinates.lat, project.coordinates.lng])
    setMapZoom(13)

    if (screenPos) {
      setPopupProject(project)
      setPopupPosition(screenPos)
    }

    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const handleMarkerClick = useCallback((project: MapProject, e: L.LeafletMouseEvent) => {
    const screenPos = {
      x: e.originalEvent.clientX,
      y: e.originalEvent.clientY
    }
    setSelectedItem(project.id)
    setPopupProject(project)
    setPopupPosition(screenPos)
  }, [])

  const handleZoneSelect = useCallback((zone: PotentialZone) => {
    setSelectedItem(zone.id)
    setPopupProject(null)
    setPopupPosition(null)
    setMapCenter([zone.coordinates.lat, zone.coordinates.lng])
    setMapZoom(8)
    onZoneClick?.(zone.id)
    if (isMobile) setSidebarOpen(false)
  }, [onZoneClick, isMobile])

  const resetView = useCallback(() => {
    setSelectedItem(null)
    setPopupProject(null)
    setPopupPosition(null)
    setMapCenter([48.5, 3.5])
    setMapZoom(5)
    setSearchQuery('')
  }, [])

  const handleClusteringUpdate = useCallback((result: ReturnType<typeof clusterByGrid>) => {
    setClusterData(result)
  }, [])

  const closePopup = useCallback(() => {
    setPopupProject(null)
    setPopupPosition(null)
  }, [])

  // Visible zones
  const visibleZones = useMemo(() => {
    if (currentZoom < 6) return []
    return filteredZones.slice(0, 100)
  }, [filteredZones, currentZoom])

  return (
    <div ref={mapContainerRef} className="relative h-screen w-full overflow-hidden bg-[#fafaf9] dark:bg-stone-950">
      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .nyt-map { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .leaflet-container { background: #fafaf9; font-family: 'Inter', system-ui, sans-serif; }
        .dark .leaflet-container { background: #1c1917; }
        .nyt-marker, .nyt-cluster { background: transparent; border: none; }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
          border-radius: 6px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #57534e !important;
          border: none !important;
          border-bottom: 1px solid #f5f5f4 !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          font-size: 14px !important;
        }
        .leaflet-control-zoom a:last-child { border-bottom: none !important; }
        .leaflet-control-zoom a:hover { background: #fafaf9 !important; }

        .leaflet-control-attribution {
          font-size: 9px !important;
          background: rgba(255,255,255,0.7) !important;
          padding: 2px 6px !important;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1001] bg-white/98 dark:bg-stone-900/98 backdrop-blur-sm border-b border-stone-200/60 dark:border-stone-800">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={sidebarOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
            >
              {sidebarOpen ? (
                <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div>
              <h1 className="text-base font-semibold text-stone-800 dark:text-stone-100 tracking-tight">
                Transformation Map
              </h1>
              <p className="text-[11px] text-stone-400 -mt-0.5 hidden sm:block">
                {projects.length.toLocaleString()} jardins-forêts · {potentialZones.length.toLocaleString()} zones
              </p>
            </div>
          </div>

          <button
            onClick={resetView}
            className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            Vue d'ensemble
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`absolute top-14 left-0 bottom-0 z-[1000] w-full lg:w-[340px] bg-white dark:bg-stone-900 border-r border-stone-200/60 dark:border-stone-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Stats */}
        <div className="px-4 py-5 border-b border-stone-100 dark:border-stone-800 grid grid-cols-4 gap-2">
          <ImpactCounter value={stats.completed} label="Terminés" color={COLORS.completed.primary} />
          <ImpactCounter value={stats.inProgress} label="En cours" color={COLORS['in-progress'].primary} />
          <ImpactCounter value={stats.funding} label="À financer" color={COLORS.funding.primary} />
          <ImpactCounter value={stats.zones} label="Zones" color={COLORS.zone.primary} />
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-600"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 dark:border-stone-800">
          {(['projects', 'zones'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'text-stone-800 dark:text-stone-100 border-b-2 border-stone-800 dark:border-stone-100'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {tab === 'projects' ? `Projets (${filteredProjects.length})` : `Zones (${filteredZones.length})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'projects' && (
            <>
              {filteredProjects.slice(0, 150).map(project => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  isSelected={selectedItem === project.id}
                  onClick={() => handleProjectSelect(project)}
                />
              ))}
              {filteredProjects.length > 150 && (
                <div className="px-4 py-3 text-xs text-stone-400 text-center">
                  {(filteredProjects.length - 150).toLocaleString()} autres projets
                </div>
              )}
            </>
          )}
          {activeTab === 'zones' && (
            <>
              {filteredZones.slice(0, 100).map(zone => (
                <ZoneListItem
                  key={zone.id}
                  zone={zone}
                  isSelected={selectedItem === zone.id}
                  onClick={() => handleZoneSelect(zone)}
                />
              ))}
              {filteredZones.length > 100 && (
                <div className="px-4 py-3 text-xs text-stone-400 text-center">
                  {(filteredZones.length - 100).toLocaleString()} autres zones
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onAddZone}
            className="w-full py-2.5 text-sm font-medium text-white bg-stone-800 dark:bg-stone-100 dark:text-stone-900 rounded-md hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
          >
            Suggérer une zone
          </button>
        </div>
      </aside>

      {/* Map */}
      <div className="absolute inset-0 pt-14">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          zoomControl={false}
          className="h-full w-full nyt-map"
        >
          <ZoomControl position="bottomright" />
          <MapAnimator center={mapCenter} zoom={mapZoom} />
          <MapEventsHandler
            projects={filteredProjects}
            onClusteringUpdate={handleClusteringUpdate}
            onZoomChange={setCurrentZoom}
          />

          {/* Muted, elegant basemap */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Zones */}
          {visibleZones.map(zone => (
            <CircleMarker
              key={zone.id}
              center={[zone.coordinates.lat, zone.coordinates.lng]}
              radius={Math.max(8, zone.radius / 3)}
              pathOptions={{
                color: COLORS.zone.primary,
                fillColor: COLORS.zone.primary,
                fillOpacity: selectedItem === zone.id ? 0.15 : 0.06,
                weight: selectedItem === zone.id ? 1.5 : 1,
                dashArray: '4, 4'
              }}
              eventHandlers={{ click: () => handleZoneSelect(zone) }}
            />
          ))}

          {/* Clusters */}
          {clusterData.clusters.map((cluster, idx) => (
            <Marker
              key={`c-${idx}`}
              position={cluster.center}
              icon={createClusterIcon(cluster.projects.length, cluster.dominantStatus)}
              eventHandlers={{
                click: () => {
                  setPopupProject(null)
                  setPopupPosition(null)
                  setMapCenter(cluster.center)
                  setMapZoom(Math.min(currentZoom + 2, 14))
                }
              }}
            />
          ))}

          {/* Individual markers */}
          {clusterData.singles.map(project => (
            <Marker
              key={project.id}
              position={[project.coordinates.lat, project.coordinates.lng]}
              icon={createProjectIcon(project.status, selectedItem === project.id, hoveredItem === project.id)}
              eventHandlers={{
                click: (e) => handleMarkerClick(project, e),
                mouseover: () => setHoveredItem(project.id),
                mouseout: () => setHoveredItem(null)
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Airbnb-style Popup */}
      {popupProject && popupPosition && (
        <AirbnbPopupCard
          project={popupProject}
          position={popupPosition}
          onClose={closePopup}
          onViewProject={() => {
            onProjectClick?.(popupProject.id)
            closePopup()
          }}
        />
      )}

      {/* Legend */}
      <div className={`absolute bottom-4 z-[1000] transition-all duration-300 ${sidebarOpen ? 'left-4 lg:left-[356px]' : 'left-4'}`}>
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm border border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center gap-5 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS.completed.primary }} />
              <span className="text-stone-500">Terminé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS['in-progress'].primary }} />
              <span className="text-stone-500">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS.funding.primary }} />
              <span className="text-stone-500">Financement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="absolute inset-0 bg-black/20 z-[999] lg:hidden"
          style={{ top: '56px' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
