import { Plus, Pencil, Trash2, ArrowDownCircle } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'
import type { EconomicInput, InputCategory, LaborType } from './types'
import { INPUT_CATEGORY_LABELS, LABOR_TYPE_LABELS, INPUT_CATEGORY_COLORS, euro } from './types'

interface InputsTableProps {
  inputs: EconomicInput[]
  busy: boolean
  onOpenAdd: () => void
  onEdit: (input: EconomicInput) => void
  onDelete: (id: number) => void
}

function CategoryBadge({ category }: { category: InputCategory }) {
  const color = INPUT_CATEGORY_COLORS[category] || '#94a3b8'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {INPUT_CATEGORY_LABELS[category] || category}
    </span>
  )
}

export function InputsTable({ inputs, busy, onOpenAdd, onEdit, onDelete }: InputsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">
          {inputs.length > 0 && <span className="text-stone-400 font-normal ml-1">({inputs.length})</span>}
        </h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un coût
        </button>
      </div>

      {inputs.length === 0 ? (
        <EmptyState
          icon={<ArrowDownCircle className="w-10 h-10 text-stone-400" />}
          title="Aucun coût enregistré"
          description="Enregistrez les coûts d'installation, de main-d'œuvre et de matériaux pour suivre vos dépenses."
          action={
            <button type="button" onClick={onOpenAdd} className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]">
              Ajouter un coût
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
                  <th className="px-4 py-3 font-semibold text-stone-600">Catégorie</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Montant</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Quantité</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Notes</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {inputs.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-600 tabular-nums">
                      {new Date(item.date).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={item.category} />
                        {item.labor_type && (
                          <span className="text-xs text-stone-500">
                            {LABOR_TYPE_LABELS[item.labor_type as LaborType] || item.labor_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900 tabular-nums">
                      {euro.format(item.amount_cents / 100)}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-700 tabular-nums">
                      {item.quantity} {item.unit}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
