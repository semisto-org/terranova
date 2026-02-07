import type { Event } from '../types'

interface EventCardProps {
  event: Event
  onView?: () => void
}

const eventTypeStyles: Record<string, { emoji: string; color: string; bgColor: string }> = {
  'conférence': { emoji: '🎤', color: '#5B5781', bgColor: '#c8bfd2' },
  'visite': { emoji: '🌳', color: '#AFBD00', bgColor: '#e1e6d8' },
  'atelier': { emoji: '🛠️', color: '#EF9B0D', bgColor: '#fbe6c3' }
}

export function EventCard({ event, onView }: EventCardProps) {
  const typeStyle = eventTypeStyles[event.type] || eventTypeStyles['atelier']
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase(),
      year: date.getFullYear()
    }
  }
  
  const dateInfo = formatDate(event.date)
  const isFree = event.price === 0

  return (
    <button
      onClick={onView}
      className="group relative flex bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full"
    >
      {/* Date column */}
      <div 
        className="flex flex-col items-center justify-center px-6 py-8 min-w-[100px]"
        style={{ backgroundColor: typeStyle.bgColor }}
      >
        <span 
          className="text-4xl font-bold leading-none"
          style={{ color: typeStyle.color }}
        >
          {dateInfo.day}
        </span>
        <span 
          className="text-sm font-semibold mt-1"
          style={{ color: typeStyle.color }}
        >
          {dateInfo.month}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-5">
        {/* Type badge */}
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: typeStyle.bgColor, color: typeStyle.color }}
          >
            {typeStyle.emoji} {event.type}
          </span>
          {isFree && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Gratuit
            </span>
          )}
        </div>
        
        {/* Title */}
        <h3 
          className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-[#5B5781] transition-colors line-clamp-2"
          style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
        >
          {event.title}
        </h3>
        
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {event.time} · {event.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {event.location}
          </span>
        </div>
        
        {/* Spots indicator */}
        {event.spotsAvailable <= 10 && (
          <div className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
            ⚡ Plus que {event.spotsAvailable} places
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div className="flex items-center px-4 text-stone-300 dark:text-stone-600 group-hover:text-[#5B5781] transition-colors">
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

