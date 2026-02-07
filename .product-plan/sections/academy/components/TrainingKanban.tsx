import type { AcademyProps, Training, TrainingStatus } from '../types'
import { TrainingCard } from './TrainingCard'
import { Plus, Calendar, BarChart3 } from 'lucide-react'

const statusOrder: TrainingStatus[] = [
  'draft',
  'planned',
  'registrations_open',
  'in_progress',
  'completed',
  'cancelled',
]

const statusLabels: Record<TrainingStatus, string> = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const statusColors: Record<TrainingStatus, string> = {
  draft: 'border-stone-300 dark:border-stone-700',
  planned: 'border-blue-300 dark:border-blue-700',
  registrations_open: 'border-green-300 dark:border-green-700',
  in_progress: 'border-[#B01A19]/30 dark:border-[#B01A19]/50',
  completed: 'border-stone-400 dark:border-stone-600',
  cancelled: 'border-red-300 dark:border-red-700',
}

export function TrainingKanban({
  trainings,
  trainingTypes,
  trainingSessions,
  trainingRegistrations,
  onCreateTraining,
  onViewTraining,
  onEditTraining,
  onDeleteTraining,
  onUpdateTrainingStatus,
  onViewCalendar,
  onViewReporting,
}: AcademyProps) {
  // Group trainings by status
  const trainingsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = trainings.filter(t => t.status === status)
    return acc
  }, {} as Record<TrainingStatus, Training[]>)

  // Helper to get training type
  const getTrainingType = (trainingTypeId: string) => {
    return trainingTypes.find(t => t.id === trainingTypeId)
  }

  // Helper to get registrations for a training
  const getRegistrations = (trainingId: string) => {
    return trainingRegistrations.filter(r => r.trainingId === trainingId)
  }

  // Helper to get sessions for a training
  const getSessions = (trainingId: string) => {
    return trainingSessions.filter(s => s.trainingId === trainingId)
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Academy accent */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Formations
                </h1>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 font-medium">
                  Gérez vos formations et suivez leur progression
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onViewCalendar?.('month')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              onClick={() => onViewReporting?.()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reporting</span>
            </button>
            <button
              onClick={() => onCreateTraining?.()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#B01A19] hover:bg-[#B01A19]/90 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle formation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-5 min-w-max lg:min-w-0">
          {statusOrder.map((status, index) => {
            const columnTrainings = trainingsByStatus[status]
            const count = columnTrainings.length
            const isActiveStatus = status === 'in_progress' || status === 'registrations_open'

            return (
              <div
                key={status}
                className={`flex-shrink-0 w-full lg:w-80 bg-white dark:bg-stone-900 rounded-xl border-2 ${statusColors[status]} p-5 shadow-sm relative overflow-hidden group animate-in fade-in-0 slide-in-from-bottom-4`}
                style={{ animationDelay: `${index * 50}ms` }}
              >

                {/* Column header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {isActiveStatus && (
                      <div className="h-2 w-2 rounded-full bg-[#B01A19] animate-pulse" />
                    )}
                    <h2 className="font-bold text-stone-900 dark:text-stone-100 text-sm uppercase tracking-wide">
                      {statusLabels[status]}
                    </h2>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                      isActiveStatus 
                        ? 'bg-[#B01A19] text-white shadow-sm' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      {count}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {count === 0 ? (
                    <div className="text-center py-12 text-sm text-stone-400 dark:text-stone-600">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-stone-300 dark:text-stone-700" />
                      </div>
                      Aucune formation
                    </div>
                  ) : (
                    columnTrainings.map((training, cardIndex) => (
                      <div
                        key={training.id}
                        className="animate-in fade-in-0 slide-in-from-left-2"
                        style={{ animationDelay: `${(index * 50) + (cardIndex * 30)}ms` }}
                      >
                        <TrainingCard
                          training={training}
                          trainingType={getTrainingType(training.trainingTypeId)}
                          registrations={getRegistrations(training.id)}
                          sessions={getSessions(training.id)}
                          onView={onViewTraining}
                          onEdit={onEditTraining}
                          onDelete={onDeleteTraining}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

