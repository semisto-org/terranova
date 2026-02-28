import { Plus, Pencil, Trash2, ArrowUpCircle } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'
import type { EconomicOutput, OutputCategory } from './types'
import { OUTPUT_CATEGORY_LABELS, OUTPUT_CATEGORY_COLORS, euro } from './types'

interface OutputsTableProps {
  outputs: EconomicOutput[]
  busy: boolean
  onOpenAdd: () => void
  onEdit: (output: EconomicOutput) => void
  onDelete: (id: number) => void
}

function CategoryBadge({ category }: { category: OutputCategory }) {
  const color = OUTPUT_CATEGORY_COLORS[category] || '#94a3b8'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {OUTPUT_CATEGORY_LABELS[category] || category}
    </span>
  )
}

export function OutputsTable({ outputs, busy, onOpenAdd, onEdit, onDelete }: OutputsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">
          {outputs.length > 0 && <span className="text-stone-400 font-normal ml-1">({outputs.length})</span>}
        </h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un revenu
        </button>
      </div>

      {outputs.length === 0 ? (
        <EmptyState
          icon={<ArrowUpCircle className="w-10 h-10 text-stone-400" />}
          title="Aucun revenu enregistré"
          description="Enregistrez les récoltes, ventes et valorisations de votre forêt nourricière."
          action={
            <button type="button" onClick={onOpenAdd} className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]">
              Ajouter un revenu
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
                  <th className="px-4 py-3 font-semibold text-stone-600">Espèce</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Montant</th>
                  <th className="px-4 py-3 font-semibold text-stone-600 text-right">Quantité</th>
                  <th className="px-4 py-3 font-semibold text-stone-600">Notes</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {outputs.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-600 tabular-nums">
                      {new Date(item.date).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="px-4 py-3">
                      {item.species_latin_name || item.species_name ? (
                        <span className="text-stone-800 italic text-sm">{item.species_latin_name || item.species_name}</span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900 tabular-nums">
                      {item.amount_cents != null ? euro.format(item.amount_cents / 100) : '—'}
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
