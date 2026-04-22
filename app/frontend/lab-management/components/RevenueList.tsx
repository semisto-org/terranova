import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Edit3,
  FileText,
  Filter,
  Landmark,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'

export interface RevenueLinkedBankTransaction {
  reconciliationId: string
  transactionId: string
  connectionId: string
  bankName: string | null
  provider: string | null
  date: string | null
  amount: number
  allocatedAmount: number
  counterpartName: string | null
  remittanceInfo: string | null
  confidence: string
}

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
  vatExemption: boolean
  invoiceUrl: string | null
  paidAt: string | null
  reconciledAmount?: number
  fullyReconciled?: boolean
  bankTransactions?: RevenueLinkedBankTransaction[]
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmée',
  received: 'Encaissée',
}
const STATUS_BAR: Record<string, string> = {
  draft: 'bg-stone-300',
  confirmed: 'bg-amber-400',
  received: 'bg-emerald-500',
}
const STATUS_PILL: Record<string, string> = {
  draft: 'text-stone-600 ring-stone-300',
  confirmed: 'text-amber-700 ring-amber-300',
  received: 'text-emerald-700 ring-emerald-300',
}
const POLE_LABELS: Record<string, string> = {
  academy: 'Academy',
  design_studio: 'Design Studio',
  nursery: 'Nursery',
  roots: 'Roots',
  lab: 'Lab',
}

type Density = 'compact' | 'comfort'
type SortKey = 'date' | 'contactName' | 'pole' | 'amountExclVat' | 'amount' | 'status' | 'category'

