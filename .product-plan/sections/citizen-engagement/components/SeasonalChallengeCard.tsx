import type { SeasonalChallenge } from '../types'

interface SeasonalChallengeCardProps {
  challenge: SeasonalChallenge
  onView?: () => void
}

export function SeasonalChallengeCard({ challenge, onView }: SeasonalChallengeCardProps) {
  const isActive = challenge.status === 'active'
  const isCompleted = challenge.status === 'completed'
  const isUpcoming = challenge.status === 'upcoming'

  const typeConfig = {
    plantation: {
      icon: '🌳',
      gradient: 'from-green-500 to-emerald-600',
      bgPattern: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-400/20 via-transparent to-transparent',
    },
    cartographie: {
      icon: '🗺️',
      gradient: 'from-blue-500 to-indigo-600',
      bgPattern: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent',
    },
    formation: {
      icon: '🎓',
      gradient: 'from-violet-500 to-purple-600',
      bgPattern: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-400/20 via-transparent to-transparent',
    },
  }

  const config = typeConfig[challenge.type]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getDaysInfo = () => {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    const now = new Date()

    if (isUpcoming) {
      const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return `Commence dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
    }
    if (isActive) {
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
    }
    return 'Terminé'
  }

  return (
    <button
      onClick={onView}
      className={`
        group relative w-full overflow-hidden rounded-2xl p-5 text-left
        bg-white dark:bg-stone-900
        border border-stone-200 dark:border-stone-700
        hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
        transition-all duration-300
        hover:-translate-y-1
        ${isCompleted ? 'opacity-80' : ''}
      `}
    >
      {/* Background pattern */}
      <div className={`absolute inset-0 ${config.bgPattern} opacity-50 dark:opacity-30`} />

      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        {isActive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            En cours
          </span>
        )}
        {isUpcoming && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            À venir
          </span>
        )}
        {isCompleted && (
          <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-semibold">
            Terminé
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        {/* Icon */}
        <div className="text-4xl mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3">
          {config.icon}
        </div>

        {/* Title */}
        <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-1 pr-20 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {challenge.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-4">
          {challenge.description}
        </p>

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className={isActive ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
            {getDaysInfo()}
          </span>
        </div>

        {/* Rankings (if completed) */}
        {isCompleted && challenge.rankings.length > 0 && (
          <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 mb-4">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Podium final</p>
            <div className="flex items-center gap-4">
              {challenge.rankings.slice(0, 3).map((ranking, index) => (
                <div key={ranking.villageId} className="flex items-center gap-2">
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {ranking.villageName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {ranking.score} pts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prizes */}
        <div className="flex flex-wrap gap-2">
          {challenge.prizes.slice(0, 2).map((prize, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs"
            >
              <span>🏆</span>
              {prize}
            </span>
          ))}
          {challenge.prizes.length > 2 && (
            <span className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs">
              +{challenge.prizes.length - 2} prix
            </span>
          )}
        </div>
      </div>

      {/* Hover effect line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
    </button>
  )
}
