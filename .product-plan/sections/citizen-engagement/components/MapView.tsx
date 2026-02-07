import { useState } from 'react'
import type { MapViewProps, Village, Spot, VillageBadge } from '../types'

// Badge configuration for styling
const badgeConfig: Record<VillageBadge, { label: string; color: string; bgColor: string }> = {
  eveil: { label: 'En éveil', color: '#fbbf24', bgColor: '#fef3c7' },
  planteur: { label: 'Planteur', color: '#4ade80', bgColor: '#dcfce7' },
  nourricier: { label: 'Nourricier', color: '#16a34a', bgColor: '#bbf7d0' },
  resilient: { label: 'Résilient', color: '#059669', bgColor: '#a7f3d0' },
}

const spotStatusConfig = {
  identifie: { label: 'Identifié', color: '#fbbf24', dotColor: 'bg-amber-400' },
  valide: { label: 'Validé', color: '#3b82f6', dotColor: 'bg-blue-500' },
  assigne: { label: 'Assigné', color: '#8b5cf6', dotColor: 'bg-violet-500' },
  plante: { label: 'Planté', color: '#16a34a', dotColor: 'bg-green-600' },
}

const spotTypeIcons = {
  haie: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M3 12h18M3 12c0-2 2-4 4-4s4 2 4 4M11 12c0-2 2-4 4-4s4 2 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 12v6M9 12v6M13 12v6M17 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  surface: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M4 15l4-6 4 4 4-5 4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  arbre_isole: (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M12 3l6 8H6l6-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 7l4 6H8l4-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 13v8M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

interface MapLegendProps {
  showSpots: boolean
  onToggleSpots: () => void
}

function MapLegend({ showSpots, onToggleSpots }: MapLegendProps) {
  return (
    <div className="absolute bottom-6 left-6 z-20">
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700/50 p-5 max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100 tracking-wide uppercase">Légende</h3>
          <button
            onClick={onToggleSpots}
            className="text-xs px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {showSpots ? 'Masquer spots' : 'Afficher spots'}
          </button>
        </div>

        {/* Village badges */}
        <div className="mb-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2.5 font-medium">Villages</p>
          <div className="space-y-2">
            {Object.entries(badgeConfig).map(([key, { label, color }]) => (
              <div key={key} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-stone-900"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
                />
                <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spot statuses */}
        {showSpots && (
          <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2.5 font-medium">Spots</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(spotStatusConfig).map(([key, { label, dotColor }]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MapFiltersProps {
  selectedBadgeFilter: VillageBadge | null
  onBadgeFilterChange: (badge: VillageBadge | null) => void
  spotTypeFilter: string | null
  onSpotTypeFilterChange: (type: string | null) => void
}

function MapFilters({ selectedBadgeFilter, onBadgeFilterChange, spotTypeFilter, onSpotTypeFilterChange }: MapFiltersProps) {
  return (
    <div className="absolute top-6 left-6 z-20">
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700/50 p-4">
        <div className="flex items-center gap-3">
          {/* Badge filter pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onBadgeFilterChange(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedBadgeFilter === null
                  ? 'bg-stone-800 text-white dark:bg-white dark:text-stone-900'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Tous
            </button>
            {Object.entries(badgeConfig).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => onBadgeFilterChange(key as VillageBadge)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedBadgeFilter === key
                    ? 'text-white shadow-md'
                    : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
                style={selectedBadgeFilter === key ? { backgroundColor: color } : { color }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />

          {/* Spot type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 dark:text-stone-400 mr-1">Type:</span>
            {Object.entries(spotTypeIcons).map(([type, icon]) => (
              <button
                key={type}
                onClick={() => onSpotTypeFilterChange(spotTypeFilter === type ? null : type)}
                className={`p-2 rounded-lg transition-all ${
                  spotTypeFilter === type
                    ? 'bg-[#5B5781] text-white'
                    : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
                title={type === 'haie' ? 'Haies' : type === 'surface' ? 'Surfaces' : 'Arbres isolés'}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface VillagePopupProps {
  village: Village
  spotsInVillage: Spot[]
  onClose: () => void
  onViewDetail: () => void
}

function VillagePopup({ village, spotsInVillage, onClose, onViewDetail }: VillagePopupProps) {
  const config = badgeConfig[village.badge]
  const plantedPercent = Math.round((village.hectaresPlanted / village.hectaresPotential) * 100)

  return (
    <div className="absolute z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden w-80">
        {/* Header with badge color */}
        <div
          className="px-5 py-4 relative overflow-hidden"
          style={{ backgroundColor: config.bgColor }}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#dots)" style={{ color: config.color }}/>
            </svg>
          </div>

          <div className="relative flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-stone-900">{village.name}</h3>
              <p className="text-sm text-stone-600">{village.region}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
            >
              <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: config.color, color: 'white' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {config.label}
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900 dark:text-white">{village.activeCitizens}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Citoyens</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900 dark:text-white">{village.spotsIdentified}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Spots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900 dark:text-white">{village.hectaresPlanted}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">Hectares</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-600 dark:text-stone-400">Progression</span>
              <span className="font-semibold text-stone-900 dark:text-white">{plantedPercent}%</span>
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${plantedPercent}%`, backgroundColor: config.color }}
              />
            </div>
          </div>

          {/* Ambassador */}
          {village.ambassadorName && (
            <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B5781] to-[#AFBD00] flex items-center justify-center text-white font-bold">
                {village.ambassadorName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-white">{village.ambassadorName}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Ambassadeur</p>
              </div>
            </div>
          )}

          {/* Spots summary */}
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-4">
            {Object.entries(spotStatusConfig).map(([status, { label, dotColor }]) => {
              const count = spotsInVillage.filter(s => s.status === status).length
              if (count === 0) return null
              return (
                <span key={status} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  {count} {label.toLowerCase()}
                </span>
              )
            })}
          </div>

          {/* Action button */}
          <button
            onClick={onViewDetail}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#5B5781' }}
          >
            Explorer le village →
          </button>
        </div>
      </div>
    </div>
  )
}

interface SpotPopupProps {
  spot: Spot
  village: Village
  onClose: () => void
  onViewDetail: () => void
  onValidate?: () => void
  canValidate: boolean
}

function SpotPopup({ spot, village, onClose, onViewDetail, onValidate, canValidate }: SpotPopupProps) {
  const statusConfig = spotStatusConfig[spot.status]
  const typeIcon = spotTypeIcons[spot.type]

  const getSize = () => {
    if (spot.lengthMeters) return `${spot.lengthMeters}m linéaires`
    if (spot.areaSquareMeters) return `${(spot.areaSquareMeters / 10000).toFixed(2)} ha`
    return 'Arbre isolé'
  }

  return (
    <div className="absolute z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden w-72">
        {/* Photo header */}
        {spot.photos.length > 0 ? (
          <div className="relative h-32">
            <img src={spot.photos[0]} alt="Spot" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: statusConfig.color }}
              >
                {statusConfig.label}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                {typeIcon}
                {spot.type === 'haie' ? 'Haie' : spot.type === 'surface' ? 'Surface' : 'Arbre'}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-24 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center">
            <div className="text-stone-400 dark:text-stone-500">
              {typeIcon}
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-200/80 dark:bg-stone-700/80 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              <svg className="w-4 h-4 text-stone-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: statusConfig.color }}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">{village.name}</p>
          <p className="text-lg font-bold text-stone-900 dark:text-white mb-3">{getSize()}</p>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <p className="text-xs text-stone-500 dark:text-stone-400">Sol</p>
              <p className="text-sm font-medium text-stone-900 dark:text-white capitalize">{spot.soilType}</p>
            </div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <p className="text-xs text-stone-500 dark:text-stone-400">Exposition</p>
              <p className="text-sm font-medium text-stone-900 dark:text-white capitalize">{spot.exposure}</p>
            </div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <p className="text-xs text-stone-500 dark:text-stone-400">Propriété</p>
              <p className="text-sm font-medium text-stone-900 dark:text-white capitalize">{spot.landOwnership}</p>
            </div>
            <div className="p-2.5 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
              <p className="text-xs text-stone-500 dark:text-stone-400">Validations</p>
              <p className="text-sm font-medium text-stone-900 dark:text-white">{spot.validationCount}</p>
            </div>
          </div>

          {/* Opportunity score */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-stone-500 dark:text-stone-400">Score d'opportunité:</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i <= spot.opportunityScore ? 'text-amber-400' : 'text-stone-200 dark:text-stone-700'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onViewDetail}
              className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5B5781' }}
            >
              Détails
            </button>
            {canValidate && spot.status === 'identifie' && (
              <button
                onClick={onValidate}
                className="py-2 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#AFBD00' }}
              >
                Valider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MapStatsBarProps {
  villages: Village[]
  spots: Spot[]
}

function MapStatsBar({ villages, spots }: MapStatsBarProps) {
  const totalCitizens = villages.reduce((sum, v) => sum + v.activeCitizens, 0)
  const totalHectaresPlanted = villages.reduce((sum, v) => sum + v.hectaresPlanted, 0)
  const spotsPlanted = spots.filter(s => s.status === 'plante').length

  return (
    <div className="absolute top-6 right-6 z-20">
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/50 dark:border-stone-700/50 px-5 py-3">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xl font-bold text-stone-900 dark:text-white">{villages.length}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Villages</p>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
          <div className="text-center">
            <p className="text-xl font-bold text-stone-900 dark:text-white">{totalCitizens}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Citoyens</p>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
          <div className="text-center">
            <p className="text-xl font-bold text-stone-900 dark:text-white">{spots.length}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Spots</p>
          </div>
          <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
          <div className="text-center">
            <p className="text-xl font-bold text-[#AFBD00]">{totalHectaresPlanted.toFixed(1)}</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Ha plantés</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MapView({
  villages,
  spots,
  selectedVillageId,
  currentCitizen,
  onSelectVillage,
  onSelectSpot,
  onReportSpot,
  onValidateSpot,
}: MapViewProps) {
  const [showSpots, setShowSpots] = useState(true)
  const [badgeFilter, setBadgeFilter] = useState<VillageBadge | null>(null)
  const [spotTypeFilter, setSpotTypeFilter] = useState<string | null>(null)
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null)
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [isReportMode, setIsReportMode] = useState(false)

  // Filter villages
  const filteredVillages = badgeFilter
    ? villages.filter(v => v.badge === badgeFilter)
    : villages

  // Filter spots
  const filteredSpots = spots.filter(s => {
    if (!showSpots) return false
    if (spotTypeFilter && s.type !== spotTypeFilter) return false
    if (selectedVillageId && s.villageId !== selectedVillageId) return false
    return true
  })

  // Calculate map bounds and positions (simplified for visualization)
  const getVillagePosition = (village: Village, index: number) => {
    // Create a visually pleasing distribution based on coordinates
    const normalizedLat = ((village.coordinates.lat - 50.3) / 0.2) * 60 + 20
    const normalizedLng = ((village.coordinates.lng - 5.0) / 0.4) * 60 + 20
    return {
      top: `${Math.min(80, Math.max(15, 100 - normalizedLat))}%`,
      left: `${Math.min(85, Math.max(15, normalizedLng))}%`
    }
  }

  const getSpotPosition = (spot: Spot) => {
    let lng: number, lat: number
    if (spot.geometry.type === 'Point') {
      [lng, lat] = spot.geometry.coordinates
    } else if (spot.geometry.type === 'LineString') {
      [lng, lat] = spot.geometry.coordinates[0]
    } else {
      [lng, lat] = spot.geometry.coordinates[0][0]
    }
    const normalizedLat = ((lat - 50.3) / 0.2) * 60 + 20
    const normalizedLng = ((lng - 5.0) / 0.4) * 60 + 20
    return {
      top: `${Math.min(85, Math.max(10, 100 - normalizedLat))}%`,
      left: `${Math.min(90, Math.max(10, normalizedLng))}%`
    }
  }

  const handleVillageClick = (village: Village) => {
    if (selectedSpot) setSelectedSpot(null)
    setSelectedVillage(selectedVillage?.id === village.id ? null : village)
  }

  const handleSpotClick = (spot: Spot) => {
    if (selectedVillage) setSelectedVillage(null)
    setSelectedSpot(selectedSpot?.id === spot.id ? null : spot)
  }

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[600px] bg-stone-100 dark:bg-stone-950 overflow-hidden rounded-2xl">
      {/* Map background with stylized terrain */}
      <div className="absolute inset-0">
        {/* Base gradient representing terrain */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 dark:from-emerald-950 dark:via-stone-950 dark:to-amber-950" />

        {/* Topographic lines pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="topo" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path
                d="M0,50 Q25,30 50,50 T100,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-emerald-600 dark:text-emerald-400"
              />
              <path
                d="M0,70 Q30,50 60,70 T100,70"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-emerald-600 dark:text-emerald-400"
              />
              <path
                d="M0,30 Q20,10 50,30 T100,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-emerald-600 dark:text-emerald-400"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)" />
        </svg>

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <svg className="w-full h-full">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" opacity="0.4"/>
          </svg>
        </div>

        {/* Region labels */}
        <div className="absolute top-1/4 left-1/4 text-stone-400/50 dark:text-stone-600/50 text-xs tracking-[0.3em] uppercase font-light transform -rotate-12">
          Province de Namur
        </div>
        <div className="absolute top-1/3 right-1/4 text-stone-400/50 dark:text-stone-600/50 text-xs tracking-[0.3em] uppercase font-light transform rotate-6">
          Province de Liège
        </div>
      </div>

      {/* Map controls */}
      <MapFilters
        selectedBadgeFilter={badgeFilter}
        onBadgeFilterChange={setBadgeFilter}
        spotTypeFilter={spotTypeFilter}
        onSpotTypeFilterChange={setSpotTypeFilter}
      />

      <MapStatsBar villages={filteredVillages} spots={filteredSpots} />
      <MapLegend showSpots={showSpots} onToggleSpots={() => setShowSpots(!showSpots)} />

      {/* Report spot button */}
      {currentCitizen && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={() => setIsReportMode(!isReportMode)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${
              isReportMode
                ? 'bg-amber-500 text-white'
                : 'bg-[#5B5781] text-white hover:bg-[#4a4669]'
            }`}
          >
            {isReportMode ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Signaler un spot
              </>
            )}
          </button>
        </div>
      )}

      {/* Report mode overlay */}
      {isReportMode && (
        <div className="absolute inset-0 z-10 cursor-crosshair" onClick={() => onReportSpot?.({ type: 'Point', coordinates: [5.2, 50.4] })}>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              Cliquez sur la carte pour placer un spot
            </div>
          </div>
        </div>
      )}

      {/* Village markers */}
      {filteredVillages.map((village, index) => {
        const position = getVillagePosition(village, index)
        const config = badgeConfig[village.badge]
        const isSelected = selectedVillage?.id === village.id

        return (
          <div key={village.id}>
            {/* Village marker */}
            <button
              onClick={() => handleVillageClick(village)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110'
              }`}
              style={{ top: position.top, left: position.left }}
            >
              {/* Pulse animation for selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: config.color }}
                />
              )}

              {/* Main marker */}
              <div
                className="relative w-12 h-12 rounded-full border-4 border-white dark:border-stone-900 shadow-lg flex items-center justify-center text-white font-bold text-sm"
                style={{
                  backgroundColor: config.color,
                  boxShadow: `0 4px 20px ${config.color}50`
                }}
              >
                {village.activeCitizens}
              </div>

              {/* Village name label */}
              <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded shadow-sm">
                  {village.name}
                </span>
              </div>
            </button>

            {/* Village popup */}
            {isSelected && (
              <div style={{ position: 'absolute', top: `calc(${position.top} + 40px)`, left: position.left, transform: 'translateX(-50%)' }}>
                <VillagePopup
                  village={village}
                  spotsInVillage={spots.filter(s => s.villageId === village.id)}
                  onClose={() => setSelectedVillage(null)}
                  onViewDetail={() => {
                    onSelectVillage?.(village.id)
                    setSelectedVillage(null)
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Spot markers */}
      {showSpots && filteredSpots.map(spot => {
        const position = getSpotPosition(spot)
        const statusConfig = spotStatusConfig[spot.status]
        const isSelected = selectedSpot?.id === spot.id
        const village = villages.find(v => v.id === spot.villageId)

        return (
          <div key={spot.id}>
            {/* Spot marker */}
            <button
              onClick={() => handleSpotClick(spot)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                isSelected ? 'scale-150 z-20' : 'z-5 hover:scale-125'
              }`}
              style={{ top: position.top, left: position.left }}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-white dark:border-stone-900 shadow-md ${statusConfig.dotColor}`}
                style={{ boxShadow: `0 2px 8px ${statusConfig.color}40` }}
              />
            </button>

            {/* Spot popup */}
            {isSelected && village && (
              <div style={{ position: 'absolute', top: `calc(${position.top} + 20px)`, left: position.left, transform: 'translateX(-50%)' }}>
                <SpotPopup
                  spot={spot}
                  village={village}
                  onClose={() => setSelectedSpot(null)}
                  onViewDetail={() => {
                    onSelectSpot?.(spot.id)
                    setSelectedSpot(null)
                  }}
                  onValidate={() => onValidateSpot?.(spot.id)}
                  canValidate={!!currentCitizen}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Compass rose */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 opacity-40">
        <svg className="w-16 h-16 text-stone-600 dark:text-stone-400" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <path d="M50,10 L55,45 L50,50 L45,45 Z" fill="currentColor" opacity="0.8"/>
          <path d="M50,90 L55,55 L50,50 L45,55 Z" fill="currentColor" opacity="0.3"/>
          <path d="M10,50 L45,55 L50,50 L45,45 Z" fill="currentColor" opacity="0.3"/>
          <path d="M90,50 L55,55 L50,50 L55,45 Z" fill="currentColor" opacity="0.3"/>
          <text x="50" y="8" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">N</text>
        </svg>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-6 left-40 z-10 opacity-60">
        <div className="flex flex-col items-start gap-1">
          <div className="w-24 h-1 bg-stone-600 dark:bg-stone-400 rounded" />
          <span className="text-xs text-stone-600 dark:text-stone-400">~10 km</span>
        </div>
      </div>
    </div>
  )
}
