import type { Project, ProjectPhase } from '../../types'
import { PhaseIndicator } from '../shared/PhaseIndicator'
import { phaseLabels } from '../shared/PhaseIndicator'

interface OverviewTabProps {
  project: Project
}

const phaseOrder: ProjectPhase[] = [
  'offre',
  'pre-projet',
  'projet-detaille',
  'mise-en-oeuvre',
  'co-gestion',
]

export function OverviewTab({ project }: OverviewTabProps) {
  const budget = project.budget
  const hoursProgress =
    budget.hoursPlanned > 0
      ? Math.min(
          Math.round((budget.hoursWorked / budget.hoursPlanned) * 100),
          100
        )
      : 0
  const expensesProgress =
    budget.expensesBudget > 0
      ? Math.min(
          Math.round((budget.expensesActual / budget.expensesBudget) * 100),
          100
        )
      : 0

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const currentPhaseIndex = phaseOrder.indexOf(project.phase)

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
            Phase
          </p>
          <PhaseIndicator phase={project.phase} showLabel />
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
            Statut
          </p>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 capitalize">
            {project.status === 'active'
              ? 'En cours'
              : project.status === 'pending'
                ? 'En attente'
                : project.status === 'completed'
                  ? 'Terminé'
                  : 'Archivé'}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
            Surface
          </p>
          <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            {project.area.toLocaleString('fr-BE')} m²
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
            Début
          </p>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {formatDate(project.startDate)}
          </p>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-6">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
          Parcours du projet
        </h3>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:gap-0">
          {phaseOrder.map((phase, index) => {
            const isPast = index < currentPhaseIndex
            const isCurrent = phase === project.phase
            return (
              <div
                key={phase}
                className="flex items-center flex-1 min-w-0 sm:min-w-0"
              >
                <div
                  className={`flex flex-col items-center flex-1 ${
                    isCurrent ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-40'
                  }`}
                >
                  <PhaseIndicator
                    phase={phase}
                    small
                    showLabel={false}
                    className={`w-3 h-3 ${isCurrent ? 'ring-2 ring-offset-2 ring-[#AFBD00] ring-offset-white dark:ring-offset-stone-900' : ''}`}
                  />
                  <span className="mt-2 text-[10px] sm:text-xs font-medium text-stone-600 dark:text-stone-400 text-center truncate w-full">
                    {phaseLabels[phase]}
                  </span>
                </div>
                {index < phaseOrder.length - 1 && (
                  <div
                    className={`hidden sm:block flex-1 h-0.5 mx-1 min-w-[8px] ${
                      isPast ? 'bg-[#AFBD00]' : 'bg-stone-200 dark:bg-stone-700'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Budget progress */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-6">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Heures
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500 dark:text-stone-400">
                Réalisées / prévues
              </span>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {budget.hoursWorked}h / {budget.hoursPlanned}h
              </span>
            </div>
            <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  hoursProgress > 90
                    ? 'bg-red-500'
                    : hoursProgress > 70
                      ? 'bg-amber-500'
                      : 'bg-[#AFBD00]'
                }`}
                style={{ width: `${hoursProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>{budget.hoursBilled}h facturées</span>
              <span>{budget.hoursSemos}h Semos</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-6">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Dépenses
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500 dark:text-stone-400">
                Réel / budget
              </span>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {Number(budget.expensesActual).toLocaleString('fr-BE')} € /{' '}
                {Number(budget.expensesBudget).toLocaleString('fr-BE')} €
              </span>
            </div>
            <div className="h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  expensesProgress > 90
                    ? 'bg-red-500'
                    : expensesProgress > 70
                      ? 'bg-amber-500'
                      : 'bg-[#5B5781]'
                }`}
                style={{ width: `${expensesProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {project.plantingDate && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-[#e1e6d8]/50 dark:bg-[#AFBD00]/10 p-5">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            Date de plantation prévue :{' '}
            <span className="text-[#6B7A00] dark:text-[#AFBD00]">
              {formatDate(project.plantingDate)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
