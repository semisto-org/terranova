import type { Village, VillageBadge } from '../types'

interface VillageRankingRowProps {
  village: Village
  rank: number
  onView?: () => void
}

const badgeConfig: Record<VillageBadge, { label: string; color: string; bgColor: string; ringColor: string }> = {
  eveil: {
    label: 'En éveil',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    ringColor: 'ring-amber-400',
  },
  planteur: {
    label: 'Planteur',
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-100 dark:bg-lime-900/40',
    ringColor: 'ring-lime-400',
  },
  nourricier: {
    label: 'Nourricier',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    ringColor: 'ring-green-400',
  },
  resilient: {
    label: 'Résilient',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    ringColor: 'ring-emerald-400',
  },
}

export function VillageRankingRow({ village, rank, onView }: VillageRankingRowProps) {
  const badge = badgeConfig[village.badge]
  const progressPercent = Math.round((village.hectaresPlanted / village.hectaresPotential) * 100)

  return (
    <button
      onClick={onView}
      className="
        group w-full flex items-center gap-4 p-4 rounded-xl
        bg-white dark:bg-stone-900
        border border-stone-200 dark:border-stone-700
        hover:border-green-400 dark:hover:border-green-500
        hover:shadow-lg hover:shadow-green-500/10
        transition-all duration-300
        hover:-translate-y-0.5
      "
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
        <span className="font-bold text-stone-600 dark:text-stone-400 text-lg">
          {rank}
        </span>
      </div>

      {/* Village Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-stone-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {village.name}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
          {village.region}
        </p>
      </div>

      {/* Progress */}
      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-32">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-green-600 dark:text-green-400">
            {village.hectaresPlanted.toFixed(1)}
          </span>
          <span className="text-xs text-stone-400">
            / {village.hectaresPotential.toFixed(1)} ha
          </span>
        </div>
        <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 90
                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                : progressPercent >= 60
                  ? 'bg-gradient-to-r from-green-400 to-lime-500'
                  : progressPercent >= 30
                    ? 'bg-gradient-to-r from-lime-400 to-yellow-500'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 flex-shrink-0">
        <div className="text-center px-3">
          <p className="font-bold text-stone-900 dark:text-white">{village.activeCitizens}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">citoyens</p>
        </div>
        <div className="text-center px-3">
          <p className="font-bold text-stone-900 dark:text-white">{village.spotsPlanted}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">sites</p>
        </div>
      </div>

      {/* Arrow */}
      <svg
        className="w-5 h-5 text-stone-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
