import type { Timesheet, Member, Guild, TimesheetCategory } from '../types'

const formatNumber = (n: number, decimals = 1) => {
  return n.toFixed(decimals).replace('.', ',')
}

export interface TimesheetRowProps {
  timesheet: Timesheet
  member?: Member
  guild?: Guild
  showMember?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onMarkInvoiced?: () => void
  onViewMember?: () => void
  onViewGuild?: () => void
}

const categoryLabels: Record<TimesheetCategory, string> = {
  design: 'Design',
  formation: 'Formation',
  administratif: 'Administratif',
  coordination: 'Coordination',
  communication: 'Communication',
}

const categoryColors: Record<TimesheetCategory, { bg: string; text: string; darkBg: string; darkText: string }> = {
  design: {
    bg: 'bg-[#AFBD00]/10',
    text: 'text-[#8a9600]',
    darkBg: '',
    darkText: '',
  },
  formation: {
    bg: 'bg-[#B01A19]/10',
    text: 'text-[#B01A19]',
    darkBg: '',
    darkText: '',
  },
  administratif: {
    bg: 'bg-[#5B5781]/10',
    text: 'text-[#5B5781]',
    darkBg: '',
    darkText: '',
  },
  coordination: {
    bg: 'bg-[#234766]/10',
    text: 'text-[#234766]',
    darkBg: '',
    darkText: '',
  },
  communication: {
    bg: 'bg-[#EF9B0D]/10',
    text: 'text-[#c47f00]',
    darkBg: '',
    darkText: '',
  },
}

export function TimesheetRow({
  timesheet,
  member,
  guild,
  showMember = false,
  onEdit,
  onDelete,
  onMarkInvoiced,
  onViewMember,
  onViewGuild,
}: TimesheetRowProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const colors = categoryColors[timesheet.category]

  return (
    <div className="group px-4 sm:px-6 py-4 hover:bg-stone-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Date and member info */}
        <div className="flex items-center gap-3 sm:w-44 flex-shrink-0">
          {/* Date badge */}
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-stone-500 uppercase">
              {new Date(timesheet.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
            </span>
            <span className="text-lg font-bold text-stone-700 leading-tight">
              {new Date(timesheet.date).getDate()}
            </span>
          </div>

          {/* Member avatar (admin view) */}
          {showMember && member && (
            <button
              onClick={onViewMember}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src={member.avatar}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-8 h-8 rounded-full border border-stone-200 bg-stone-100"
              />
              <span className="text-sm font-medium text-stone-700 hidden lg:block">
                {member.firstName}
              </span>
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <p className="text-stone-800 font-medium line-clamp-1">{timesheet.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Category badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
            >
              {categoryLabels[timesheet.category]}
            </span>

            {/* Guild link */}
            {guild && (
              <button
                onClick={onViewGuild}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#5B5781] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {guild.name}
              </button>
            )}

            {/* Project or course reference */}
            {timesheet.projectId && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Projet
              </span>
            )}

            {timesheet.courseId && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Formation
              </span>
            )}

            {/* Kilometers */}
            {timesheet.kilometers > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                {timesheet.kilometers} km
              </span>
            )}
          </div>
        </div>

        {/* Right side - Hours, payment, status */}
        <div className="flex items-center gap-3 sm:gap-4 sm:flex-shrink-0 ml-15 sm:ml-0">
          {/* Hours */}
          <div className="text-right">
            <span className="text-lg font-bold text-stone-800 tabular-nums">
              {formatNumber(timesheet.hours)}
            </span>
            <span className="text-sm text-stone-500 ml-0.5">h</span>
          </div>

          {/* Payment type */}
          <div
            className={`w-16 text-center py-1 rounded-lg text-[11px] font-medium uppercase tracking-wide ${
              timesheet.paymentType === 'invoice'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {timesheet.paymentType === 'invoice' ? 'Facture' : 'Semos'}
          </div>

          {/* Invoiced status */}
          <button
            onClick={onMarkInvoiced}
            disabled={timesheet.invoiced}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              timesheet.invoiced
                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                : 'bg-stone-100 text-stone-400 hover:bg-[#5B5781]/10 hover:text-[#5B5781]'
            }`}
            title={timesheet.invoiced ? 'Facturée' : 'Marquer comme facturée'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={timesheet.invoiced ? 'M5 13l4 4L19 7' : 'M9 12l2 2 4-4'}
              />
            </svg>
          </button>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10 transition-colors"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
