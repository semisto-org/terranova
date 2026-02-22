import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react'

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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  received: 'Reçu',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-700',
  confirmed: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
}

const POLE_LABELS: Record<string, string> = {
  academy: 'Academy',
  design_studio: 'Design Studio',
  nursery: 'Nursery',
  roots: 'Roots',
}

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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = revenues.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (poleFilter !== 'all' && r.pole !== poleFilter) return false
    if (typeFilter !== 'all' && r.revenueType !== typeFilter) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const da = a.date || a.createdAt
    const db = b.date || b.createdAt
    return new Date(db).getTime() - new Date(da).getTime()
  })

  const statuses = Array.from(new Set(revenues.map((r) => r.status)))
  const poles = Array.from(new Set(revenues.map((r) => r.pole).filter(Boolean) as string[]))
  const types = Array.from(new Set(revenues.map((r) => r.revenueType).filter(Boolean) as string[]))

  return (
    <div className="space-y-4">
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
        {types.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white text-stone-900 text-sm px-3 py-1.5"
          >
            <option value="all">Tous les types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-500">Chargement...</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-12 text-center">
          <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucune recette</p>
          <button
            type="button"
            onClick={onCreateRevenue}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter une recette
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Client</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Pôle</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">Montant HTVA</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">TVA</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase text-right">Montant TTC</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-600 uppercase">Statut</th>
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
          </table>
        </div>
      )}
    </div>
  )
}

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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const totalVat = revenue.vat6 + revenue.vat21
  const totalTtc = revenue.amountExclVat + totalVat

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer" onClick={onView}>
      <td className="px-4 py-3 text-sm text-stone-600">{formatDate(revenue.date)}</td>
      <td className="px-4 py-3 text-sm font-medium text-stone-900">{revenue.contactName || '—'}</td>
      <td className="px-4 py-3 text-sm text-stone-700 max-w-[200px] truncate">{revenue.description || revenue.label || '—'}</td>
      <td className="px-4 py-3 text-sm text-stone-600">{revenue.pole ? (POLE_LABELS[revenue.pole] ?? revenue.pole) : '—'}</td>
      <td className="px-4 py-3 text-sm text-right text-stone-700">{formatCurrency(revenue.amountExclVat)}</td>
      <td className="px-4 py-3 text-sm text-right text-stone-600">{formatCurrency(totalVat)}</td>
      <td className="px-4 py-3 text-sm text-right font-medium text-stone-900">{formatCurrency(totalTtc)}</td>
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
          <Edit className="w-4 h-4" />
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