const fmtMoney = (value: number) =>
  `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')
const stripHtml = (html: string) =>
  html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const normalizeText = (v: string | null | undefined) => (v || '').toLowerCase().trim()
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1)
const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

// Quarter helpers (TVA déclaration trimestrielle).
const quarterOf = (month: number) => Math.floor(month / 3)
const quarterLabel = (q: number, year: number) => `T${q + 1} ${year}`
const previousQuarter = (now: Date) => {
  const q = quarterOf(now.getMonth())
  const y = now.getFullYear()
  return q === 0 ? { quarter: 3, year: y - 1 } : { quarter: q - 1, year: y }
}
const isInQuarter = (date: Date, quarter: number, year: number) =>
  date.getFullYear() === year && quarterOf(date.getMonth()) === quarter
const toDate = (v: string | null | undefined) => {
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
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [poleFilter, setPoleFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [periodPreset, setPeriodPreset] = useState<'all' | 'thisMonth' | 'thisQuarter' | 'prevQuarter' | 'pending' | 'received' | 'followUp'>('all')
  const [density, setDensity] = useState<Density>('comfort')
  const [sort, setSort] = useState<Array<{ key: SortKey; dir: 'asc' | 'desc' }>>([{ key: 'date', dir: 'desc' }])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [drawerRevenueId, setDrawerRevenueId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const statuses = useMemo(() => Array.from(new Set(revenues.map((r) => r.status).filter(Boolean))), [revenues])
  const poles = useMemo(() => Array.from(new Set(revenues.map((r) => r.pole).filter(Boolean) as string[])), [revenues])
  const categories = useMemo(() => Array.from(new Set(revenues.map((r) => r.category).filter(Boolean) as string[])), [revenues])
  const sources = useMemo(() => Array.from(new Set(revenues.map((r) => r.contactName).filter(Boolean) as string[])), [revenues])

  const now = useMemo(() => new Date(), [])
  const prevQuarter = useMemo(() => previousQuarter(now), [now])
  const currentQuarter = useMemo(() => ({ quarter: quarterOf(now.getMonth()), year: now.getFullYear() }), [now])

  const filtered = useMemo(() => {
    const month = now.getMonth()
    const year = now.getFullYear()
    return revenues.filter((r) => {
      const hay = `${r.contactName || ''} ${r.description || ''} ${r.label || ''} ${r.notes || ''} ${r.category || ''}`.toLowerCase()
      if (query && !hay.includes(query.toLowerCase())) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (poleFilter !== 'all' && r.pole !== poleFilter) return false
      if (categoryFilter !== 'all' && (r.category || 'none') !== categoryFilter) return false
      if (sourceFilter !== 'all' && r.contactName !== sourceFilter) return false

      const d = toDate(r.date || r.createdAt)
      if (periodPreset === 'thisMonth' && (!d || d.getMonth() !== month || d.getFullYear() !== year)) return false
      if (periodPreset === 'thisQuarter' && (!d || !isInQuarter(d, currentQuarter.quarter, currentQuarter.year))) return false
      if (periodPreset === 'prevQuarter' && (!d || !isInQuarter(d, prevQuarter.quarter, prevQuarter.year))) return false
      if (periodPreset === 'pending' && r.status !== 'confirmed') return false
      if (periodPreset === 'received' && r.status !== 'received') return false
      if (periodPreset === 'followUp' && r.status !== 'confirmed') return false
      return true
    })
  }, [revenues, query, statusFilter, poleFilter, categoryFilter, sourceFilter, periodPreset, now, prevQuarter, currentQuarter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      for (const s of sort) {
        const mult = s.dir === 'asc' ? 1 : -1
        let cmp = 0
        switch (s.key) {
          case 'date':
            cmp = (toDate(a.date || a.createdAt)?.getTime() || 0) - (toDate(b.date || b.createdAt)?.getTime() || 0)
            break
          case 'amountExclVat':
            cmp = a.amountExclVat - b.amountExclVat
            break
          case 'amount':
            cmp = a.amount - b.amount
            break
          case 'contactName':
            cmp = normalizeText(a.contactName).localeCompare(normalizeText(b.contactName), 'fr')
            break
          case 'pole':
            cmp = normalizeText(a.pole).localeCompare(normalizeText(b.pole), 'fr')
            break
          case 'status':
            cmp = normalizeText(a.status).localeCompare(normalizeText(b.status), 'fr')
            break
          case 'category':
            cmp = normalizeText(a.category).localeCompare(normalizeText(b.category), 'fr')
            break
        }
        if (cmp !== 0) return cmp * mult
      }
      return 0
    })
    return arr
  }, [filtered, sort])

  const totals = useMemo(() => {
    const totalExclVat = sorted.reduce((s, r) => s + Number(r.amountExclVat || 0), 0)
    const totalVat = sorted.reduce((s, r) => s + Number(r.vat6 || 0) + Number(r.vat21 || 0), 0)
    const totalInclVat = totalExclVat + totalVat
    const receivedAmount = sorted
      .filter((r) => r.status === 'received')
      .reduce((s, r) => s + Number(r.amountExclVat || 0), 0)
    const pendingAmount = totalExclVat - receivedAmount
    const grouped = sorted.reduce((acc, r) => {
      const key = r.contactName || 'Sans source'
      acc[key] = (acc[key] || 0) + Number(r.amountExclVat || 0)
      return acc
    }, {} as Record<string, number>)
    const topSources = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { totalExclVat, totalVat, totalInclVat, receivedAmount, pendingAmount, topSources }
  }, [sorted])

  // Month-over-month trend based on current month vs previous month across all revenues
  const trendPct = useMemo(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const prevMonthEnd = new Date(thisMonthStart.getTime() - 1)
    const prevMonthStart = startOfMonth(prevMonthEnd)

    const sumBetween = (s: Date, e: Date) =>
      revenues
        .filter((r) => {
          const d = toDate(r.date || r.createdAt)
          return d ? d >= s && d <= e : false
        })
        .reduce((sum, r) => sum + Number(r.amountExclVat || 0), 0)

    const current = sumBetween(thisMonthStart, thisMonthEnd)
    const previous = sumBetween(prevMonthStart, prevMonthEnd)

    if (previous <= 0) return current > 0 ? 100 : null
    return ((current - previous) / previous) * 100
  }, [revenues])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, poleFilter, categoryFilter, sourceFilter, periodPreset, pageSize])
  useEffect(() => setSelectedIds((ids) => ids.filter((id) => sorted.some((r) => r.id === id))), [sorted])

  const allPageSelected = paginated.length > 0 && paginated.every((r) => selectedIds.includes(r.id))
  const drawerIndex = sorted.findIndex((r) => r.id === drawerRevenueId)
  const drawerRevenue = drawerIndex >= 0 ? sorted[drawerIndex] : null

  const cycleSort = (key: SortKey) => {
    setSort((prev) => {
      const current = prev.find((s) => s.key === key)
      if (!current) return [{ key, dir: 'asc' as const }, ...prev].slice(0, 2)
      if (current.dir === 'asc') {
        return prev.map((s) => (s.key === key ? { ...s, dir: 'desc' as const } : s))
      }
      return prev.filter((s) => s.key !== key)
    })
  }

  const sortDir = (key: SortKey) => sort.find((s) => s.key === key)?.dir

  const patchRevenue = async (id: string, patch: Partial<RevenueItem>) => {
    if (!onUpdateRevenue) return
    await onUpdateRevenue(id, patch)
  }

  const bulkApply = async (patch: Partial<RevenueItem>) => {
    if (!selectedIds.length || !onBulkUpdateRevenues) return
    try {
      setBulkBusy(true)
      await onBulkUpdateRevenues(selectedIds, patch)
      setSelectedIds([])
    } finally {
      setBulkBusy(false)
    }
  }

  const totalCount = revenues.length
  const filteredCount = sorted.length
  const isFiltered = filteredCount !== totalCount

  return (
    <div className="space-y-6">
      {/* Editorial header — ledger-style with structural rule */}
      <header className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#5B5781] rounded-full" aria-hidden />
        <div className="pl-5 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400 font-medium">Administration · Comptabilité</p>
            <h3 className="mt-1 font-serif text-3xl text-stone-900 tracking-tight">Recettes</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDensity(density === 'compact' ? 'comfort' : 'compact')}
              className="text-xs uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 transition-colors"
              title="Basculer la densité d'affichage"
            >
              {density === 'compact' ? 'Compact' : 'Confort'}
            </button>
            <button
              type="button"
              onClick={onCreateRevenue}
              className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B5781] transition-colors"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Nouvelle recette
            </button>
          </div>
        </div>

        {/* Ledger stats strip */}
        <div className="mt-5 pl-5 grid grid-cols-2 lg:grid-cols-5 gap-px bg-stone-200 border border-stone-200 rounded-xl overflow-hidden">
          <Stat label="Lignes" value={String(filteredCount)} hint={isFiltered ? `sur ${totalCount}` : 'au total'} />
          <Stat label="Total HT" value={fmtMoney(totals.totalExclVat)} accent />
          <Stat label="Total TTC" value={fmtMoney(totals.totalInclVat)} muted />
          <Stat
            label="En attente"
            value={fmtMoney(totals.pendingAmount)}
            hint={totals.totalExclVat > 0 ? `${Math.round((totals.pendingAmount / totals.totalExclVat) * 100)}% du total` : undefined}
            warn={totals.pendingAmount > 0}
          />
          <TrendStat trendPct={trendPct} />
        </div>
      </header>

      {/* Filter bar — single tactile row, search dominant */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="flex flex-wrap items-stretch gap-px bg-stone-200 rounded-xl overflow-hidden">
          <div className="relative flex-1 min-w-[260px] bg-white">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher client, description, catégorie…"
              className="w-full pl-11 pr-4 py-3 text-sm bg-transparent outline-none placeholder:text-stone-400 focus:bg-stone-50/60"
            />
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Statut" allLabel="Tous statuts">
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={poleFilter} onChange={setPoleFilter} label="Pôle" allLabel="Tous pôles">
            {poles.map((p) => (
              <option key={p} value={p}>
                {POLE_LABELS[p] ?? p}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={categoryFilter} onChange={setCategoryFilter} label="Catégorie" allLabel="Toutes catégories">
            <option value="none">Non catégorisée</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect value={sourceFilter} onChange={setSourceFilter} label="Source" allLabel="Toutes sources">
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        </div>

        {/* Saved-view chips */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-stone-100">
          <Filter className="w-3.5 h-3.5 text-stone-400 mx-1.5" />
          {(
            [
              ['all', 'Tout'],
              ['thisMonth', 'Ce mois-ci'],
              ['thisQuarter', `Ce trimestre (${quarterLabel(currentQuarter.quarter, currentQuarter.year)})`],
              ['prevQuarter', `Trimestre précédent (${quarterLabel(prevQuarter.quarter, prevQuarter.year)})`],
              ['pending', 'En attente'],
              ['received', 'Encaissées'],
              ['followUp', 'À relancer'],
            ] as const
          ).map(([id, label]) => {
            const active = periodPreset === id
            return (
              <button
                key={id}
                onClick={() => setPeriodPreset(id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            )
          })}
          {totals.topSources.length > 0 && (
            <div className="ml-auto hidden md:flex items-center gap-3 text-[11px] text-stone-500">
              <Sparkles className="w-3 h-3 text-stone-400" />
              <span className="uppercase tracking-wider text-[10px] text-stone-400">Top sources</span>
              {totals.topSources.map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-stone-400" />
                  <span className="truncate max-w-[120px]">{k}</span>
                  <span className="font-mono text-stone-700">{fmtMoney(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 rounded-xl bg-stone-900 text-white shadow-lg ring-1 ring-stone-900/10 px-4 py-2.5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            <span className="font-mono">{selectedIds.length}</span> sélectionnée{selectedIds.length > 1 ? 's' : ''}
          </span>
          <span className="h-4 w-px bg-white/20" />
          <BulkSelect onChange={(v) => v && bulkApply({ status: v })} placeholder="Changer statut" disabled={bulkBusy}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </BulkSelect>
          <BulkSelect onChange={(v) => v && bulkApply({ pole: v })} placeholder="Changer pôle" disabled={bulkBusy}>
            {poles.map((p) => (
              <option key={p} value={p}>
                {POLE_LABELS[p] ?? p}
              </option>
            ))}
          </BulkSelect>
          <BulkSelect onChange={(v) => v && bulkApply({ category: v })} placeholder="Changer catégorie" disabled={bulkBusy}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </BulkSelect>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-xs text-white/60 hover:text-white px-2 py-1"
          >
            Désélectionner
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-stone-200 bg-white py-20 text-center text-stone-400">
          <div className="inline-flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-[#5B5781] animate-pulse" />
            Chargement des recettes…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/60 py-10 text-center text-red-700 text-sm">
          Erreur : {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/40 py-20 text-center">
          <FileText className="w-10 h-10 mx-auto text-stone-300 mb-3" strokeWidth={1.25} />
          <p className="font-serif text-lg text-stone-700">Aucune recette pour ces filtres</p>
          <p className="text-sm text-stone-500 mt-1">Ajustez vos critères ou créez une nouvelle recette.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="max-h-[62vh] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200">
                <tr>
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input
                      type="checkbox"
                      className="accent-[#5B5781]"
                      checked={allPageSelected}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          allPageSelected
                            ? prev.filter((id) => !paginated.some((r) => r.id === id))
                            : Array.from(new Set([...prev, ...paginated.map((r) => r.id)])),
                        )
                      }
                    />
                  </th>
                  <SortHeader label="Date" dir={sortDir('date')} onClick={() => cycleSort('date')} />
                  <SortHeader label="Client / source" dir={sortDir('contactName')} onClick={() => cycleSort('contactName')} />
                  <SortHeader label="Pôle" dir={sortDir('pole')} onClick={() => cycleSort('pole')} />
                  <SortHeader label="Catégorie" dir={sortDir('category')} onClick={() => cycleSort('category')} />
                  <SortHeader label="Statut" dir={sortDir('status')} onClick={() => cycleSort('status')} />
                  <SortHeader label="HT" right dir={sortDir('amountExclVat')} onClick={() => cycleSort('amountExclVat')} />
                  <SortHeader label="TTC" right dir={sortDir('amount')} onClick={() => cycleSort('amount')} />
                  <th className="px-3 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em] text-right pr-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginated.map((r) => {
                  const isSelected = selectedIds.includes(r.id)
                  const rowPad = density === 'compact' ? 'py-2' : 'py-3.5'
                  const fontSize = density === 'compact' ? 'text-[13px]' : 'text-sm'
                  const descr = r.description || r.label
                  return (
                    <tr
                      key={r.id}
                      className={`group cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#5B5781]/[0.04]' : 'hover:bg-stone-50/70'
                      }`}
                      onClick={() => setDrawerRevenueId(r.id)}
                    >
                      <td className="pl-4 pr-2 relative" onClick={(ev) => ev.stopPropagation()}>
                        <span
                          className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${STATUS_BAR[r.status] ?? 'bg-stone-200'}`}
                          aria-hidden
                        />
                        <input
                          type="checkbox"
                          className="accent-[#5B5781]"
                          checked={isSelected}
                          onChange={(ev) =>
                            setSelectedIds((prev) =>
                              ev.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id),
                            )
                          }
                        />
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize} text-stone-500 whitespace-nowrap font-mono tabular-nums`}>
                        {fmtDate(r.date)}
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize}`}>
                        <div className="font-medium text-stone-900 truncate max-w-[260px]">
                          {r.contactName || <span className="text-stone-400 italic">Sans source</span>}
                        </div>
                        {descr && (
                          <div className="text-[11px] text-stone-400 truncate max-w-[260px] mt-0.5">{descr}</div>
                        )}
                      </td>
                      <td className={`px-3 ${rowPad}`} onClick={(ev) => ev.stopPropagation()}>
                        <select
                          className="text-xs rounded-md border border-transparent hover:border-stone-300 focus:border-[#5B5781] px-2 py-1 bg-transparent text-stone-700 max-w-[140px] cursor-pointer transition-colors"
                          value={r.pole || ''}
                          onChange={(ev) => patchRevenue(r.id, { pole: ev.target.value || null })}
                          disabled={!onUpdateRevenue}
                        >
                          <option value="">— Aucun</option>
                          {poles.map((p) => (
                            <option key={p} value={p}>
                              {POLE_LABELS[p] ?? p}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-3 ${rowPad}`} onClick={(ev) => ev.stopPropagation()}>
                        <select
                          className="text-xs rounded-md border border-transparent hover:border-stone-300 focus:border-[#5B5781] px-2 py-1 bg-transparent text-stone-700 max-w-[140px] cursor-pointer transition-colors"
                          value={r.category || ''}
                          onChange={(ev) => patchRevenue(r.id, { category: ev.target.value || null })}
                          disabled={!onUpdateRevenue}
                        >
                          <option value="">— Non catégorisée</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`px-3 ${rowPad}`} onClick={(ev) => ev.stopPropagation()}>
                        <div className="relative inline-flex">
                          <select
                            className={`appearance-none text-xs font-medium rounded-full ring-1 ring-inset bg-white pl-2.5 pr-6 py-0.5 cursor-pointer transition-colors ${
                              STATUS_PILL[r.status] ?? 'text-stone-600 ring-stone-300'
                            }`}
                            value={r.status}
                            onChange={(ev) => patchRevenue(r.id, { status: ev.target.value })}
                            disabled={!onUpdateRevenue}
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s] ?? s}
                              </option>
                            ))}
                          </select>
                          <ChevronsUpDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize} text-right text-stone-500 font-mono tabular-nums whitespace-nowrap`}>
                        {fmtMoney(r.amountExclVat)}
                      </td>
                      <td
                        className={`px-3 ${rowPad} ${fontSize} text-right font-mono tabular-nums font-semibold whitespace-nowrap text-stone-900`}
                      >
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          {(() => {
                            const linkedCount = r.bankTransactions?.length || 0
                            const isFully = Boolean(r.fullyReconciled) && linkedCount > 0
                            const isPartial = linkedCount > 0 && !isFully
                            if (isFully) {
                              return (
                                <span
                                  title={`Rapprochée · ${linkedCount} transaction${linkedCount > 1 ? 's' : ''} bancaire${linkedCount > 1 ? 's' : ''}`}
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600"
                                >
                                  <Landmark className="w-2.5 h-2.5" strokeWidth={2.5} />
                                </span>
                              )
                            }
                            if (isPartial) {
                              return (
                                <span
                                  title={`Partiellement rapprochée · ${linkedCount} transaction${linkedCount > 1 ? 's' : ''} liée${linkedCount > 1 ? 's' : ''}`}
                                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500/15 text-sky-700"
                                >
                                  <Landmark className="w-2.5 h-2.5" strokeWidth={2.5} />
                                </span>
                              )
                            }
                            return null
                          })()}
                          {fmtMoney(r.amount)}
                        </span>
                      </td>
                      <td className="px-3 pr-4 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="inline-flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <IconButton title="Voir le détail" onClick={() => onViewRevenue(r)}>
                            <FileText className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton title="Modifier" onClick={() => onEditRevenue(r)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton title="Supprimer" tone="danger" onClick={() => onDeleteRevenue(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 pr-20 py-3 border-t border-stone-100 bg-stone-50/40 text-xs text-stone-500">
            <div>
              Page <span className="font-mono text-stone-900">{page}</span> sur{' '}
              <span className="font-mono">{totalPages}</span>
              {' · '}
              <span className="font-mono">{paginated.length}</span> ligne{paginated.length > 1 ? 's' : ''} affichée
              {paginated.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs cursor-pointer"
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <button
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerRevenue && (
        <RevenueDrawer
          revenue={drawerRevenue}
          onClose={() => setDrawerRevenueId(null)}
          onPrev={() => drawerIndex > 0 && setDrawerRevenueId(sorted[drawerIndex - 1].id)}
          onNext={() => drawerIndex < sorted.length - 1 && setDrawerRevenueId(sorted[drawerIndex + 1].id)}
          onEdit={() => onEditRevenue(drawerRevenue)}
          hasPrev={drawerIndex > 0}
          hasNext={drawerIndex < sorted.length - 1}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  accent,
  muted,
  warn,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
  muted?: boolean
  warn?: boolean
}) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">{label}</div>
      <div
        className={`mt-1.5 font-mono tabular-nums text-xl ${
          accent
            ? 'text-[#5B5781] font-semibold'
            : warn
              ? 'text-amber-700 font-semibold'
              : muted
                ? 'text-stone-500'
                : 'text-stone-900 font-semibold'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-stone-400 font-mono">{hint}</div>}
    </div>
  )
}

function TrendStat({ trendPct }: { trendPct: number | null }) {
  const up = trendPct !== null && trendPct >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <div className="bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">Tendance M/M</div>
      <div
        className={`mt-1.5 font-mono tabular-nums text-xl font-semibold inline-flex items-center gap-1.5 ${
          trendPct === null ? 'text-stone-500' : up ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {trendPct !== null && <Icon className="w-4 h-4" />}
        {trendPct === null ? '—' : `${up ? '+' : ''}${trendPct.toFixed(1)}%`}
      </div>
      <div className="mt-0.5 text-[11px] text-stone-400 font-mono">vs mois précédent</div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  label,
  allLabel,
  children,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  allLabel: string
  children: React.ReactNode
}) {
  const isActive = value !== 'all'
  return (
    <div className={`relative flex-1 min-w-[140px] bg-white ${isActive ? 'bg-[#5B5781]/[0.04]' : ''}`}>
      <span className="absolute left-4 top-1.5 text-[9px] uppercase tracking-[0.14em] text-stone-400 font-medium pointer-events-none">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-4 pr-8 pt-5 pb-2 text-sm bg-transparent appearance-none cursor-pointer outline-none ${
          isActive ? 'text-[#5B5781] font-medium' : 'text-stone-700'
        }`}
      >
        <option value="all">{allLabel}</option>
        {children}
      </select>
      <ChevronsUpDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
    </div>
  )
}

function BulkSelect({
  onChange,
  placeholder,
  children,
  disabled,
}: {
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <select
      onChange={(e) => {
        onChange(e.target.value)
        e.target.value = ''
      }}
      defaultValue=""
      disabled={disabled}
      className="rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-white px-2 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed [&>option]:text-stone-900"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {children}
    </select>
  )
}

function IconButton({
  children,
  onClick,
  title,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  tone?: 'default' | 'danger'
}) {
  const palette =
    tone === 'danger'
      ? 'text-stone-400 hover:text-red-600 hover:bg-red-50'
      : 'text-stone-400 hover:text-[#5B5781] hover:bg-[#5B5781]/10'
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`group/tip relative p-1.5 rounded-md transition-colors ${palette}`}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full right-1/2 translate-x-1/2 mb-1.5 px-2 py-1 bg-stone-900 text-white text-[11px] font-medium rounded whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-10 shadow-lg">
        {title}
      </span>
    </button>
  )
}

function SortHeader({
  label,
  dir,
  onClick,
  right,
}: {
  label: string
  dir?: 'asc' | 'desc'
  onClick: () => void
  right?: boolean
}) {
  return (
    <th className={`px-3 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em] ${right ? 'text-right' : ''}`}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-stone-900 transition-colors ${dir ? 'text-[#5B5781]' : ''}`}
      >
        {label}
        {dir === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : dir === 'desc' ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        )}
      </button>
    </th>
  )
}

function RevenueDrawer({
  revenue,
  onClose,
  onPrev,
  onNext,
  onEdit,
  hasPrev,
  hasNext,
}: {
  revenue: RevenueItem
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onEdit: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  const descr = revenue.description || revenue.label
  const totalVat = Number(revenue.vat6 || 0) + Number(revenue.vat21 || 0)

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-[slideInRight_.25s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="relative px-6 pt-6 pb-5 border-b border-stone-100">
          <div
            className={`absolute left-0 top-6 bottom-5 w-[3px] rounded-full ${STATUS_BAR[revenue.status] ?? 'bg-stone-200'}`}
            aria-hidden
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pl-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                Recette · {fmtDate(revenue.date)}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-stone-900 leading-tight truncate">
                {revenue.contactName || revenue.label || 'Sans source'}
              </h3>
              {descr && <p className="mt-1 text-sm text-stone-500 truncate">{descr}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-md text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amounts hero */}
          <div className="mt-5 pl-3 flex items-baseline gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">Total TTC</div>
              <div className="font-mono tabular-nums text-3xl font-semibold text-[#5B5781]">
                {fmtMoney(revenue.amount)}
              </div>
            </div>
            <div className="h-10 w-px bg-stone-200" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">HT</div>
              <div className="font-mono tabular-nums text-base text-stone-600">{fmtMoney(revenue.amountExclVat)}</div>
            </div>
            {totalVat > 0 && (
              <>
                <div className="h-10 w-px bg-stone-200" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">TVA</div>
                  <div className="font-mono tabular-nums text-base text-stone-600">{fmtMoney(totalVat)}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <DrawerField label="Statut">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${
                  STATUS_PILL[revenue.status] ?? 'text-stone-600 ring-stone-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BAR[revenue.status] ?? 'bg-stone-300'}`} />
                {STATUS_LABELS[revenue.status] ?? revenue.status}
              </span>
            </DrawerField>
            <DrawerField label="Catégorie">
              {revenue.category ? (
                revenue.category
              ) : (
                <span className="text-stone-400 italic">Non catégorisée</span>
              )}
            </DrawerField>
            <DrawerField label="Pôle">
              {revenue.pole ? POLE_LABELS[revenue.pole] ?? revenue.pole : '—'}
            </DrawerField>
            <DrawerField label="Type">{revenue.revenueType || '—'}</DrawerField>
            {revenue.vatRate && <DrawerField label="Taux TVA">{revenue.vatRate}</DrawerField>}
            {revenue.vatExemption && <DrawerField label="Exonération TVA">{revenue.vatExemption}</DrawerField>}
            {revenue.paymentMethod && <DrawerField label="Mode paiement">{revenue.paymentMethod}</DrawerField>}
            {revenue.paidAt && <DrawerField label="Encaissée le">{fmtDate(revenue.paidAt)}</DrawerField>}
            {revenue.invoiceUrl && (
              <DrawerField label="Facture" wide>
                <a
                  href={revenue.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#5B5781] hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Consulter le document
                </a>
              </DrawerField>
            )}
          </dl>

          {revenue.notes && (
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">Notes</div>
              <div className="rounded-lg bg-stone-50 border border-stone-200/60 p-4 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {stripHtml(revenue.notes)}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/40 flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Recette précédente"
            title="Précédente (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Recette suivante"
            title="Suivante (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-stone-900 hover:bg-[#5B5781] text-white px-5 py-2 text-sm font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </aside>
    </div>
  )
}

function DrawerField({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-medium">{label}</dt>
      <dd className="mt-1 text-stone-800">{children}</dd>
    </div>
  )
}
