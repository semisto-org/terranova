import { Euro, Plus, Pencil, CheckCircle, Trash2 } from 'lucide-react'
import { EmptyState } from '../shared/EmptyState'

export interface ExpenseRow {
  id: string
  supplier?: string
  invoiceDate?: string
  date?: string
  totalInclVat?: number
  amount?: number
  expenseType?: string
  category?: string
  status?: string
}

interface ExpensesTabProps {
  expenses: ExpenseRow[]
  onOpenAdd: () => void
  onEdit: (expense: ExpenseRow) => void
  onApprove: (id: string) => void
  onDelete: (id: string) => void
}

const statusLabel: Record<string, string> = {
  paid: 'Payé',
  ready_for_payment: 'Prêt pour paiement',
  planned: 'Prévue',
  processing: 'En cours',
}

export function ExpensesTab({
  expenses,
  onOpenAdd,
  onEdit,
  onApprove,
  onDelete,
}: ExpensesTabProps) {
  const amount = (e: ExpenseRow) =>
    Number(e.totalInclVat ?? e.amount ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Dépenses du projet
        </h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Euro className="w-10 h-10 text-stone-400" />}
          title="Aucune dépense"
          description="Enregistrez les dépenses (plants, matériel, déplacements…) liées au projet."
          action={
            <button
              type="button"
              onClick={onOpenAdd}
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00]"
            >
              Ajouter une dépense
            </button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80">
                  <th className="px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">
                    Fournisseur
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">
                    Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 dark:text-stone-400 text-right">
                    Montant TVAC
                  </th>
                  <th className="px-4 py-3 font-semibold text-stone-600 dark:text-stone-400">
                    Statut
                  </th>
                  <th className="px-4 py-3 w-36" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-stone-100 dark:border-stone-700/50 hover:bg-stone-50/50 dark:hover:bg-stone-800/30"
                  >
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {item.invoiceDate
                        ? new Date(item.invoiceDate).toLocaleDateString(
                            'fr-BE'
                          )
                        : item.date
                          ? new Date(item.date).toLocaleDateString('fr-BE')
                          : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                      {item.supplier || '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                      {item.expenseType || item.category || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {amount(item).toLocaleString('fr-BE')} €
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 dark:bg-stone-700 px-2 py-0.5 text-xs text-stone-700 dark:text-stone-300">
                        {statusLabel[item.status || ''] || item.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {item.status !== 'ready_for_payment' &&
                          item.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => onApprove(item.id)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors"
                              title="Approuver"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
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
