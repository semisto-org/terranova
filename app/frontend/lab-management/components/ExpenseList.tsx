import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, X } from 'lucide-react'

export interface ExpenseItem {
  id: string
  name: string
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
  notes: string
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
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)

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
                  onRowClick={() => setSelectedExpense(expense)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          trainingOptions={trainingOptions}
          designProjectOptions={designProjectOptions}
          onClose={() => setSelectedExpense(null)}
          onEdit={() => {
            setSelectedExpense(null)
            onEditExpense(selectedExpense)
          }}
        />
      )}
    </div>
  )
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  bank_transfer: 'Virement bancaire',
  credit_card: 'Carte de crédit',
  cash: 'Espèces',
  direct_debit: 'Domiciliation',
  other: 'Autre',
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Loyer',
  utilities: 'Charges',
  insurance: 'Assurance',
  office_supplies: 'Fournitures de bureau',
  software: 'Logiciels',
  hardware: 'Matériel',
  travel: 'Déplacements',
  marketing: 'Marketing',
  professional_services: 'Services professionnels',
  other: 'Autre',
}

function ExpenseDetailModal({
  expense,
  trainingOptions,
  designProjectOptions,
  onClose,
  onEdit,
}: {
  expense: ExpenseItem
  trainingOptions: { value: string; label: string }[]
  designProjectOptions: { value: string; label: string }[]
  onClose: () => void
  onEdit: () => void
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const trainingLabel = expense.trainingId
    ? trainingOptions.find((o) => o.value === expense.trainingId)?.label || expense.trainingId
    : null
  const designLabel = expense.designProjectId
    ? designProjectOptions.find((o) => o.value === expense.designProjectId)?.label || expense.designProjectId
    : null

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div>
      <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-stone-900">{value || '—'}</dd>
    </div>
  )

  const Amount = ({ label, value }: { label: string; value: number }) => (
    <div>
      <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-900">
        {value ? `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}
      </dd>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              {expense.name || expense.supplier || 'Dépense'}
            </h2>
            <p className="text-sm text-stone-500">{expense.supplier}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#5B5781]/10 text-[#5B5781]">
              {STATUS_LABELS[expense.status] ?? expense.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Dates & Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Date facture" value={formatDate(expense.invoiceDate)} />
            <Field label="Date paiement" value={formatDate(expense.paymentDate)} />
            <Field label="Type" value={EXPENSE_TYPE_LABELS[expense.expenseType] ?? expense.expenseType} />
            <Field label="Catégorie" value={expense.category ? (CATEGORY_LABELS[expense.category] ?? expense.category) : null} />
            <Field label="Zone de facturation" value={expense.billingZone ? (BILLING_ZONE_LABELS[expense.billingZone] ?? expense.billingZone) : null} />
            <Field label="Type de paiement" value={expense.paymentType ? (PAYMENT_TYPE_LABELS[expense.paymentType] ?? expense.paymentType) : null} />
          </div>

          {/* Amounts */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Montants</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-lg bg-stone-50 border border-stone-200">
              <Amount label="HTVA" value={expense.amountExclVat} />
              <Amount label="TVA 6%" value={expense.vat6} />
              <Amount label="TVA 12%" value={expense.vat12} />
              <Amount label="TVA 21%" value={expense.vat21} />
              <div>
                <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">TVAC</dt>
                <dd className="mt-1 text-sm font-bold text-[#5B5781]">
                  {Number(expense.totalInclVat).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </dd>
              </div>
            </div>
          </div>

          {/* Pôles & Liens */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Pôles"
              value={(expense.poles || []).map((p) => POLE_LABELS[p] ?? p).join(', ') || null}
            />
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">Liens</dt>
              <dd className="mt-1 text-sm text-stone-900 space-y-1">
                {trainingLabel && <div>Formation : {trainingLabel}</div>}
                {designLabel && <div>Projet design : {designLabel}</div>}
                {!trainingLabel && !designLabel && '—'}
              </dd>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Notes</dt>
              <dd className="text-sm text-stone-700 whitespace-pre-wrap p-3 rounded-lg bg-stone-50 border border-stone-200">
                {expense.notes}
              </dd>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpenseRow({
  expense,
  trainingOptions,
  designProjectOptions,
  onEdit,
  onDelete,
  onRowClick,
}: {
  expense: ExpenseItem
  trainingOptions: { value: string; label: string }[]
  designProjectOptions: { value: string; label: string }[]
  onEdit: () => void
  onDelete: () => void
  onRowClick: () => void
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
    <tr className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer" onClick={onRowClick}>
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
      <td className="px-4 py-3 relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
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
