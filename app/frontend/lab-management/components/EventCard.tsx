import type { Event, Member, EventType } from '../types'

interface EventCardProps {
  event: Event
  members: Member[]
  onView?: () => void
}

// Helper function to get event type label
function getEventTypeLabel(type: string): string {
  return type || 'Événement'
}

function formatEventDate(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }

  const startDateStr = start.toLocaleDateString('fr-FR', dateOptions)
  const startTimeStr = start.toLocaleTimeString('fr-FR', timeOptions)
  const endTimeStr = end.toLocaleTimeString('fr-FR', timeOptions)

  // Check if multi-day event
  if (start.toDateString() !== end.toDateString()) {
    const endDateStr = end.toLocaleDateString('fr-FR', dateOptions)
    return `${startDateStr} - ${endDateStr}`
  }

  return `${startDateStr} · ${startTimeStr} - ${endTimeStr}`
}

export function EventCard({ event, members, onView }: EventCardProps) {
  const attendees = members.filter((m) => event.attendeeIds.includes(m.id))

  return (
    <button
      onClick={onView}
      className={`
        w-full text-left p-3 rounded-lg border border-stone-200 dark:border-stone-700
        hover:border-stone-300 dark:hover:border-stone-600
        hover:shadow-sm transition-all
        bg-white dark:bg-stone-800/50
      `}
    >
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
          {getEventTypeLabel(event.type)}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-stone-800 dark:text-stone-100 mb-1 line-clamp-1">
        {event.title}
      </h4>

      {/* Date & Time */}
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
        {formatEventDate(event.startDate, event.endDate)}
      </p>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="truncate">{event.location}</span>
      </div>

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {attendees.slice(0, 4).map((member) => (
              <img
                key={member.id}
                src={member.avatar}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-stone-800 bg-stone-100"
              />
            ))}
          </div>
          {attendees.length > 4 && (
            <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
              +{attendees.length - 4}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
