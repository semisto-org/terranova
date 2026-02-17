import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'

export interface ExpenseItem {
  id: string
  supplier: string
  status: string
  invoiceDate: string | null
  category: string | null
  expenseType: string
  billingZone: string | null
  paymentDate: string | null
  paymentType: string | null
  amountExclVat: number
  vat6: number
  vat12: number
  vat21: number
  totalInclVat: number
  poles: string[]
  trainingId: string | null
  designProjectId: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Prévue',
  processing: 'Traitement en cours',
  ready_for_payment: 'Prêt pour paiement',
  paid: 'Payé',
}

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  services_and_goods: 'Services et biens divers',
  salaries: 'Salaires',
  merchandise: 'Marchandises',
  other: 'Autres',
  corporate_tax: 'Impôts sur les sociétés',
  exceptional_expenses: 'Dépenses exceptionnelles',
  financial_expenses: 'Dépenses financières',
  provisions_and_depreciation: 'Provisions et amortissements',
  taxes_and_duties: 'Taxes et impôts',
}

const BILLING_ZONE_LABELS: Record<string, string> = {
  belgium: 'Belgique',
  intra_eu: 'Intracommunautaire',
  extra_eu: 'Hors UE',
}

const POLE_LABELS: Record<string, string> = {
  lab: 'Lab',
  design: 'Design',
  academy: 'Academy',
  nursery: 'Nursery',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export interface ExpenseListProps {
  expenses: ExpenseItem[]
  loading?: boolean
  onCreateExpense: () => void
  onEditExpense: (expense: ExpenseItem) => void
  onDeleteExpense: (expenseId: string) => void
  trainingOptions?: { value: string; label: string }[]
  designProjectOptions?: { value: string; label: string }[]
}

export function ExpenseList({
  expenses,
  loading = false,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
  trainingOptions = [],
  designProjectOptions = [],
}: ExpenseListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')

  const filtered = expenses.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (poleFilter !== 'all' && !(e.poles || []).includes(poleFilter)) return false
    if (typeFilter !== 'all' && e.expenseType !== typeFilter) return false
    if (zoneFilter !== 'all' && e.billingZone !== zoneFilter) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const da = a.invoiceDate || a.createdAt
    const db = b.invoiceDate || b.createdAt
    return new Date(db).getTime() - new Date(da).getTime()
  })

  const statuses = Array.from(new Set(expenses.map((e) => e.status)))
  const poles = Array.from(new Set(expenses.flatMap((e) => e.poles || [])))
  const types = Array.from(new Set(expenses.map((e) => e.expenseType)))
  const zones = Array.from(new Set(expenses.map((e) => e.billingZone).filter(Boolean) as string[]))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Dépenses</h3>
          <p className="text-sm text-stone-500 mt-1">
            Toutes les dépenses consolidées (Lab, Academy, Design)
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateExpense}
          className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white text-stone-900 text-sm px-3 py-1.5"
        >
          <option value="all">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
          ))}
        </select>
        <select
          value={poleFilter}
          onChange={(e) => setPoleFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white text-stone-900 text-sm px-3 py-1.5"
        >
          <option value="all">Tous les pôles</option>
          {poles.map((p) => (
            <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white text-stone-900 text-sm px-3 py-1.5"
        >
          <option value="all">Tous les types</option>
          {types.map((t) => (
            <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white text-stone-900 text-sm px-3 py-1.5"
        >
          <option value="all">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>{BILLING_ZONE_LABELS[z] ?? z}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-500">Chargement...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-12 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucune dépense</p>
          <button
            type="button"
            onClick={onCreateExpense}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter une dépense
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Fournisseur</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">HTVA</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">TVAC</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Statut</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Pôles</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Liens</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  trainingOptions={trainingOptions}
                  designProjectOptions={designProjectOptions}
                  onEdit={() => onEditExpense(expense)}
                  onDelete={() => onDeleteExpense(expense.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpenseRow({
  expense,
  trainingOptions,
  designProjectOptions,
  onEdit,
  onDelete,
}: {
  expense: ExpenseItem
  trainingOptions: { value: string; label: string }[]
  designProjectOptions: { value: string; label: string }[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const poleLabels = (expense.poles || []).map((p) => POLE_LABELS[p] ?? p).join(', ') || '—'
  const linkLabels: string[] = []
  if (expense.trainingId && trainingOptions.length) {
    const label = trainingOptions.find((o) => o.value === expense.trainingId)?.label
    if (label) linkLabels.push(`Formation: ${label}`)
  }
  if (expense.designProjectId && designProjectOptions.length) {
    const label = designProjectOptions.find((o) => o.value === expense.designProjectId)?.label
    if (label) linkLabels.push(`Projet: ${label}`)
  }
  const linksText = linkLabels.length ? linkLabels.join(' · ') : '—'

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/50">
      <td className="px-4 py-3 text-sm text-stone-600">{formatDate(expense.invoiceDate)}</td>
      <td className="px-4 py-3 text-sm font-medium text-stone-900">{expense.supplier}</td>
      <td className="px-4 py-3 text-sm text-stone-700">
        {EXPENSE_TYPE_LABELS[expense.expenseType] ?? expense.expenseType}
      </td>
      <td className="px-4 py-3 text-sm text-right text-stone-700">
        {Number(expense.amountExclVat).toLocaleString('fr-FR')} €
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium text-stone-900">
        {Number(expense.totalInclVat).toLocaleString('fr-FR')} €
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-stone-100 text-stone-700">
          {STATUS_LABELS[expense.status] ?? expense.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600">{poleLabels}</td>
      <td className="px-4 py-3 text-sm text-stone-600 max-w-[140px] truncate" title={linksText}>
        {linksText}
      </td>
      <td className="px-4 py-3 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          aria-label="Actions"
        >
          <Edit className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 w-36 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
