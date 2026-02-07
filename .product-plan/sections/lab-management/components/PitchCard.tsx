import type { Pitch, Member, Appetite } from '../types'

interface PitchCardProps {
  pitch: Pitch
  author?: Member
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
  compact?: boolean
}

const appetiteLabels: Record<Appetite, { label: string; color: string }> = {
  '2-weeks': {
    label: '2 semaines',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  '3-weeks': {
    label: '3 semaines',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  '6-weeks': {
    label: '6 semaines',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
}

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
  raw: {
    label: 'Brouillon',
    color: 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300',
    icon: '📝',
  },
  shaped: {
    label: 'Cadré',
    color: 'bg-[#AFBD00]/20 text-[#7a8200] dark:bg-[#AFBD00]/30 dark:text-[#AFBD00]',
    icon: '✅',
  },
  betting: {
    label: 'En évaluation',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: '🎲',
  },
  building: {
    label: 'En construction',
    color: 'bg-[#5B5781]/20 text-[#5B5781] dark:bg-[#5B5781]/30 dark:text-[#c8bfd2]',
    icon: '🏗️',
  },
  completed: {
    label: 'Terminé',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: '🎉',
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: '❌',
  },
}

export function PitchCard({
  pitch,
  author,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  compact = false,
}: PitchCardProps) {
  const appetiteConfig = appetiteLabels[pitch.appetite]
  const statusConfig = statusLabels[pitch.status] || statusLabels.raw

  // Calculate completeness for shaped indicator
  const hasAllIngredients =
    pitch.problem &&
    pitch.solution &&
    pitch.rabbitHoles.length > 0 &&
    pitch.noGos.length > 0 &&
    (pitch.breadboard || pitch.fatMarkerSketch)

  if (compact) {
    return (
      <div
        onClick={onView}
        className="bg-white dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 p-3 hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">{statusConfig.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-stone-800 dark:text-stone-100 truncate">
              {pitch.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${appetiteConfig.color}`}>
                {appetiteConfig.label}
              </span>
              {author && (
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {author.firstName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden hover:border-stone-300 dark:hover:border-stone-600 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 dark:border-stone-700/50">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onView} className="flex-1 text-left hover:opacity-80 transition-opacity">
            <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2">
              {pitch.title}
            </h3>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${appetiteConfig.color}`}>
              {appetiteConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Author and date */}
        <div className="flex items-center gap-2 mt-3">
          {author && (
            <>
              <img
                src={author.avatar}
                alt={`${author.firstName} ${author.lastName}`}
                className="w-6 h-6 rounded-full bg-stone-100"
              />
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {author.firstName} {author.lastName}
              </span>
              <span className="text-stone-300 dark:text-stone-600">•</span>
            </>
          )}
          <span className="text-sm text-stone-400 dark:text-stone-500">
            {new Date(pitch.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Problem preview */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
            Problème
          </h4>
          <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-3">
            {pitch.problem || (
              <span className="text-stone-400 dark:text-stone-500 italic">Non défini</span>
            )}
          </p>
        </div>

        {/* Ingredients checklist */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { key: 'problem', label: 'Problem', filled: !!pitch.problem },
            { key: 'appetite', label: 'Appetite', filled: !!pitch.appetite },
            { key: 'solution', label: 'Solution', filled: !!pitch.solution },
            { key: 'rabbitHoles', label: 'Rabbit Holes', filled: pitch.rabbitHoles.length > 0 },
            { key: 'noGos', label: 'No-Gos', filled: pitch.noGos.length > 0 },
          ].map((item) => (
            <div
              key={item.key}
              className={`
                flex flex-col items-center p-2 rounded-lg text-center
                ${
                  item.filled
                    ? 'bg-[#AFBD00]/10 text-[#7a8200] dark:bg-[#AFBD00]/20 dark:text-[#AFBD00]'
                    : 'bg-stone-50 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
                }
              `}
            >
              <span className="text-lg mb-0.5">{item.filled ? '✓' : '○'}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Visualization indicators */}
        <div className="flex items-center gap-3">
          <div
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded text-xs
              ${
                pitch.breadboard
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-stone-50 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Breadboard
          </div>
          <div
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded text-xs
              ${
                pitch.fatMarkerSketch
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'bg-stone-50 text-stone-400 dark:bg-stone-800 dark:text-stone-500'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Fat Marker
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800/30 border-t border-stone-100 dark:border-stone-700/50 flex items-center justify-end gap-2">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            Voir détails
          </button>
          {onEdit && pitch.status !== 'building' && pitch.status !== 'completed' && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-sm text-[#5B5781] dark:text-[#c8bfd2] font-medium hover:bg-[#5B5781]/10 rounded-lg transition-colors"
            >
              Modifier
            </button>
          )}
          {onDelete && pitch.status === 'raw' && (
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
