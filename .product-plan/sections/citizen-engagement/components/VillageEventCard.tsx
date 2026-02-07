import type { Event, Worksite } from '../types'

type EventOrWorksite =
  | { type: 'event'; data: Event }
  | { type: 'worksite'; data: Worksite }

interface VillageEventCardProps {
  item: EventOrWorksite
  onView?: () => void
  onJoin?: () => void
}

export function VillageEventCard({ item, onView, onJoin }: VillageEventCardProps) {
  const isWorksite = item.type === 'worksite'
  const data = item.data

  // Common properties
  const title = data.title
  const date = new Date(data.date)
  const location = data.location
  const imageUrl = data.imageUrl
  const startTime = data.startTime
  const endTime = data.endTime

  // Worksite-specific
  const isFull = isWorksite && item.data.status === 'full'
  const spotsLeft = isWorksite ? item.data.maxParticipants - item.data.currentParticipants : 0
  const participants = isWorksite ? item.data.currentParticipants : 0
  const maxParticipants = isWorksite ? item.data.maxParticipants : null

  // Event-specific
  const requiresRegistration = !isWorksite && item.data.registrationRequired
  const currentAttendees = !isWorksite ? item.data.currentAttendees : 0
  const maxAttendees = !isWorksite ? item.data.maxAttendees : null

  // Format date
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const isUpcoming = date > new Date()
  const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="
      group relative
      bg-white dark:bg-stone-900
      rounded-2xl border border-stone-200 dark:border-stone-700
      overflow-hidden
      hover:border-stone-300 dark:hover:border-stone-600
      hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
      transition-all duration-300
    ">
      {/* Image header */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Date badge */}
        <div className="absolute top-4 left-4 bg-white dark:bg-stone-900 rounded-xl px-3 py-2 shadow-lg">
          <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
          </div>
          <div className="text-xl font-bold text-stone-900 dark:text-white text-center">
            {date.getDate()}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 uppercase text-center">
            {date.toLocaleDateString('fr-FR', { month: 'short' })}
          </div>
        </div>

        {/* Type badge */}
        <div className={`
          absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold
          ${isWorksite
            ? 'bg-emerald-500 text-white'
            : 'bg-blue-500 text-white'
          }
        `}>
          {isWorksite ? '🌱 Chantier' : '📅 Événement'}
        </div>

        {/* Countdown if soon */}
        {isUpcoming && daysUntil <= 7 && daysUntil > 0 && (
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
            Dans {daysUntil} jour{daysUntil > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>

        {/* Time and location */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{startTime} - {endTime}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Participants / Registration info */}
        {isWorksite && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-stone-600 dark:text-stone-400">
                {participants} / {maxParticipants} participants
              </span>
              {isFull ? (
                <span className="text-red-500 font-medium">Complet</span>
              ) : (
                <span className="text-emerald-500 font-medium">{spotsLeft} places restantes</span>
              )}
            </div>
            <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isFull ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${maxParticipants ? (participants / maxParticipants) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {!isWorksite && requiresRegistration && maxAttendees && (
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-stone-600 dark:text-stone-400">
              {currentAttendees} / {maxAttendees} inscrits
            </span>
            <span className={`font-medium ${
              currentAttendees >= maxAttendees ? 'text-red-500' : 'text-emerald-500'
            }`}>
              {currentAttendees >= maxAttendees ? 'Complet' : `${maxAttendees - currentAttendees} places`}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onView}
            className="
              flex-1 py-2.5 px-4 rounded-xl
              bg-stone-100 dark:bg-stone-800
              text-stone-700 dark:text-stone-300
              text-sm font-semibold
              hover:bg-stone-200 dark:hover:bg-stone-700
              transition-colors
            "
          >
            Voir détails
          </button>

          {isWorksite && !isFull && (
            <button
              onClick={onJoin}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-emerald-500 text-white
                text-sm font-semibold
                hover:bg-emerald-600
                shadow-lg shadow-emerald-500/25
                transition-all
                hover:scale-[1.02] active:scale-[0.98]
              "
            >
              S'inscrire
            </button>
          )}

          {!isWorksite && requiresRegistration && currentAttendees < (maxAttendees || Infinity) && (
            <button
              onClick={onJoin}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-blue-500 text-white
                text-sm font-semibold
                hover:bg-blue-600
                shadow-lg shadow-blue-500/25
                transition-all
                hover:scale-[1.02] active:scale-[0.98]
              "
            >
              S'inscrire
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
