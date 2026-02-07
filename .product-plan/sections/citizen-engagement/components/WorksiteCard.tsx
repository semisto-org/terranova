import type { Worksite } from '../types'

interface WorksiteCardProps {
  worksite: Worksite
  onJoin?: () => void
  onView?: () => void
}

export function WorksiteCard({ worksite, onJoin, onView }: WorksiteCardProps) {
  const isFull = worksite.status === 'full'
  const spotsLeft = worksite.maxParticipants - worksite.currentParticipants
  const fillPercentage = (worksite.currentParticipants / worksite.maxParticipants) * 100

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-BE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-900/80
        border border-stone-200 dark:border-stone-700
        hover:shadow-lg hover:shadow-green-500/10
        transition-all duration-300
        ${isFull ? 'opacity-75' : ''}
      `}
    >
      {/* Date badge - floating style */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-600">
          <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">
            {new Date(worksite.date).toLocaleDateString('fr-BE', { month: 'short' })}
          </span>
          <span className="text-xl font-bold text-stone-900 dark:text-white leading-none">
            {new Date(worksite.date).getDate()}
          </span>
        </div>
      </div>

      {/* Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={worksite.imageUrl}
          alt={worksite.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        {isFull && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold">
            Complet
          </div>
        )}
        {!isFull && spotsLeft <= 5 && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold animate-pulse">
            {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4
          className="font-semibold text-stone-900 dark:text-white text-base leading-snug mb-1.5 line-clamp-2 cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors"
          onClick={onView}
        >
          {worksite.title}
        </h4>

        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 mb-3">
          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{worksite.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 mb-4">
          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{worksite.startTime} - {worksite.endTime}</span>
        </div>

        {/* Participants progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-600 dark:text-stone-400">
              <span className="font-semibold text-stone-900 dark:text-white">{worksite.currentParticipants}</span>
              /{worksite.maxParticipants} participants
            </span>
          </div>
          <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-orange-500'
                  : fillPercentage > 80
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onJoin}
          disabled={isFull}
          className={`
            w-full py-2 px-4 rounded-xl font-semibold text-sm
            transition-all duration-200
            ${isFull
              ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98]'
            }
          `}
        >
          {isFull ? 'Liste d\'attente' : 'Je participe'}
        </button>
      </div>
    </div>
  )
}
