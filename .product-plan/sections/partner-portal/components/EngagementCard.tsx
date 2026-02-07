import type { Engagement } from '../types'

interface EngagementCardProps {
  engagement: Engagement
  onView?: () => void
}

const typeLabels: Record<string, string> = {
  'citizen-project': 'Projet Citoyen',
  'team-building': 'Team Building',
  'sponsorship': 'Parrainage',
  'recurring-patronage': 'Mécénat',
  'training': 'Formation',
  'ambassador': 'Ambassadeur',
}

export function EngagementCard({ engagement, onView }: EngagementCardProps) {
  const isCompleted = engagement.status === 'completed'
  const isActive = engagement.status === 'active'
  const completedEvents = engagement.events.filter(e => e.status === 'completed').length
  const totalEvents = engagement.events.length

  return (
    <button
      onClick={onView}
      className={`
        group w-full text-left rounded-2xl overflow-hidden
        bg-white dark:bg-stone-900
        border border-stone-200/80 dark:border-stone-800
        transition-all duration-300
        hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50
        hover:-translate-y-0.5
      `}
    >
      {/* Progress bar top */}
      <div className="h-1 bg-stone-100 dark:bg-stone-800">
        <div
          className="h-full transition-all duration-1000 ease-out rounded-r-full"
          style={{
            width: `${engagement.progress}%`,
            background: isCompleted
              ? '#22c55e'
              : 'linear-gradient(90deg, #5B5781, #AFBD00)',
          }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ background: isCompleted ? '#22c55e' : '#5B5781' }}
              >
                {isCompleted ? 'Terminé' : 'En cours'}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium uppercase tracking-wider">
                {typeLabels[engagement.packageType] || engagement.packageType}
              </span>
            </div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#5B5781] dark:group-hover:text-[#c8bfd2] transition-colors">
              {engagement.title}
            </h3>
          </div>

          <svg className="w-5 h-5 text-stone-300 dark:text-stone-600 flex-shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs text-stone-400 dark:text-stone-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {engagement.labName}
          </span>
          {engagement.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {engagement.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {engagement.totalBudget.toLocaleString('fr-BE')} €
          </span>
        </div>

        {/* Progress info */}
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-500 dark:text-stone-400">
            {completedEvents}/{totalEvents} étapes complétées
          </span>
          <span className="font-semibold text-stone-700 dark:text-stone-300">{engagement.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${engagement.progress}%`,
              background: isCompleted ? '#22c55e' : 'linear-gradient(90deg, #5B5781, #AFBD00)',
            }}
          />
        </div>

        {/* Next event */}
        {isActive && engagement.nextEvent && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-stone-700 flex-shrink-0 shadow-sm">
              <span className="text-[9px] font-medium uppercase text-stone-400 dark:text-stone-500 leading-none">
                {new Date(engagement.nextEvent.date).toLocaleDateString('fr-BE', { month: 'short' })}
              </span>
              <span className="text-sm font-bold text-stone-900 dark:text-white leading-none mt-0.5">
                {new Date(engagement.nextEvent.date).getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
                {engagement.nextEvent.title}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                {engagement.nextEvent.location}
              </p>
            </div>
          </div>
        )}

        {/* Documents & media count */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400 dark:text-stone-500">
          {engagement.documents.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {engagement.documents.length} document{engagement.documents.length > 1 ? 's' : ''}
            </span>
          )}
          {engagement.media.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {engagement.media.length} média{engagement.media.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
