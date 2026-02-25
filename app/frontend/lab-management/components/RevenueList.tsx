import { useMemo, useState } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  X,
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

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  received: 'Encaissée',
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

type Density = 'compact' | 'comfortable'
type SortKey = 'date' | 'contactName' | 'pole' | 'amountExclVat' | 'status' | 'category'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function normalizeText(v: string | null | undefined): string {
  return (v || '').toLowerCase().trim()
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function toDate(v: string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export interface RevenueListProps {
  revenues: RevenueItem[]
  loading?: boolean
  error?: string | null
  onCreateRevenue: () => void
  onEditRevenue: (revenue: RevenueItem) => void
  onDeleteRevenue: (revenueId: string) => void
  onViewRevenue: (revenue: RevenueItem) => void
  onUpdateRevenue?: (revenueId: string, patch: Partial<RevenueItem>) => Promise<void>
  onBulkUpdateRevenues?: (ids: string[], patch: Partial<RevenueItem>) => Promise<void>
}

export function RevenueList({
  revenues,
  loading = false,
  error = null,
  onCreateRevenue,
  onEditRevenue,
  onDeleteRevenue,
  onViewRevenue,
  onUpdateRevenue,
  onBulkUpdateRevenues,
}: RevenueListProps) {
  const [density, setDensity] = useState<Density>('comfortable')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [periodStart, setPeriodStart] = useState<string>(startOfMonth().toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState<string>(endOfMonth().toISOString().slice(0, 10))

  const [sorts, setSorts] = useState<Array<{ key: SortKey; dir: 'asc' | 'desc' }>>([{ key: 'date', dir: 'desc' }])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [inlineBusyId, setInlineBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [drawerIndex, setDrawerIndex] = useState<number | null>(null)

  const statuses = useMemo(() => Array.from(new Set(revenues.map((r) => r.status))).filter(Boolean), [revenues])
  const poles = useMemo(() => Array.from(new Set(revenues.map((r) => r.pole).filter(Boolean) as string[])), [revenues])
  const categories = useMemo(() => Array.from(new Set(revenues.map((r) => r.category).filter(Boolean) as string[])), [revenues])
  const sources = useMemo(() => Array.from(new Set(revenues.map((r) => r.contactName).filter(Boolean) as string[])), [revenues])

  const filtered = useMemo(() => {
    const q = normalizeText(search)
    const min = minAmount ? Number(minAmount) : null
    const max = maxAmount ? Number(maxAmount) : null
    const start = toDate(periodStart)
    const end = toDate(periodEnd)

    return revenues.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (poleFilter !== 'all' && r.pole !== poleFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (sourceFilter !== 'all' && r.contactName !== sourceFilter) return false

      const refDate = toDate(r.date || r.createdAt)
      if (start && refDate && refDate < start) return false
      if (end && refDate && refDate > end) return false

      if (min !== null && r.amountExclVat < min) return false
      if (max !== null && r.amountExclVat > max) return false

      if (q) {
        const haystack = [r.contactName, r.description, r.label, r.category, r.revenueType, r.status, r.pole].map(normalizeText).join(' ')
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [revenues, statusFilter, poleFilter, categoryFilter, sourceFilter, periodStart, periodEnd, minAmount, maxAmount, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const compare = (a: RevenueItem, b: RevenueItem, key: SortKey) => {
      switch (key) {
        case 'date':
          return (toDate(a.date || a.createdAt)?.getTime() || 0) - (toDate(b.date || b.createdAt)?.getTime() || 0)
        case 'amountExclVat':
          return a.amountExclVat - b.amountExclVat
        case 'contactName':
          return normalizeText(a.contactName).localeCompare(normalizeText(b.contactName))
        case 'pole':
          return normalizeText(a.pole).localeCompare(normalizeText(b.pole))
        case 'status':
          return normalizeText(a.status).localeCompare(normalizeText(b.status))
        case 'category':
          return normalizeText(a.category).localeCompare(normalizeText(b.category))
      }
    }

    arr.sort((a, b) => {
      for (const s of sorts) {
        const c = compare(a, b, s.key)
        if (c !== 0) return s.dir === 'asc' ? c : -c
      }
      return 0
    })
    return arr
  }, [filtered, sorts])

  const pageCount = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return sorted.slice(start, start + rowsPerPage)
  }, [sorted, safePage, rowsPerPage])

  const totalHtv = useMemo(() => filtered.reduce((sum, r) => sum + r.amountExclVat, 0), [filtered])
  const totalVat = useMemo(() => filtered.reduce((sum, r) => sum + r.vat6 + r.vat21, 0), [filtered])
  const totalTtc = totalHtv + totalVat
  const receivedAmount = useMemo(() => filtered.filter((r) => r.status === 'received').reduce((s, r) => s + r.amountExclVat, 0), [filtered])
  const pendingAmount = totalHtv - receivedAmount

  const topSources = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filtered) {
      const k = r.contactName || 'Sans source'
      map.set(k, (map.get(k) || 0) + r.amountExclVat)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [filtered])

  const trendPct = useMemo(() => {
    const start = toDate(periodStart)
    const end = toDate(periodEnd)
    if (!start || !end) return null
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - days * 24 * 3600 * 1000)

    const current = revenues
      .filter((r) => {
        const d = toDate(r.date || r.createdAt)
        return d ? d >= start && d <= end : false
      })
      .reduce((s, r) => s + r.amountExclVat, 0)

    const previous = revenues
      .filter((r) => {
        const d = toDate(r.date || r.createdAt)
        return d ? d >= prevStart && d <= prevEnd : false
      })
      .reduce((s, r) => s + r.amountExclVat, 0)

    if (previous <= 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }, [revenues, periodStart, periodEnd])

  const allPageSelected = pageItems.length > 0 && pageItems.every((r) => selectedIds.has(r.id))

  const applyPreset = (preset: 'thisMonth' | 'pending' | 'received' | 'followUp') => {
    if (preset === 'thisMonth') {
      setPeriodStart(startOfMonth().toISOString().slice(0, 10))
      setPeriodEnd(endOfMonth().toISOString().slice(0, 10))
      setStatusFilter('all')
    }
    if (preset === 'pending') {
      setStatusFilter('confirmed')
    }
    if (preset === 'received') {
      setStatusFilter('received')
    }
    if (preset === 'followUp') {
      setStatusFilter('confirmed')
      setMaxAmount('')
      setMinAmount('')
    }
    setPage(1)
  }

  const toggleSort = (key: SortKey, multi = false) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key)
      const base = multi ? [...prev] : []
      if (!existing) return [...base, { key, dir: 'asc' }]
      if (existing.dir === 'asc') return [...base.filter((s) => s.key !== key), { key, dir: 'desc' }]
      return base.filter((s) => s.key !== key)
    })
  }

  const toggleSelectAllPage = () => {
    const next = new Set(selectedIds)
    if (allPageSelected) pageItems.forEach((r) => next.delete(r.id))
    else pageItems.forEach((r) => next.add(r.id))
    setSelectedIds(next)
  }

  const patchRevenue = async (id: string, patch: Partial<RevenueItem>) => {
    if (!onUpdateRevenue) return
    try {
      setInlineBusyId(id)
      await onUpdateRevenue(id, patch)
    } finally {
      setInlineBusyId(null)
    }
  }

  const bulkApply = async (patch: Partial<RevenueItem>) => {
    const ids = Array.from(selectedIds)
    if (!ids.length || !onBulkUpdateRevenues) return
    try {
      setBulkBusy(true)
      await onBulkUpdateRevenues(ids, patch)
      setSelectedIds(new Set())
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Recettes</h3>
          <p className="text-sm text-stone-500 mt-1">Pilotage et opérations centralisées des revenus</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            Densité: {density === 'compact' ? 'Compacte' : 'Confort'}
          </button>
          <button type="button" onClick={onCreateRevenue} className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="w-4 h-4" /> Ajouter une recette
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <KpiCard label="Total HTVA" value={formatCurrency(totalHtv)} />
        <KpiCard label="TVA" value={formatCurrency(totalVat)} />
        <KpiCard label="Total TTC" value={formatCurrency(totalTtc)} />
        <KpiCard label="En attente" value={formatCurrency(pendingAmount)} />
        <KpiCard label="Tendance" value={trendPct === null ? '—' : `${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}%`} />
      </div>

      {topSources.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">
          Top sources: {topSources.map(([name, amount]) => `${name} (${formatCurrency(amount)})`).join(' • ')}
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => applyPreset('thisMonth')} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium">Ce mois</button>
          <button type="button" onClick={() => applyPreset('pending')} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium">En attente</button>
          <button type="button" onClick={() => applyPreset('received')} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium">Encaissées</button>
          <button type="button" onClick={() => applyPreset('followUp')} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium">À relancer</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Recherche" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Source/client</option>{sources.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Catégorie</option>{categories.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={poleFilter} onChange={(e) => setPoleFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Pôle</option>{poles.map((v) => <option key={v} value={v}>{POLE_LABELS[v] ?? v}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Statut paiement</option>{statuses.map((v) => <option key={v} value={v}>{STATUS_LABELS[v] ?? v}</option>)}</select>
          <input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} type="number" min={0} placeholder="Montant min" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} type="number" min={0} placeholder="Montant max" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-[#5B5781]/30 bg-[#5B5781]/5 p-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{selectedIds.size} sélectionnée(s)</span>
          <BulkQuickEdit label="Statut" options={statuses.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))} onApply={(v) => bulkApply({ status: v })} busy={bulkBusy} />
          <BulkQuickEdit label="Pôle" options={poles.map((s) => ({ value: s, label: POLE_LABELS[s] ?? s }))} onApply={(v) => bulkApply({ pole: v })} busy={bulkBusy} />
          <BulkQuickEdit label="Catégorie" options={categories.map((s) => ({ value: s, label: s }))} onApply={(v) => bulkApply({ category: v })} busy={bulkBusy} />
          <button type="button" onClick={() => setSelectedIds(new Set())} className="ml-auto inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"><X className="w-4 h-4" /> Effacer</button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-stone-200 bg-white p-10 text-center text-stone-500">Chargement des recettes…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">Erreur: {error}</div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-10 text-center">
          <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 mb-4">Aucune recette sur ce filtre</p>
          <button type="button" onClick={onCreateRevenue} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"><Plus className="w-4 h-4" />Ajouter</button>
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded-xl border border-stone-200 bg-white max-h-[70vh]">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllPage} /></th>
                  <SortableHead label="Date" sortKey="date" sorts={sorts} onToggle={toggleSort} />
                  <SortableHead label="Client / source" sortKey="contactName" sorts={sorts} onToggle={toggleSort} />
                  <th className="px-3 py-2 text-xs uppercase text-stone-600">Description</th>
                  <SortableHead label="Pôle" sortKey="pole" sorts={sorts} onToggle={toggleSort} />
                  <SortableHead label="Catégorie" sortKey="category" sorts={sorts} onToggle={toggleSort} />
                  <SortableHead label="Montant HTVA" sortKey="amountExclVat" sorts={sorts} onToggle={toggleSort} align="right" />
                  <SortableHead label="Statut" sortKey="status" sorts={sorts} onToggle={toggleSort} />
                  <th className="px-3 py-2 w-16" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((revenue, idx) => (
                  <tr key={revenue.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className={density === 'compact' ? 'px-3 py-1' : 'px-3 py-2'}><input type="checkbox" checked={selectedIds.has(revenue.id)} onChange={() => {
                      const next = new Set(selectedIds)
                      if (next.has(revenue.id)) next.delete(revenue.id)
                      else next.add(revenue.id)
                      setSelectedIds(next)
                    }} /></td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm' : 'px-3 py-2 text-sm'}>
                      <InlineDate value={revenue.date} disabled={!onUpdateRevenue || inlineBusyId === revenue.id} onSave={(v) => patchRevenue(revenue.id, { date: v })} />
                    </td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm font-medium' : 'px-3 py-2 text-sm font-medium'}>{revenue.contactName || '—'}</td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm max-w-[250px] truncate' : 'px-3 py-2 text-sm max-w-[250px] truncate'}>{revenue.description || revenue.label || '—'}</td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm' : 'px-3 py-2 text-sm'}>
                      <InlineSelect value={revenue.pole || ''} disabled={!onUpdateRevenue || inlineBusyId === revenue.id} options={poles} render={(v) => POLE_LABELS[v] ?? v} onSave={(v) => patchRevenue(revenue.id, { pole: v || null })} />
                    </td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm' : 'px-3 py-2 text-sm'}>
                      <InlineText value={revenue.category || ''} disabled={!onUpdateRevenue || inlineBusyId === revenue.id} onSave={(v) => patchRevenue(revenue.id, { category: v || null })} />
                    </td>
                    <td className={density === 'compact' ? 'px-3 py-1 text-sm text-right' : 'px-3 py-2 text-sm text-right'}>
                      <InlineNumber value={revenue.amountExclVat} disabled={!onUpdateRevenue || inlineBusyId === revenue.id} onSave={(v) => patchRevenue(revenue.id, { amountExclVat: v, amount: v + revenue.vat6 + revenue.vat21 })} formatter={formatCurrency} />
                    </td>
                    <td className={density === 'compact' ? 'px-3 py-1' : 'px-3 py-2'}>
                      <InlineSelect value={revenue.status} disabled={!onUpdateRevenue || inlineBusyId === revenue.id} options={statuses} render={(v) => STATUS_LABELS[v] ?? v} badge={(v) => STATUS_COLORS[v] ?? 'bg-stone-100 text-stone-700'} onSave={(v) => patchRevenue(revenue.id, { status: v })} />
                    </td>
                    <td className={density === 'compact' ? 'px-3 py-1' : 'px-3 py-2'}>
                      <div className="flex items-center gap-1 justify-end">
                        <button type="button" onClick={() => { const absolute = (safePage - 1) * rowsPerPage + idx; setDrawerIndex(absolute); onViewRevenue(revenue) }} className="p-1.5 rounded hover:bg-stone-100 text-stone-600"><FileText className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onEditRevenue(revenue)} className="p-1.5 rounded hover:bg-stone-100 text-stone-600"><Edit3 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onDeleteRevenue(revenue.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-600">
            <div>{sorted.length} résultat(s)</div>
            <div className="flex items-center gap-2">
              <label>Lignes</label>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1) }} className="rounded border border-stone-300 px-2 py-1">
                {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-1 rounded border border-stone-300 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span>Page {safePage}/{pageCount}</span>
              <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="p-1 rounded border border-stone-300 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}

      {drawerIndex !== null && sorted[drawerIndex] && (
        <RevenueDrawer
          revenue={sorted[drawerIndex]}
          index={drawerIndex}
          total={sorted.length}
          onClose={() => setDrawerIndex(null)}
          onPrev={() => setDrawerIndex((i) => (i === null ? i : Math.max(0, i - 1)))}
          onNext={() => setDrawerIndex((i) => (i === null ? i : Math.min(sorted.length - 1, i + 1)))}
          onEdit={() => onEditRevenue(sorted[drawerIndex])}
        />
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-stone-200 bg-white px-3 py-2"><div className="text-xs text-stone-500">{label}</div><div className="text-lg font-semibold text-stone-900">{value}</div></div>
}

function SortableHead({ label, sortKey, sorts, onToggle, align = 'left' }: { label: string; sortKey: SortKey; sorts: Array<{ key: SortKey; dir: 'asc' | 'desc' }>; onToggle: (key: SortKey, multi?: boolean) => void; align?: 'left' | 'right' }) {
  const current = sorts.find((s) => s.key === sortKey)
  return (
    <th className={`px-3 py-2 text-xs uppercase text-stone-600 ${align === 'right' ? 'text-right' : ''}`}>
      <button type="button" onClick={(e) => onToggle(sortKey, e.shiftKey)} className={`inline-flex items-center gap-1 ${align === 'right' ? 'ml-auto' : ''}`} title="Shift+clic pour tri multi-colonnes">
        {label}
        {!current && <ChevronsUpDown className="w-3.5 h-3.5" />}
        {current?.dir === 'asc' && <ArrowUp className="w-3.5 h-3.5" />}
        {current?.dir === 'desc' && <ArrowDown className="w-3.5 h-3.5" />}
      </button>
    </th>
  )
}

function InlineSelect({ value, options, onSave, render, badge, disabled }: { value: string; options: string[]; onSave: (v: string) => void; render?: (v: string) => string; badge?: (v: string) => string; disabled?: boolean }) {
  if (disabled) {
    return <span className={badge ? `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge(value)}` : ''}>{render ? render(value) : value || '—'}</span>
  }
  return (
    <select value={value} onChange={(e) => onSave(e.target.value)} className={`rounded border border-stone-300 px-2 py-1 text-xs ${badge ? badge(value) : ''}`}>
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{render ? render(o) : o}</option>)}
    </select>
  )
}

function InlineText({ value, onSave, disabled }: { value: string; onSave: (v: string) => void; disabled?: boolean }) {
  if (disabled) return <span>{value || '—'}</span>
  return <input defaultValue={value} onBlur={(e) => onSave(e.target.value)} className="w-full rounded border border-stone-300 px-2 py-1 text-xs" placeholder="—" />
}

function InlineNumber({ value, onSave, formatter, disabled }: { value: number; onSave: (v: number) => void; formatter: (n: number) => string; disabled?: boolean }) {
  if (disabled) return <span>{formatter(value)}</span>
  return <input type="number" min={0} step="0.01" defaultValue={String(value)} onBlur={(e) => onSave(Number(e.target.value || 0))} className="w-28 rounded border border-stone-300 px-2 py-1 text-xs text-right" />
}

function InlineDate({ value, onSave, disabled }: { value: string | null; onSave: (v: string | null) => void; disabled?: boolean }) {
  if (disabled) return <span>{formatDate(value)}</span>
  return <input type="date" defaultValue={value ? value.slice(0, 10) : ''} onBlur={(e) => onSave(e.target.value || null)} className="rounded border border-stone-300 px-2 py-1 text-xs" />
}

function BulkQuickEdit({ label, options, onApply, busy }: { label: string; options: Array<{ value: string; label: string }>; onApply: (value: string) => void; busy?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-stone-600">{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="rounded border border-stone-300 px-2 py-1 text-xs">
        <option value="">Choisir</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button type="button" disabled={!value || busy} onClick={() => onApply(value)} className="rounded bg-[#5B5781] px-2 py-1 text-xs text-white disabled:opacity-40">Appliquer</button>
    </div>
  )
}

function RevenueDrawer({ revenue, index, total, onClose, onPrev, onNext, onEdit }: { revenue: RevenueItem; index: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" onClick={onClose}>
      <div className="h-full w-full max-w-xl bg-white shadow-2xl border-l border-stone-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500">Recette {index + 1}/{total}</div>
            <div className="font-semibold text-stone-900">{revenue.contactName || revenue.label || 'Recette'}</div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrev} className="p-2 rounded border border-stone-300"><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" onClick={onNext} className="p-2 rounded border border-stone-300"><ChevronRight className="w-4 h-4" /></button>
            <button type="button" onClick={onClose} className="p-2 rounded border border-stone-300"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-4 space-y-3 text-sm overflow-auto">
          <Field label="Date" value={formatDate(revenue.date)} />
          <Field label="Client" value={revenue.contactName || '—'} />
          <Field label="Description" value={revenue.description || revenue.label || '—'} />
          <Field label="Pôle" value={revenue.pole ? POLE_LABELS[revenue.pole] || revenue.pole : '—'} />
          <Field label="Catégorie" value={revenue.category || '—'} />
          <Field label="Statut" value={STATUS_LABELS[revenue.status] || revenue.status} />
          <Field label="Montant HTVA" value={formatCurrency(revenue.amountExclVat)} />
          <Field label="TVA" value={formatCurrency(revenue.vat6 + revenue.vat21)} />
          <Field label="Montant TTC" value={formatCurrency(revenue.amount)} />
          <Field label="Paiement" value={revenue.paymentMethod || '—'} />
          <Field label="Notes" value={revenue.notes || '—'} />
        </div>
        <div className="p-4 border-t border-stone-200">
          <button type="button" onClick={onEdit} className="w-full rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white">Modifier</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-stone-500">{label}</div><div className="text-stone-900">{value}</div></div>
}
