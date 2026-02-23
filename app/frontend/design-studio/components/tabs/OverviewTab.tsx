import type { Project } from '../../types'

interface OverviewTabProps {
  project: Project
}

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

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Statut
          </p>
          <p className="text-sm font-medium text-stone-900 capitalize">
            {project.status === 'active'
              ? 'En cours'
              : project.status === 'pending'
                ? 'En attente'
                : project.status === 'completed'
                  ? 'Terminé'
                  : 'Archivé'}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Surface
          </p>
          <p className="text-2xl font-semibold text-stone-900 tracking-tight">
            {project.area.toLocaleString('fr-BE')} m²
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
            Début
          </p>
          <p className="text-sm font-medium text-stone-900">
            {formatDate(project.startDate)}
          </p>
        </div>
      </div>

      {/* Budget progress */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">
            Heures
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">
                Réalisées / prévues
              </span>
              <span className="font-medium text-stone-900">
                {budget.hoursWorked}h / {budget.hoursPlanned}h
              </span>
            </div>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
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
            <div className="flex justify-between text-xs text-stone-500">
              <span>{budget.hoursBilled}h facturées</span>
              <span>{budget.hoursSemos}h Semos</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">
            Dépenses
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">
                Réel / budget
              </span>
              <span className="font-medium text-stone-900">
                {Number(budget.expensesActual).toLocaleString('fr-BE')} € /{' '}
                {Number(budget.expensesBudget).toLocaleString('fr-BE')} €
              </span>
            </div>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
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
        <div className="rounded-2xl border border-stone-200 bg-[#e1e6d8]/50 p-5">
          <p className="text-sm font-medium text-stone-800">
            Date de plantation prévue :{' '}
            <span className="text-[#6B7A00]">
              {formatDate(project.plantingDate)}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
