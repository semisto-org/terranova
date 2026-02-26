import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, MoreVertical, Edit, Eye, Trash2, FileText, X,
  Search, Clock, CheckCircle, TrendingUp,
  ChevronUp, ChevronDown,
} from 'lucide-react'

export interface RevenueItem {
  id: string
  amount: number
  description: string | null
  date: string | null
  contactId: string | null
  contactName: string | null
  pole: string | null
  trainingId: string | null
  designProjectId: string | null
  revenueType: string | null
  status: string
  notes: string | null
  label: string | null
  amountExclVat: number
  vat6: number
  vat21: number
  paymentMethod: string | null
  category: string | null
  vatRate: string | null
  vatExemption: string | null
  invoiceUrl: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Constants ---

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  received: 'Reçu',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  confirmed: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
}

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  confirmed: 1,
  received: 2,
}

const POLE_LABELS: Record<string, string> = {
  academy: 'Academy',
  design_studio: 'Design Studio',
  nursery: 'Nursery',
  roots: 'Roots',
}

const POLE_COLORS: Record<string, string> = {
  academy: '#B01A19',
  design_studio: '#AFBD00',
  nursery: '#EF9B0D',
  roots: '#5B5781',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: 'Virement',
  card: 'Carte',
  cash: 'Cash',
  stripe: 'Stripe',
  other: 'Autre',
}

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

