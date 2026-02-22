import React from 'react'
import { Plus, Calendar, BarChart3 } from 'lucide-react'
import TrainingCard from './TrainingCard'

const STATUS_ORDER = [
  'idea',
  'to_organize',
  'in_preparation',
  'to_publish',
  'published',
  'in_progress',
  'post_training',
  'completed',
  'cancelled',
]

const STATUS_LABELS = {
  idea: 'Idée',
  to_organize: 'À organiser',
  in_preparation: 'En préparation',
  to_publish: 'À publier',
  published: 'Publiée',
  in_progress: 'En cours',
  post_training: 'Post-formation',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_COLORS = {
  idea: 'border-amber-300',
  to_organize: 'border-orange-300',
  in_preparation: 'border-blue-300',
  to_publish: 'border-indigo-300',
  published: 'border-green-300',
  in_progress: 'border-[#B01A19]/30',
  post_training: 'border-teal-300',
  completed: 'border-stone-400',
  cancelled: 'border-red-300',
}

export default function TrainingKanban({
  trainings = [],
  trainingTypes = [],
  trainingSessions = [],
  trainingRegistrations = [],
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onCreateTraining,
  onViewTraining,
  onEditTraining,
  onDeleteTraining,
  onViewCalendar,
  onViewReporting,
}) {
  const getTrainingType = (trainingTypeId) =>
    trainingTypes.find((t) => t.id === trainingTypeId)
  const getRegistrations = (trainingId) =>
    trainingRegistrations.filter((r) => r.trainingId === trainingId)
  const getSessions = (trainingId) =>
    trainingSessions.filter((s) => s.trainingId === trainingId)

  const trainingsByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = trainings.filter((t) => t.status === status)
    return acc
  }, {})

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                  Formations
                </h1>
                <p className="text-sm text-stone-600 mt-2 font-medium">
                  Gérez vos formations et suivez leur progression
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onViewCalendar?.('month')}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              type="button"
              onClick={() => onViewReporting?.()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:border-[#B01A19] hover:text-[#B01A19] hover:shadow-sm transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reporting</span>
            </button>
            <button
              type="button"
              onClick={() => onCreateTraining?.()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#B01A19] hover:bg-[#8f1514] rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle formation</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="search"
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="min-w-[220px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B01A19] focus:ring-2 focus:ring-[#B01A19]/10 outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B01A19] outline-none"
          >
            <option value="all">Tous les statuts</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange?.(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-[#B01A19] outline-none"
          >
            <option value="all">Tous les types</option>
            {trainingTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-5 min-w-max">
          {STATUS_ORDER.map((status, index) => {
            const columnTrainings = trainingsByStatus[status]
            const count = columnTrainings.length
            const isActiveStatus = status === 'in_progress' || status === 'published' || status === 'in_preparation'

            return (
              <div
                key={status}
                className={`flex-shrink-0 w-[280px] lg:w-80 bg-white rounded-xl border-2 p-5 shadow-sm relative overflow-hidden ${STATUS_COLORS[status]}`}
                style={{
                  animation: 'fadeInUp 0.5s ease-out forwards',
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {isActiveStatus && (
                      <div className="h-2 w-2 rounded-full bg-[#B01A19] animate-pulse" />
                    )}
                    <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      {STATUS_LABELS[status]}
                    </h2>
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                        isActiveStatus
                          ? 'bg-[#B01A19] text-white shadow-sm'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {count === 0 ? (
                    <div className="text-center py-12 text-sm text-stone-400">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-stone-300" />
                      </div>
                      Aucune formation
                    </div>
                  ) : (
                    columnTrainings.map((training, cardIndex) => (
                      <div
                        key={training.id}
                        style={{
                          animation: 'fadeInUp 0.4s ease-out forwards',
                          animationDelay: `${cardIndex * 30}ms`,
                          opacity: 0,
                        }}
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
