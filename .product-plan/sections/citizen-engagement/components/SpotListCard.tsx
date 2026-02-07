import type { Spot, SpotStatus, SpotType } from '../types'

interface SpotListCardProps {
  spot: Spot
  onView?: () => void
}

const statusConfig: Record<SpotStatus, { label: string; color: string; bgColor: string }> = {
  identifie: {
    label: 'Identifié',
    color: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-800',
  },
  valide: {
    label: 'Validé',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
  },
  assigne: {
    label: 'Assigné',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
  },
  plante: {
    label: 'Planté',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
}

const typeConfig: Record<SpotType, { label: string; emoji: string }> = {
  haie: { label: 'Haie', emoji: '🌿' },
  surface: { label: 'Surface', emoji: '🌳' },
  arbre_isole: { label: 'Arbre isolé', emoji: '🌲' },
}

export function SpotListCard({ spot, onView }: SpotListCardProps) {
  const status = statusConfig[spot.status]
  const type = typeConfig[spot.type]

  // Get dimension display
  const dimension = spot.type === 'haie' && spot.lengthMeters
    ? `${spot.lengthMeters} m`
    : spot.type === 'surface' && spot.areaSquareMeters
    ? `${(spot.areaSquareMeters / 10000).toFixed(2)} ha`
    : null

  return (
    <button
      onClick={onView}
      className="
        group w-full text-left
        bg-white dark:bg-stone-900
        rounded-2xl border border-stone-200 dark:border-stone-700
        overflow-hidden
        hover:border-stone-300 dark:hover:border-stone-600
        hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
        transition-all duration-300
      "
    >
      <div className="flex">
        {/* Image thumbnail */}
        <div className="relative w-28 sm:w-36 flex-shrink-0">
          {spot.photos.length > 0 ? (
            <img
              src={spot.photos[0]}
              alt={`${type.label} ${spot.id}`}
              className="w-full h-full object-cover aspect-square"
            />
          ) : (
            <div className="w-full h-full aspect-square bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center">
              <span className="text-3xl opacity-50">{type.emoji}</span>
            </div>
          )}

          {/* Status badge overlay */}
          <div className={`
            absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium
            ${status.bgColor} ${status.color}
          `}>
            {status.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Type and dimension */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{type.emoji}</span>
              <span className="font-medium text-stone-900 dark:text-white">
                {type.label}
              </span>
              {dimension && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">·</span>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {dimension}
                  </span>
                </>
              )}
            </div>

            {/* Soil and exposure */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {spot.soilType !== 'inconnu' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400">
                  Sol {spot.soilType}
                </span>
              )}
              {spot.exposure !== 'inconnu' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400">
                  Expo {spot.exposure}
                </span>
              )}
            </div>

            {/* Species if planted */}
            {spot.speciesPlanted.length > 0 && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {spot.speciesPlanted.slice(0, 3).join(', ')}
                {spot.speciesPlanted.length > 3 && ` +${spot.speciesPlanted.length - 3}`}
              </p>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-3">
            {/* Validation count */}
            <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{spot.validationCount} validations</span>
            </div>

            {/* Arrow */}
            <div className="
              w-8 h-8 rounded-full
              bg-stone-100 dark:bg-stone-800
              flex items-center justify-center
              group-hover:bg-emerald-500 group-hover:text-white
              transition-all duration-300
            ">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
