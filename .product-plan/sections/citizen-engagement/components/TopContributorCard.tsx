import type { Citizen, BadgeName } from '../types'

interface TopContributorCardProps {
  citizen: Citizen
  rank: number
  metric: 'hours' | 'spots' | 'donations'
  onView?: () => void
}

const badgeIcons: Record<BadgeName, string> = {
  explorateur: '🧭',
  cartographe: '🗺️',
  planteur: '🌱',
  parrain: '💚',
  mentor: '🎓',
  transmetteur: '📖',
}

export function TopContributorCard({ citizen, rank, metric, onView }: TopContributorCardProps) {
  const getMetricValue = () => {
    switch (metric) {
      case 'hours':
        return { value: citizen.hoursContributed, label: 'heures', suffix: 'h' }
      case 'spots':
        return { value: citizen.spotsReported, label: 'spots', suffix: '' }
      case 'donations':
        return { value: citizen.totalDonations, label: 'dons', suffix: '€' }
    }
  }

  const metricInfo = getMetricValue()

  const rankStyles = {
    1: { medal: '🥇', ring: 'ring-2 ring-amber-400', glow: 'shadow-amber-500/20' },
    2: { medal: '🥈', ring: 'ring-2 ring-slate-300', glow: 'shadow-slate-400/20' },
    3: { medal: '🥉', ring: 'ring-2 ring-amber-600', glow: 'shadow-amber-600/20' },
  }[rank] || { medal: null, ring: '', glow: '' }

  return (
    <button
      onClick={onView}
      className={`
        group relative flex items-center gap-3 p-3 rounded-xl
        bg-white dark:bg-stone-900
        border border-stone-200 dark:border-stone-700
        hover:border-green-400 dark:hover:border-green-500
        hover:shadow-lg ${rankStyles.glow}
        transition-all duration-300
        hover:-translate-y-0.5
      `}
    >
      {/* Rank / Medal */}
      <div className="flex-shrink-0 relative">
        {rankStyles.medal ? (
          <span className="text-2xl">{rankStyles.medal}</span>
        ) : (
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <span className="text-sm font-bold text-stone-500 dark:text-stone-400">{rank}</span>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className={`relative flex-shrink-0 ${rankStyles.ring} rounded-full`}>
        <img
          src={citizen.avatarUrl}
          alt={`${citizen.firstName} ${citizen.lastName}`}
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-medium text-stone-900 dark:text-white text-sm truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {citizen.firstName} {citizen.lastName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {citizen.badges.slice(0, 3).map((badge) => (
            <span key={badge} className="text-xs" title={badge}>
              {badgeIcons[badge]}
            </span>
          ))}
          {citizen.badges.length > 3 && (
            <span className="text-xs text-stone-400">+{citizen.badges.length - 3}</span>
          )}
        </div>
      </div>

      {/* Metric */}
      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-green-600 dark:text-green-400">
          {metricInfo.value}{metricInfo.suffix}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {metricInfo.label}
        </p>
      </div>
    </button>
  )
}
