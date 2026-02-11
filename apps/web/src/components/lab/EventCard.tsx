import type { Event, Member } from '@terranova/types'

interface EventCardProps {
  event: Event
  members: Member[]
  onViewEvent?: (eventId: string) => void
}

export function EventCard({ event, members, onViewEvent }: EventCardProps) {
  const attendees = members.filter((m) => event.attendeeIds.includes(m.id))
  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const isSameDay =
    startDate.toDateString() === endDate.toDateString()

  const typeColors: Record<string, string> = {
    project_meeting: 'bg-blue-100 text-blue-800',
    stakeholder_meeting: 'bg-purple-100 text-purple-800',
    design_day: 'bg-green-100 text-green-800',
    guild_meeting: 'bg-yellow-100 text-yellow-800',
    betting: 'bg-red-100 text-red-800',
    semisto_day: 'bg-indigo-100 text-indigo-800',
    semos_fest: 'bg-pink-100 text-pink-800',
    training: 'bg-orange-100 text-orange-800',
  }

  const typeColor = typeColors[event.type] || 'bg-gray-100 text-gray-800'

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
      onClick={onViewEvent ? () => onViewEvent(event.id) : undefined}
      style={{ cursor: onViewEvent ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{event.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{event.location}</p>
        </div>
        <span
          className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-medium ${typeColor}`}
        >
          {event.type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Date */}
      <div className="mt-3 text-sm text-gray-600">
        {isSameDay ? (
          <div>
            {startDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {' • '}
            {startDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
            {' - '}
            {endDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        ) : (
          <div>
            {startDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            {' - '}
            {endDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-2">
            {attendees.slice(0, 3).map((attendee) => (
              <div
                key={attendee.id}
                className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                title={`${attendee.firstName} ${attendee.lastName}`}
              >
                {attendee.firstName[0]}
                {attendee.lastName[0]}
              </div>
            ))}
          </div>
          {attendees.length > 3 && (
            <span className="text-xs text-gray-500">
              +{attendees.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
