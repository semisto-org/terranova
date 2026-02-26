import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, MoreVertical, Edit, Eye, Trash2, FileText, X,
  Search, Clock, CheckCircle, AlertCircle, Receipt,
  ChevronUp, ChevronDown,
} from 'lucide-react'

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
  documentUrl: string | null
  createdAt: string
}

// --- Constants ---

const STATUS_LABELS: Record<string, string> = {
  planned: 'Prévue',
  processing: 'Traitement en cours',
  ready_for_payment: 'Prêt pour paiement',
  paid: 'Payé',
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-stone-100 text-stone-600',
  processing: 'bg-blue-100 text-blue-700',
  ready_for_payment: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
}

const STATUS_ORDER: Record<string, number> = {
  ready_for_payment: 0,
  processing: 1,
  planned: 2,
  paid: 3,
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

const POLE_COLORS: Record<string, string> = {
  lab: '#5B5781',
  design: '#AFBD00',
  academy: '#B01A19',
  nursery: '#EF9B0D',
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  card_triodos: 'Carte (Triodos)',
  transfer_triodos: 'Virement (Triodos)',
  cash: 'Espèces',
  reimbursement_michael: 'Remboursement à Michael',
  member: 'Membre',
  stripe_fee: 'Stripe fee',
  bank_transfer: 'Virement bancaire',
  credit_card: 'Carte de crédit',
  direct_debit: 'Domiciliation',
  other: 'Autre',
}

const EXPENSE_CATEGORY_OPTIONS = [
  'Assurances', 'Autres dépenses', 'Bibliothèque', 'Charges sociales',
  'Communication', 'Contributions et adhésions', 'Déplacements',
  'Entretien et réparations', 'Événements', 'Fournitures', 'Frais bancaires',
  'Frais de formation', 'Frais généraux', 'Frais juridiques et comptables',
  'Hébergement et restauration', 'In/out', 'Indemnités et avantages',
  'Laboratoire', 'Licences et abonnements', 'Loyer', 'Matériel et équipements',
  'Matériel plantations', 'Plants', 'Prestations', 'Projets', 'Projets innovants',
  'Publicité et promotion', 'Relations publiques', 'Rémunération des bénévoles',
  'Réserves', 'Salaires', 'Site web et médias sociaux', 'Sponsoring',
  'Stock pour shop', 'Subventions et aides', 'Télécommunications',
  'Transport et logistique', 'Visites et conférences',
]

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 0.5rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.5em 1.5em',
  paddingRight: '2.5rem',
}

// --- Helpers ---

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// --- Sub-components ---

function SortableHeader({
  label,
  column,
  currentSort,
  currentDir,
  onSort,
  className = '',
}: {
  label: string
  column: string
  currentSort: string
  currentDir: 'asc' | 'desc'
  onSort: (col: string) => void
  className?: string
}) {
  const isActive = currentSort === column
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-stone-600 uppercase cursor-pointer hover:text-stone-900 select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-30" />
        )}
      </span>
    </th>
  )
}

