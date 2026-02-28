import { useMemo } from 'react'
import { Plus, Pencil, Trash2, Clock, Sprout, Wrench, Apple } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'
import type { EconomicInput, LaborType } from './types'
import { LABOR_TYPE_LABELS, euro, numberFmt } from './types'

interface LaborHoursViewProps {
  inputs: EconomicInput[]
  busy: boolean
  onOpenAdd: () => void
  onEdit: (input: EconomicInput) => void
  onDelete: (id: number) => void
}

const LABOR_TYPE_ICONS: Record<LaborType, React.ReactNode> = {
  plantation: <Sprout className="w-4 h-4" />,
  entretien: <Wrench className="w-4 h-4" />,
  recolte: <Apple className="w-4 h-4" />,
}

const LABOR_TYPE_ACCENTS: Record<LaborType, string> = {
  plantation: '#22c55e',
  entretien: '#f59e0b',
  recolte: '#8b5cf6',
}

export function LaborHoursView({ inputs, busy, onOpenAdd, onEdit, onDelete }: LaborHoursViewProps) {
  const laborInputs = useMemo(() => inputs.filter((i) => i.category === 'labor'), [inputs])

  const summaryByType = useMemo(() => {
    const totals: Record<string, { hours: number; costCents: number }> = {}
    for (const item of laborInputs) {
      const key = item.labor_type || 'non_specifie'
      if (!totals[key]) totals[key] = { hours: 0, costCents: 0 }
      if (item.unit === 'h') totals[key].hours += item.quantity
      totals[key].costCents += item.amount_cents
    }
    return totals
  }, [laborInputs])

  const totalHours = Object.values(summaryByType).reduce((s, v) => s + v.hours, 0)
  const totalCostCents = Object.values(summaryByType).reduce((s, v) => s + v.costCents, 0)

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-stone-900 tabular-nums">{numberFmt.format(totalHours)} h</p>
          <p className="text-xs text-stone-500 mt-0.5">Total heures</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-2">Coût total</p>
          <p className="text-2xl font-semibold text-stone-900 tabular-nums">{euro.format(totalCostCents / 100)}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {totalHours > 0 ? `${euro.format(totalCostCents / 100 / totalHours)}/h` : '—'}
          </p>
        </div>

        {(['plantation', 'entretien', 'recolte'] as LaborType[]).map((type) => {
          const data = summaryByType[type]
          return (
            <div key={type} className="bg-white border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${LABOR_TYPE_ACCENTS[type]}15` }}
                >
                  <div style={{ color: LABOR_TYPE_ACCENTS[type] }}>{LABOR_TYPE_ICONS[type]}</div>
                </div>
              </div>
              <p className="text-2xl font-semibold text-stone-900 tabular-nums">{numberFmt.format(data?.hours || 0)} h</p>
              <p className="text-xs text-stone-500 mt-0.5">{LABOR_TYPE_LABELS[type]}</p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">
          Détail des heures
          {laborInputs.length > 0 && <span className="text-stone-400 font-normal ml-1">({laborInputs.length})</span>}
        </h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter des heures
        </button>
      </div>

      {laborInputs.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-10 h-10 text-stone-400" />}
          title="Aucune heure enregistrée"
          description="Suivez le temps consacré à la plantation, l'entretien et la récolte."
          action={
            <button type="button" onClick={onOpenAdd} className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]">
              Ajouter des heures
            </button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="px-4 py-3 font-semibold text-stone-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Type de travail</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Heures</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Coût</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Notes</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {laborInputs.map((item) => {
                  const type = item.labor_type as LaborType | null
                  return (
                    <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-stone-600 tabular-nums">
                        {new Date(item.date).toLocaleDateString('fr-BE')}
                      </td>
                      <td className="px-4 py-3">
                        {type ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span style={{ color: LABOR_TYPE_ACCENTS[type] }}>{LABOR_TYPE_ICONS[type]}</span>
                            <span className="text-stone-700">{LABOR_TYPE_LABELS[type]}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">Non spécifié</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-stone-900 tabular-nums">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700 tabular-nums">
                        {euro.format(item.amount_cents / 100)}
                      </td>
                      <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            disabled={busy}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            disabled={busy}
                            className="p-1.5 text-stone-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