function computeTtc(r: RevenueItem): number {
  return r.amountExclVat + r.vat6 + r.vat21
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

export interface RevenueListProps {
  revenues: RevenueItem[]
  loading?: boolean
  onCreateRevenue: () => void
  onEditRevenue: (revenue: RevenueItem) => void
  onDeleteRevenue: (revenueId: string) => void
  onViewRevenue: (revenue: RevenueItem) => void
}

export function RevenueList({
  revenues,
  loading = false,
  onCreateRevenue,
  onEditRevenue,
  onDeleteRevenue,
  onViewRevenue,
}: RevenueListProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sort
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // KPI stats (unfiltered)
  const summaryStats = useMemo(() => {
    const byStatus: Record<string, { total: number; count: number }> = {
      draft: { total: 0, count: 0 },
      confirmed: { total: 0, count: 0 },
      received: { total: 0, count: 0 },
    }
    let grandTotal = 0
    revenues.forEach((r) => {
      const ttc = computeTtc(r)
      grandTotal += ttc
      if (byStatus[r.status]) {
        byStatus[r.status].total += ttc
        byStatus[r.status].count += 1
      }
    })
    return { byStatus, grandTotal, totalCount: revenues.length }
  }, [revenues])

  // Filtering
  const filtered = useMemo(() => revenues.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (poleFilter !== 'all' && r.pole !== poleFilter) return false
    if (typeFilter !== 'all' && r.revenueType !== typeFilter) return false
    if (paymentFilter !== 'all' && r.paymentMethod !== paymentFilter) return false
    if (dateFrom && (!r.date || r.date < dateFrom)) return false
    if (dateTo && (!r.date || r.date > dateTo)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const searchable = [r.contactName, r.description, r.label, r.notes, r.category, r.revenueType].filter(Boolean).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  }), [revenues, statusFilter, poleFilter, typeFilter, paymentFilter, dateFrom, dateTo, searchQuery])

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
          cmp = new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
          break
        case 'client':
          cmp = (a.contactName || '').localeCompare(b.contactName || '', 'fr')
          break
        case 'htva':
          cmp = a.amountExclVat - b.amountExclVat
          break
        case 'ttc':
          cmp = computeTtc(a) - computeTtc(b)
          break
        case 'status':
          cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
          break
        default:
          cmp = new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortColumn, sortDirection])

  // Filtered totals
  const filteredTotals = useMemo(() => ({
    htva: sorted.reduce((sum, r) => sum + r.amountExclVat, 0),
    vat: sorted.reduce((sum, r) => sum + r.vat6 + r.vat21, 0),
    ttc: sorted.reduce((sum, r) => sum + computeTtc(r), 0),
  }), [sorted])

  // Filter options (derived from data)
  const statuses = Array.from(new Set(revenues.map((r) => r.status)))
  const poles = Array.from(new Set(revenues.map((r) => r.pole).filter(Boolean) as string[]))
  const types = Array.from(new Set(revenues.map((r) => r.revenueType).filter(Boolean) as string[]))
  const paymentMethods = Array.from(new Set(revenues.map((r) => r.paymentMethod).filter(Boolean) as string[]))

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || poleFilter !== 'all' ||
    typeFilter !== 'all' || paymentFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const clearAllFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPoleFilter('all')
    setTypeFilter('all')
    setPaymentFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Recettes</h3>
          <p className="text-sm text-stone-500 mt-1">
            Toutes les recettes consolidées (Academy, Design Studio, Nursery, Roots)
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateRevenue}
          className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter une recette
        </button>
      </div>

      {/* KPI Cards */}
      {!loading && revenues.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-stone-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total</p>
            </div>
            <p className="text-2xl font-bold text-stone-800 tabular-nums">{formatCurrency(summaryStats.grandTotal)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.totalCount} recette{summaryStats.totalCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-stone-400" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Brouillon</p>
            </div>
            <p className="text-2xl font-bold text-stone-500 tabular-nums">{formatCurrency(summaryStats.byStatus.draft.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.draft.count} recette{summaryStats.byStatus.draft.count !== 1 ? 's' : ''}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${
            summaryStats.byStatus.confirmed.count > 0
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Confirmé</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(summaryStats.byStatus.confirmed.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.confirmed.count} recette{summaryStats.byStatus.confirmed.count !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Reçu</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(summaryStats.byStatus.received.total)}</p>
            <p className="text-xs text-stone-400 mt-1">{summaryStats.byStatus.received.count} recette{summaryStats.byStatus.received.count !== 1 ? 's' : ''}</p>
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
            placeholder="Rechercher par client, description, catégorie, notes..."
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
          {types.length > 0 && (
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
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          {paymentMethods.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Paiement</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] transition-colors appearance-none cursor-pointer"
                style={selectStyle}
              >
                <option value="all">Tous</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m] ?? m}</option>
                ))}
              </select>
            </div>
          )}
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
              {sorted.length} recette{sorted.length !== 1 ? 's' : ''} sur {revenues.length}
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
            {hasActiveFilters ? 'Aucune recette ne correspond aux filtres' : 'Aucune recette'}
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
              onClick={onCreateRevenue}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une recette
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <SortableHeader label="Date" column="date" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Client" column="client" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Pôle</th>
                <SortableHeader label="HTVA" column="htva" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} className="text-right" />
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">TVA</th>
                <SortableHeader label="TTC" column="ttc" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} className="text-right" />
                <SortableHeader label="Statut" column="status" currentSort={sortColumn} currentDir={sortDirection} onSort={handleSort} />
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((revenue) => (
                <RevenueRow
                  key={revenue.id}
                  revenue={revenue}
                  onView={() => onViewRevenue(revenue)}
                  onEdit={() => onEditRevenue(revenue)}
                  onDelete={() => onDeleteRevenue(revenue.id)}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-300 bg-stone-50">
                <td className="px-4 py-3 text-sm font-semibold text-stone-700" colSpan={4}>
                  Total ({sorted.length} recette{sorted.length !== 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-stone-900 tabular-nums">
                  {formatCurrency(filteredTotals.htva)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-stone-700 tabular-nums">
                  {formatCurrency(filteredTotals.vat)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-bold text-stone-900 tabular-nums">
                  {formatCurrency(filteredTotals.ttc)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// --- RevenueRow ---

function RevenueRow({
  revenue,
  onView,
  onEdit,
  onDelete,
}: {
  revenue: RevenueItem
  onView: () => void
  onEdit: () => void
  onDelete: () => void
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

  const totalVat = revenue.vat6 + revenue.vat21
  const totalTtc = computeTtc(revenue)

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer" onClick={onView}>
      <td className="px-4 py-3 text-sm text-stone-600">{formatDate(revenue.date)}</td>
      <td className="px-4 py-3 text-sm font-medium text-stone-900">{revenue.contactName || '—'}</td>
      <td className="px-4 py-3 text-sm text-stone-700 max-w-[200px] truncate">{revenue.description || revenue.label || '—'}</td>
      <td className="px-4 py-3">
        {revenue.pole ? (
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: POLE_COLORS[revenue.pole] || '#a8a29e' }} />
            <span className="text-sm text-stone-600">{POLE_LABELS[revenue.pole] ?? revenue.pole}</span>
          </span>
        ) : (
          <span className="text-stone-300 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right text-stone-700 tabular-nums">{formatCurrency(revenue.amountExclVat)}</td>
      <td className="px-4 py-3 text-sm text-right text-stone-600 tabular-nums">{formatCurrency(totalVat)}</td>
      <td className="px-4 py-3 text-sm text-right font-medium text-stone-900 tabular-nums">{formatCurrency(totalTtc)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[revenue.status] ?? 'bg-stone-100 text-stone-700'}`}>
          {STATUS_LABELS[revenue.status] ?? revenue.status}
        </span>
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
              onClick={() => { setMenuOpen(false); onView() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Eye className="w-4 h-4" />
              Détail
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onDelete() }}
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