// --- Main component ---

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
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sort
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Detail
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)

  // KPI stats (unfiltered)
  const summaryStats = useMemo(() => {
    const byStatus: Record<string, { total: number; count: number }> = {
      planned: { total: 0, count: 0 },
      processing: { total: 0, count: 0 },
      ready_for_payment: { total: 0, count: 0 },
      paid: { total: 0, count: 0 },
    }
    let grandTotal = 0
    expenses.forEach((e) => {
      const amount = Number(e.totalInclVat)
      grandTotal += amount
      if (byStatus[e.status]) {
        byStatus[e.status].total += amount
        byStatus[e.status].count += 1
      }
    })
    return { byStatus, grandTotal, totalCount: expenses.length }
  }, [expenses])

  // Filtering
  const filtered = useMemo(() => expenses.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (poleFilter !== 'all' && !(e.poles || []).includes(poleFilter)) return false
    if (typeFilter !== 'all' && e.expenseType !== typeFilter) return false
    if (zoneFilter !== 'all' && e.billingZone !== zoneFilter) return false
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
    if (dateFrom && (!e.invoiceDate || e.invoiceDate < dateFrom)) return false
    if (dateTo && (!e.invoiceDate || e.invoiceDate > dateTo)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const searchable = [e.supplier, e.name, e.notes, e.category].filter(Boolean).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  }), [expenses, statusFilter, poleFilter, typeFilter, zoneFilter, categoryFilter, dateFrom, dateTo, searchQuery])

  // Sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'date' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'date':
          cmp = new Date(a.invoiceDate || a.createdAt).getTime() - new Date(b.invoiceDate || b.createdAt).getTime()
          break
        case 'supplier':
          cmp = (a.supplier || '').localeCompare(b.supplier || '', 'fr')
          break
        case 'htva':
          cmp = Number(a.amountExclVat) - Number(b.amountExclVat)
          break
        case 'tvac':
          cmp = Number(a.totalInclVat) - Number(b.totalInclVat)
          break
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
          break
        default:
          cmp = new Date(a.invoiceDate || a.createdAt).getTime() - new Date(b.invoiceDate || b.createdAt).getTime()
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortColumn, sortDirection])

  // Filtered totals
  const filteredTotals = useMemo(() => ({
    htva: sorted.reduce((sum, e) => sum + Number(e.amountExclVat), 0),
    tvac: sorted.reduce((sum, e) => sum + Number(e.totalInclVat), 0),
  }), [sorted])

  // Filter options (derived from data)
  const statuses = Array.from(new Set(expenses.map((e) => e.status)))
  const poles = Array.from(new Set(expenses.flatMap((e) => e.poles || [])))
  const types = Array.from(new Set(expenses.map((e) => e.expenseType)))
  const zones = Array.from(new Set(expenses.map((e) => e.billingZone).filter(Boolean) as string[]))
  const categories = Array.from(new Set(expenses.map((e) => e.category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'fr'))

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || poleFilter !== 'all' ||
    typeFilter !== 'all' || zoneFilter !== 'all' || categoryFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPoleFilter('all')
    setTypeFilter('all')
    setZoneFilter('all')
    setCategoryFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
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

      {/* KPI Cards */}
      {!loading && expenses.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-stone-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total</p>
            </div>
            <p className="text-2xl font-bold text-stone-800 tabular-nums">{formatCurrency(summaryStats.grandTotal)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.totalCount} dépense{summaryStats.totalCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-stone-400" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Prévues</p>
            </div>
            <p className="text-2xl font-bold text-stone-500 tabular-nums">{formatCurrency(summaryStats.byStatus.planned.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.planned.count} dépense{summaryStats.byStatus.planned.count !== 1 ? 's' : ''}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${
            summaryStats.byStatus.ready_for_payment.count > 0
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Prêt pour paiement</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(summaryStats.byStatus.ready_for_payment.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.ready_for_payment.count} dépense{summaryStats.byStatus.ready_for_payment.count !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Payé</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summaryStats.byStatus.paid.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.paid.count} dépense{summaryStats.byStatus.paid.count !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6">
        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-stone-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par fournisseur, libellé, catégorie, notes..."
            className="w-full pl-12 pr-10 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="all">Tous les statuts</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Pôle</label>
            <select
              value={poleFilter}
              onChange={(e) => setPoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="all">Tous les pôles</option>
              {poles.map((p) => (
                <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="all">Tous les types</option>
              {types.map((t) => (
                <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="all">Toutes les zones</option>
              {zones.map((z) => (
                <option key={z} value={z}>{BILLING_ZONE_LABELS[z] ?? z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
              style={selectStyle}
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Période</label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
                title="Du"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors"
                title="Au"
              />
            </div>
          </div>
        </div>

        {/* Active filters indicator + clear */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {sorted.length} dépense{sorted.length !== 1 ? 's' : ''} sur {expenses.length}
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 text-sm text-[#5B5781] hover:text-[#4a4670] font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-stone-500">Chargement...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-12 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">
            {hasActiveFilters ? 'Aucune dépense ne correspond aux filtres' : 'Aucune dépense'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <X className="w-4 h-4" />
              Effacer les filtres
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateExpense}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une dépense
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <SortableHeader label="Date" column="date" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Fournisseur" column="supplier" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Type</th>
                <SortableHeader label="HTVA" column="htva" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} className="text-right" />
                <SortableHeader label="TVAC" column="tvac" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} className="text-right" />
                <SortableHeader label="Statut" column="status" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Pôles</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Doc</th>
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
            <tfoot>
              <tr className="border-t-2 border-stone-300 bg-stone-50">
                <td className="px-4 py-3 text-sm font-semibold text-stone-700" colSpan={3}>
                  Total ({sorted.length} dépense{sorted.length !== 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-stone-900 tabular-nums">
                  {formatCurrency(filteredTotals.htva)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-stone-900 tabular-nums">
                  {formatCurrency(filteredTotals.tvac)}
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
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

// --- ExpenseDetailModal ---

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
        {value ? formatCurrency(value) : '—'}
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
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[expense.status] ?? 'bg-stone-100 text-stone-700'}`}>
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
            <Field label="Catégorie" value={expense.category || null} />
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
                  {formatCurrency(expense.totalInclVat)}
                </dd>
              </div>
            </div>
          </div>

          {/* Pôles & Liens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">Pôles</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {(expense.poles || []).length > 0 ? expense.poles.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: POLE_COLORS[p] || '#a8a29e' }} />
                    <span className="text-sm text-stone-700">{POLE_LABELS[p] ?? p}</span>
                  </span>
                )) : <span className="text-sm text-stone-900">—</span>}
              </dd>
            </div>
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

// --- ExpenseRow ---

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
  const menuRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
      <td className="px-4 py-3 text-sm text-right text-stone-700 tabular-nums">
        {formatCurrency(expense.amountExclVat)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium text-stone-900 tabular-nums">
        {formatCurrency(expense.totalInclVat)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[expense.status] ?? 'bg-stone-100 text-stone-700'}`}>
          {STATUS_LABELS[expense.status] ?? expense.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(expense.poles || []).length > 0 ? expense.poles.map((p) => (
            <span key={p} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: POLE_COLORS[p] || '#a8a29e' }} />
              <span className="text-xs text-stone-600">{POLE_LABELS[p] ?? p}</span>
            </span>
          )) : <span className="text-stone-300 text-xs">—</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600">
        {expense.documentUrl ? (
          <a
            href={expense.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#5B5781] hover:text-[#4a4670] transition-colors"
            title="Voir le document"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs">Facture</span>
          </a>
        ) : (
          <span className="text-stone-300 text-xs">—</span>
        )}
      </td>
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
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 w-36 bg-white rounded-lg border border-stone-200 shadow-lg z-20">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onRowClick()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Eye className="w-4 h-4" />
              Détail
            </button>
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
