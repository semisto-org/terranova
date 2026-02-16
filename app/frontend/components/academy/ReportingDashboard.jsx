import React from 'react'
import {
  BookOpen,
  CheckCircle2,
  Euro,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Receipt,
} from 'lucide-react'

const STATUS_LABELS = {
  draft: 'Brouillon',
  planned: 'Planifiée',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

const STATUS_ORDER = [
  'draft',
  'planned',
  'registrations_open',
  'in_progress',
  'completed',
  'cancelled',
]

const STATUS_COLORS = {
  draft: 'bg-stone-400',
  planned: 'bg-blue-500',
  registrations_open: 'bg-green-500',
  in_progress: 'bg-[#B01A19]',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const EXPENSE_CATEGORY_LABELS = {
  location: 'Lieu',
  material: 'Matériel',
  food: 'Repas',
  accommodation: 'Hébergement',
  transport: 'Transport',
  other: 'Autre',
}

const EXPENSE_CATEGORY_COLORS = {
  location: 'bg-blue-500',
  material: 'bg-purple-500',
  food: 'bg-orange-500',
  accommodation: 'bg-amber-500',
  transport: 'bg-cyan-500',
  other: 'bg-stone-500',
}

export default function ReportingDashboard({ data }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
        <BarChart3 className="w-12 h-12 text-stone-300 mb-4" />
        <p className="text-stone-500">Chargement des données de reporting…</p>
      </div>
    )
  }

  const {
    trainingsCount = 0,
    completedTrainings = 0,
    totalRevenue = 0,
    totalExpenses = 0,
    profitability = 0,
    byStatus = {},
    expensesByCategory = {},
    totalParticipants = 0,
    averageFillRate = 0,
  } = data

  const profitabilityPercent =
    totalRevenue > 0 ? Math.round((profitability / totalRevenue) * 100) : 0
  const totalExpensesSum = Object.values(expensesByCategory).reduce((a, b) => a + b, 0)

  if (trainingsCount === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
                Reporting
              </h1>
              <p className="text-sm text-stone-600 mt-2 font-medium">
                Vue d'ensemble des formations et indicateurs
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 px-6">
          <BarChart3 className="w-12 h-12 text-stone-300 mb-4" />
          <p className="text-base font-medium text-stone-700">Aucune formation</p>
          <p className="mt-1 text-sm text-stone-500">
            Les indicateurs apparaîtront lorsque des formations existeront
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-3">
        <div className="h-12 w-1 bg-gradient-to-b from-[#B01A19] to-[#eac7b8] rounded-full shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            Reporting
          </h1>
          <p className="text-sm text-stone-600 mt-2 font-medium">
            Vue d'ensemble des formations et indicateurs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#eac7b8]/20">
              <BookOpen className="w-5 h-5 text-[#B01A19]" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Formations
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{trainingsCount}</div>
          <div className="text-xs text-stone-500 mt-1">au total</div>
        </div>
        <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Terminées
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900">{completedTrainings}</div>
          <div className="text-xs text-stone-500 mt-1">
            {trainingsCount > 0
              ? Math.round((completedTrainings / trainingsCount) * 100)
              : 0}
            % du total
          </div>
        </div>
        <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <Euro className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Recettes
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {Number(totalRevenue).toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 mt-1">total encaissé</div>
        </div>
        <div className="group bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-orange-50">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Dépenses
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {Number(totalExpenses).toLocaleString('fr-FR')} €
          </div>
          <div className="text-xs text-stone-500 mt-1">total dépensé</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign
              className={`w-5 h-5 ${
                profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            />
            <h2 className="text-lg font-semibold text-stone-900">Rentabilité globale</h2>
          </div>
          <div
            className={`text-3xl font-bold ${
              profitability >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {profitability >= 0 ? '+' : ''}
            {Number(profitability).toLocaleString('fr-FR')} €
          </div>
          <div className="text-sm text-stone-500 mt-1">
            {profitabilityPercent >= 0 ? '+' : ''}
            {profitabilityPercent}% par rapport aux recettes
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#B01A19]" />
            <h2 className="text-lg font-semibold text-stone-900">
              Participants et remplissage
            </h2>
          </div>
          <div className="text-3xl font-bold text-stone-900">{totalParticipants}</div>
          <div className="text-sm text-stone-500 mt-1">
            participants inscrits au total
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-stone-600">Taux de remplissage moyen</span>
              <span className="font-medium text-stone-900">{averageFillRate}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  averageFillRate >= 60 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(averageFillRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {Object.keys(byStatus).length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Répartition par statut
          </h2>
          <div className="space-y-3">
            {STATUS_ORDER.filter((s) => (byStatus[s] || 0) > 0).map((status) => {
              const count = byStatus[status] || 0
              const pct = trainingsCount > 0 ? (count / trainingsCount) * 100 : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`}
                    />
                    <span className="text-sm font-medium text-stone-700">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${STATUS_COLORS[status]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-stone-900">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {Object.keys(expensesByCategory).length > 0 && totalExpensesSum > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Dépenses par catégorie
          </h2>
          <div className="mb-4">
            <div className="w-full bg-stone-200 rounded-full h-4 overflow-visible flex">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / totalExpensesSum) * 100
                  return (
                    <div
                      key={category}
                      className={`h-full transition-all duration-300 ${
                        EXPENSE_CATEGORY_COLORS[category] || EXPENSE_CATEGORY_COLORS.other
                      } first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${percentage}%` }}
                      title={`${EXPENSE_CATEGORY_LABELS[category] || category}: ${Number(amount).toLocaleString('fr-FR')} € (${Math.round(percentage)}%)`}
                    />
                  )
                })}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(expensesByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      EXPENSE_CATEGORY_COLORS[category] || EXPENSE_CATEGORY_COLORS.other
                    }`}
                  />
                  <span className="text-sm font-medium text-stone-900">
                    {EXPENSE_CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="text-sm text-stone-500 ml-auto">
                    {Number(amount).toLocaleString('fr-FR')} €
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
