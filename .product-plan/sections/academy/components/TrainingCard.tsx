import type { Training, TrainingType, TrainingRegistration, TrainingSession } from '../types'
import { Calendar, Users, Home, MoreVertical } from 'lucide-react'

interface TrainingCardProps {
  training: Training
  trainingType?: TrainingType
  registrations: TrainingRegistration[]
  sessions: TrainingSession[]
  onView?: (trainingId: string) => void
  onEdit?: (trainingId: string) => void
  onDelete?: (trainingId: string) => void
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const statusColors: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  registrations_open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  in_progress: 'bg-[#B01A19]/10 text-[#B01A19] dark:bg-[#B01A19]/20 dark:text-[#B01A19]',
  completed: 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function TrainingCard({
  training,
  trainingType,
  registrations,
  sessions,
  onView,
  onEdit,
  onDelete,
}: TrainingCardProps) {
  const participantCount = registrations.length
  const fillPercentage = training.maxParticipants > 0 
    ? Math.round((participantCount / training.maxParticipants) * 100) 
    : 0

  // Get next session date
  const nextSession = sessions
    .filter(s => new Date(s.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isActiveStatus = training.status === 'in_progress' || training.status === 'registrations_open'

  return (
    <div
      className={`bg-white dark:bg-stone-900 rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isActiveStatus 
          ? 'border-[#B01A19]/30 dark:border-[#B01A19]/50 hover:border-[#B01A19]/50' 
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      } hover:-translate-y-1`}
      onClick={() => onView?.(training.id)}
    >
      {/* Academy accent bar for active trainings */}
      {isActiveStatus && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#B01A19] to-[#eac7b8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-1.5 line-clamp-2 leading-snug">
            {training.title}
          </h3>
          {trainingType && (
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate font-medium">
              {trainingType.name}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Menu would open here
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-200 hover:scale-110"
        >
          <MoreVertical className="w-4 h-4 text-stone-400 hover:text-[#B01A19] transition-colors" />
        </button>
      </div>

      {/* Status badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 group-hover:scale-105 ${statusColors[training.status]}`}>
          {statusLabels[training.status]}
        </span>
      </div>

      {/* Info grid */}
      <div className="space-y-2.5 mb-4">
        {/* Next session date */}
        {nextSession && (
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="p-1 rounded bg-stone-100 dark:bg-stone-800">
              <Calendar className="w-3 h-3" />
            </div>
            <span className="font-medium">{formatDate(nextSession.startDate)}</span>
          </div>
        )}

        {/* Participants with progress bar */}
        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
          <div className="p-1 rounded bg-stone-100 dark:bg-stone-800">
            <Users className="w-3 h-3" />
          </div>
          <span className="flex-1 font-medium">
            {participantCount} / {training.maxParticipants}
          </span>
          <div className="w-20 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                fillPercentage >= 60 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Accommodation */}
        {training.requiresAccommodation && (
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="p-1 rounded bg-[#eac7b8]/20">
              <Home className="w-3 h-3 text-[#B01A19]" />
            </div>
            <span className="font-medium">Hébergement requis</span>
          </div>
        )}
      </div>

    </div>
  )
}

