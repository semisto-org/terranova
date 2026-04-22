import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Edit3,
  FileText,
  Filter,
  Lock,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react'

export interface ExpenseItem {
  id: string
  name: string
  supplier: string
  status: string
  invoiceDate: string | null
  category: string | null // legacy — kept in sync with categoryLabel by the backend
  categoryId: string | null
  categoryLabel: string | null
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
  reconciledAmount?: number
  fullyReconciled?: boolean
  createdAt: string
}

export interface ExpenseCategoryOption {
  id: string
  label: string
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Prévue',
  processing: 'Traitement',
  ready_for_payment: 'À payer',
  paid: 'Payée',
}
const STATUS_BAR: Record<string, string> = {
  planned: 'bg-stone-300',
  processing: 'bg-amber-400',
  ready_for_payment: 'bg-orange-500',
  paid: 'bg-emerald-500',
}
const STATUS_PILL: Record<string, string> = {
  planned: 'text-stone-600 ring-stone-300',
  processing: 'text-amber-700 ring-amber-300',
  ready_for_payment: 'text-orange-700 ring-orange-300',
  paid: 'text-emerald-700 ring-emerald-300',
}
const EXPENSE_TYPE_LABELS: Record<string, string> = {
  services_and_goods: 'Services & biens',
  salaries: 'Salaires',
  merchandise: 'Marchandises',
  other: 'Autres',
  corporate_tax: 'Impôts sociétés',
  exceptional_expenses: 'Exceptionnelles',
  financial_expenses: 'Financières',
  provisions_and_depreciation: 'Amortissements',
  taxes_and_duties: 'Taxes & impôts',
}
const BILLING_ZONE_LABELS: Record<string, string> = { belgium: 'Belgique', intra_eu: 'Intra UE', extra_eu: 'Hors UE' }
const POLE_LABELS: Record<string, string> = { lab: 'Lab', design: 'Design', academy: 'Academy', nursery: 'Nursery' }
const POLE_TEXT_COLOR: Record<string, string> = {
  lab: '#5B5781',
  design: '#6F7900',
  academy: '#B01A19',
  nursery: '#B36F00',
}
const POLE_BG_COLOR: Record<string, string> = {
  lab: '#e8e5ed',
  design: '#eef0e0',
  academy: '#f5dad3',
  nursery: '#fdf0d6',
}
const fmtMoney = (value: number) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')

// Quarter helpers (TVA déclaration trimestrielle).
// Returns 0-indexed quarter (0 = Jan-Mar, 1 = Apr-Jun, 2 = Jul-Sep, 3 = Oct-Dec).
const quarterOf = (month: number) => Math.floor(month / 3)
const quarterLabel = (q: number, year: number) => `T${q + 1} ${year}`
const previousQuarter = (now: Date) => {
  const q = quarterOf(now.getMonth())
  const y = now.getFullYear()
  return q === 0 ? { quarter: 3, year: y - 1 } : { quarter: q - 1, year: y }
}
const isInQuarter = (date: Date, quarter: number, year: number) =>
  date.getFullYear() === year && quarterOf(date.getMonth()) === quarter
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

type SortKey = 'invoiceDate' | 'supplier' | 'status' | 'totalInclVat' | 'amountExclVat' | 'category'

export interface ExpenseListProps {
  expenses: ExpenseItem[]
  loading?: boolean
  categories?: ExpenseCategoryOption[]
  isAdmin?: boolean
  onCreateExpense: () => void
  onEditExpense: (expense: ExpenseItem) => void
  onDeleteExpense: (expenseId: string) => void
  onInlineUpdate?: (expenseId: string, changes: Partial<ExpenseItem>) => Promise<void> | void
  onBulkUpdate?: (ids: string[], changes: Partial<ExpenseItem>) => Promise<void> | void
  onBulkDelete?: (ids: string[]) => void
  onManageCategories?: () => void
  trainingOptions?: { value: string; label: string }[]
  designProjectOptions?: { value: string; label: string }[]
}

export function ExpenseList({
  expenses,
  loading = false,
  categories: categoriesProp,
  isAdmin = false,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
  onInlineUpdate,
  onBulkUpdate,
  onBulkDelete,
  onManageCategories,
}: ExpenseListProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [poleFilter, setPoleFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [periodPreset, setPeriodPreset] = useState<'all' | 'thisMonth' | 'thisQuarter' | 'prevQuarter' | 'noCategory' | 'withoutBill' | 'toValidate'>('all')
  const [density, setDensity] = useState<'compact' | 'comfort'>('comfort')
  const [sort, setSort] = useState<Array<{ key: SortKey; dir: 'asc' | 'desc' }>>([{ key: 'invoiceDate', dir: 'desc' }])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [drawerExpenseId, setDrawerExpenseId] = useState<string | null>(null)

  const statuses = useMemo(() => Array.from(new Set(expenses.map((e) => e.status))), [expenses])
  const poles = useMemo(() => Array.from(new Set(expenses.flatMap((e) => e.poles || []))), [expenses])
  // If a `categories` prop is provided, use it as the source of truth. Otherwise fall back
  // to categories found in the data (useful for consumers that don't yet pass the prop).
  const categories = useMemo<ExpenseCategoryOption[]>(() => {
    if (categoriesProp && categoriesProp.length > 0) return categoriesProp
    const seen = new Map<string, string>()
    for (const e of expenses) {
      if (e.categoryId && e.categoryLabel) seen.set(e.categoryId, e.categoryLabel)
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }))
  }, [categoriesProp, expenses])
  const zones = useMemo(() => Array.from(new Set(expenses.map((e) => e.billingZone).filter(Boolean) as string[])), [expenses])

  const now = useMemo(() => new Date(), [])
  const prevQuarter = useMemo(() => previousQuarter(now), [now])
  const currentQuarter = useMemo(() => ({ quarter: quarterOf(now.getMonth()), year: now.getFullYear() }), [now])

  const filtered = useMemo(() => {
    const month = now.getMonth()
    const year = now.getFullYear()
    return expenses.filter((e) => {
      const hay = `${e.name || ''} ${e.supplier || ''} ${e.notes || ''}`.toLowerCase()
      if (query && !hay.includes(query.toLowerCase())) return false
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (poleFilter !== 'all') {
        if (poleFilter === 'global') {
          if ((e.poles || []).length > 0) return false
        } else if (!(e.poles || []).includes(poleFilter)) {
          return false
        }
      }
      if (categoryFilter !== 'all' && (e.categoryId || 'none') !== categoryFilter) return false
      if (zoneFilter !== 'all' && e.billingZone !== zoneFilter) return false

      const d = new Date(e.invoiceDate || e.createdAt)
      if (periodPreset === 'thisMonth' && !(d.getMonth() === month && d.getFullYear() === year)) return false
      if (periodPreset === 'thisQuarter' && !isInQuarter(d, currentQuarter.quarter, currentQuarter.year)) return false
      if (periodPreset === 'prevQuarter' && !isInQuarter(d, prevQuarter.quarter, prevQuarter.year)) return false
      if (periodPreset === 'noCategory' && e.categoryId) return false
      if (periodPreset === 'withoutBill' && e.documentUrl) return false
      if (periodPreset === 'toValidate' && !['processing', 'ready_for_payment'].includes(e.status)) return false
      return true
    })
  }, [expenses, query, statusFilter, poleFilter, categoryFilter, zoneFilter, periodPreset, now, prevQuarter, currentQuarter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      for (const s of sort) {
        const mult = s.dir === 'asc' ? 1 : -1
        const av: any = s.key === 'invoiceDate' ? (a.invoiceDate || a.createdAt) : (a as any)[s.key]
        const bv: any = s.key === 'invoiceDate' ? (b.invoiceDate || b.createdAt) : (b as any)[s.key]
        const cmp = typeof av === 'number' ? av - bv : String(av || '').localeCompare(String(bv || ''), 'fr')
        if (cmp !== 0) return cmp * mult
      }
      return 0
    })
    return arr
  }, [filtered, sort])

  const totals = useMemo(() => {
    const totalInclVat = sorted.reduce((s, e) => s + Number(e.totalInclVat || 0), 0)
    const totalExclVat = sorted.reduce((s, e) => s + Number(e.amountExclVat || 0), 0)
    const grouped = sorted.reduce((acc, e) => {
      const key = e.categoryLabel || e.category || 'Non catégorisé'
      acc[key] = (acc[key] || 0) + Number(e.totalInclVat || 0)
      return acc
    }, {} as Record<string, number>)
    const topCategories = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 3)
    return { totalInclVat, totalExclVat, topCategories }
  }, [sorted])

  const anomalies = useMemo(() => {
    if (!sorted.length) return new Set<string>()
    const values = sorted.map((e) => Number(e.totalInclVat || 0))
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const std = Math.sqrt(values.reduce((a, b) => a + ((b - mean) ** 2), 0) / values.length)
    const threshold = mean + std * 2
    return new Set(sorted.filter((e) => Number(e.totalInclVat || 0) > threshold).map((e) => e.id))
  }, [sorted])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize])

  useEffect(() => { setPage(1) }, [query, statusFilter, poleFilter, categoryFilter, zoneFilter, periodPreset, pageSize])
  useEffect(() => setSelectedIds((ids) => ids.filter((id) => sorted.some((e) => e.id === id))), [sorted])

  const allPageSelected = paginated.length > 0 && paginated.every((e) => selectedIds.includes(e.id))
  const selectedExpenses = sorted.filter((e) => selectedIds.includes(e.id))
  const drawerIndex = sorted.findIndex((e) => e.id === drawerExpenseId)
  const drawerExpense = drawerIndex >= 0 ? sorted[drawerIndex] : null

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
  const totalCount = expenses.length
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
            <h3 className="mt-1 font-serif text-3xl text-stone-900 tracking-tight">Dépenses</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onManageCategories && (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <button
                    type="button"
                    onClick={onManageCategories}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:text-amber-950 transition-colors"
                  >
                    <Tags className="w-3.5 h-3.5" />
                    Gérer les catégories
                  </button>
                </div>
              </div>
            )}
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
              onClick={onCreateExpense}
              className="group inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5B5781] transition-colors"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Nouvelle dépense
            </button>
          </div>
        </div>

        {/* Ledger stats strip */}
        <div className="mt-5 pl-5 grid grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 border border-stone-200 rounded-xl overflow-hidden">
          <Stat label="Lignes" value={String(filteredCount)} hint={isFiltered ? `sur ${totalCount}` : 'au total'} />
          <Stat label="Total TTC" value={fmtMoney(totals.totalInclVat)} accent />
          <Stat label="Total HT" value={fmtMoney(totals.totalExclVat)} muted />
          <Stat
            label="Top catégorie"
            value={totals.topCategories[0] ? totals.topCategories[0][0] : '—'}
            hint={totals.topCategories[0] ? fmtMoney(totals.topCategories[0][1]) : undefined}
          />
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
              placeholder="Rechercher fournisseur, libellé, note…"
              className="w-full pl-11 pr-4 py-3 text-sm bg-transparent outline-none placeholder:text-stone-400 focus:bg-stone-50/60"
            />
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Statut" allLabel="Tous statuts">
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
          </FilterSelect>
          <FilterSelect value={poleFilter} onChange={setPoleFilter} label="Pôle" allLabel="Tous pôles">
            <option value="global">Global (sans pôle)</option>
            {poles.map((p) => <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>)}
          </FilterSelect>
          <FilterSelect value={categoryFilter} onChange={setCategoryFilter} label="Catégorie" allLabel="Toutes catégories">
            <option value="none">Non catégorisé</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </FilterSelect>
          <FilterSelect value={zoneFilter} onChange={setZoneFilter} label="Zone" allLabel="Toutes zones">
            {zones.map((z) => <option key={z} value={z}>{BILLING_ZONE_LABELS[z] ?? z}</option>)}
          </FilterSelect>
        </div>

        {/* Saved-view chips */}
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-stone-100">
          <Filter className="w-3.5 h-3.5 text-stone-400 mx-1.5" />
          {([
            ['all', 'Tout'],
            ['thisMonth', 'Ce mois-ci'],
            ['thisQuarter', `Ce trimestre (${quarterLabel(currentQuarter.quarter, currentQuarter.year)})`],
            ['prevQuarter', `Trimestre précédent (${quarterLabel(prevQuarter.quarter, prevQuarter.year)})`],
            ['toValidate', 'À valider'],
            ['noCategory', 'Sans catégorie'],
            ['withoutBill', 'Sans facture'],
          ] as const).map(([id, label]) => {
            const active = periodPreset === id
            return (
              <button
                key={id}
                onClick={() => setPeriodPreset(id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            )
          })}
          {totals.topCategories.length > 1 && (
            <div className="ml-auto hidden md:flex items-center gap-3 text-[11px] text-stone-500">
              {totals.topCategories.slice(1).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-stone-400" />
                  {k} <span className="font-mono text-stone-700">{fmtMoney(v)}</span>
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
          <BulkSelect onChange={(v) => v && onBulkUpdate?.(selectedIds, { status: v })} placeholder="Changer statut">
            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
          </BulkSelect>
          <BulkSelect onChange={(v) => v && onBulkUpdate?.(selectedIds, { categoryId: v })} placeholder="Changer catégorie">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </BulkSelect>
          <BulkSelect onChange={(v) => v && onBulkUpdate?.(selectedIds, { poles: [v] as any })} placeholder="Changer pôle">
            {poles.map((p) => <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>)}
          </BulkSelect>
          <button
            onClick={() => {
              if (!window.confirm(`Supprimer ${selectedIds.length} dépense${selectedIds.length > 1 ? 's' : ''} ? Cette action est définitive.`)) return
              onBulkDelete ? onBulkDelete(selectedIds) : selectedIds.forEach(onDeleteExpense)
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-500/15 text-red-200 hover:bg-red-500/25 hover:text-white px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-white/60 hover:text-white px-2 py-1"
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
            Chargement des dépenses…
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/40 py-20 text-center">
          <FileText className="w-10 h-10 mx-auto text-stone-300 mb-3" strokeWidth={1.25} />
          <p className="font-serif text-lg text-stone-700">Aucune dépense pour ces filtres</p>
          <p className="text-sm text-stone-500 mt-1">Ajustez vos critères ou créez une nouvelle dépense.</p>
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
                      onChange={() => setSelectedIds((prev) => allPageSelected
                        ? prev.filter((id) => !paginated.some((e) => e.id === id))
                        : Array.from(new Set([...prev, ...paginated.map((e) => e.id)])))}
                    />
                  </th>
                  <SortHeader label="Date" dir={sortDir('invoiceDate')} onClick={() => cycleSort('invoiceDate')} />
                  <SortHeader label="Fournisseur · Libellé" dir={sortDir('supplier')} onClick={() => cycleSort('supplier')} />
                  <SortHeader label="Catégorie" dir={sortDir('category')} onClick={() => cycleSort('category')} />
                  <th className="px-3 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em]">Pôle</th>
                  <SortHeader label="Statut" dir={sortDir('status')} onClick={() => cycleSort('status')} />
                  <SortHeader label="HT" right dir={sortDir('amountExclVat')} onClick={() => cycleSort('amountExclVat')} />
                  <SortHeader label="TTC" right dir={sortDir('totalInclVat')} onClick={() => cycleSort('totalInclVat')} />
                  <th className="px-3 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em] text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginated.map((e) => {
                  const isAnomaly = anomalies.has(e.id)
                  const isSelected = selectedIds.includes(e.id)
                  const isReconciled = Boolean(e.fullyReconciled)
                  const rowPad = density === 'compact' ? 'py-2' : 'py-3.5'
                  const fontSize = density === 'compact' ? 'text-[13px]' : 'text-sm'
                  const rowBg = isSelected
                    ? 'bg-[#5B5781]/[0.04]'
                    : isReconciled
                      ? 'bg-emerald-50/60 hover:bg-emerald-50'
                      : 'hover:bg-stone-50/70'
                  return (
                    <tr
                      key={e.id}
                      className={`group cursor-pointer transition-colors ${rowBg}`}
                      onClick={() => setDrawerExpenseId(e.id)}
                    >
                      <td className="pl-4 pr-2 relative" onClick={(ev) => ev.stopPropagation()}>
                        {/* Status indicator stripe — emerald takes over when fully reconciled */}
                        <span
                          className={`absolute left-0 top-1 bottom-1 w-[3px] rounded-full ${
                            isReconciled ? 'bg-emerald-500' : (STATUS_BAR[e.status] ?? 'bg-stone-200')
                          }`}
                          aria-hidden
                        />
                        <input
                          type="checkbox"
                          className="accent-[#5B5781]"
                          checked={isSelected}
                          onChange={(ev) => setSelectedIds((prev) => ev.target.checked
                            ? [...prev, e.id]
                            : prev.filter((id) => id !== e.id))}
                        />
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize} text-stone-500 whitespace-nowrap font-mono tabular-nums`}>
                        {fmtDate(e.invoiceDate)}
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize}`}>
                        <div className="flex items-center gap-2">
                          {isAnomaly && (
                            <span title="Montant anormalement élevé" className="shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            </span>
                          )}
                          <span className="font-medium text-stone-900 truncate max-w-[260px]">
                            {e.supplier || <span className="text-stone-400 italic">Sans fournisseur</span>}
                          </span>
                        </div>
                        {e.name && e.name !== e.supplier && (
                          <div className="text-[12px] text-stone-600 truncate max-w-[260px] mt-0.5">{e.name}</div>
                        )}
                      </td>
                      <td className={`px-3 ${rowPad}`} onClick={(ev) => ev.stopPropagation()}>
                        <select
                          className="text-xs rounded-md border border-transparent hover:border-stone-300 focus:border-[#5B5781] px-2 py-1 bg-transparent text-stone-700 max-w-[140px] cursor-pointer transition-colors"
                          value={e.categoryId || ''}
                          onChange={(ev) => onInlineUpdate?.(e.id, { categoryId: ev.target.value || null })}
                        >
                          <option value="">— Non catégorisée</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className={`px-3 ${rowPad}`}>
                        {(e.poles || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(e.poles || []).map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
                                style={{ color: POLE_TEXT_COLOR[p] ?? '#57534e', backgroundColor: POLE_BG_COLOR[p] ?? '#f5f5f4' }}
                              >
                                {POLE_LABELS[p] ?? p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide text-stone-400 ring-1 ring-inset ring-stone-200">
                            Global
                          </span>
                        )}
                      </td>
                      <td className={`px-3 ${rowPad}`} onClick={(ev) => ev.stopPropagation()}>
                        <div className="relative inline-flex">
                          <select
                            className={`appearance-none text-xs font-medium rounded-full ring-1 ring-inset bg-white pl-2.5 pr-6 py-0.5 cursor-pointer transition-colors ${STATUS_PILL[e.status] ?? 'text-stone-600 ring-stone-300'}`}
                            value={e.status}
                            onChange={(ev) => onInlineUpdate?.(e.id, { status: ev.target.value })}
                          >
                            {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                          </select>
                          <ChevronsUpDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize} text-right text-stone-500 font-mono tabular-nums whitespace-nowrap`}>
                        {fmtMoney(e.amountExclVat)}
                      </td>
                      <td className={`px-3 ${rowPad} ${fontSize} text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                        isAnomaly ? 'text-red-700' : isReconciled ? 'text-emerald-700' : 'text-stone-900'
                      }`}>
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          {isReconciled && (
                            <span title="Rapprochée intégralement" className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500/15 text-emerald-600">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            </span>
                          )}
                          {fmtMoney(e.totalInclVat)}
                        </span>
                      </td>
                      <td className="px-3 pr-4 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="inline-flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <IconButton title="Modifier" onClick={() => onEditExpense(e)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton title="Supprimer" tone="danger" onClick={() => onDeleteExpense(e.id)}>
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
              Page <span className="font-mono text-stone-900">{page}</span> sur <span className="font-mono">{totalPages}</span>
              {' · '}
              <span className="font-mono">{paginated.length}</span> ligne{paginated.length > 1 ? 's' : ''} affichée{paginated.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs cursor-pointer"
              >
                {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n} / page</option>)}
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

      {drawerExpense && (
        <ExpenseDrawer
          expense={drawerExpense}
          onClose={() => setDrawerExpenseId(null)}
          onPrev={() => drawerIndex > 0 && setDrawerExpenseId(sorted[drawerIndex - 1].id)}
          onNext={() => drawerIndex < sorted.length - 1 && setDrawerExpenseId(sorted[drawerIndex + 1].id)}
          onEdit={() => onEditExpense(drawerExpense)}
          hasPrev={drawerIndex > 0}
          hasNext={drawerIndex < sorted.length - 1}
        />
      )}
    </div>
  )
}

function Stat({ label, value, hint, accent, muted }: { label: string; value: string; hint?: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">{label}</div>
      <div
        className={`mt-1.5 font-mono tabular-nums text-xl ${
          accent ? 'text-[#5B5781] font-semibold' : muted ? 'text-stone-500' : 'text-stone-900 font-semibold'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-stone-400 font-mono">{hint}</div>}
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
}: {
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <select
      onChange={(e) => {
        onChange(e.target.value)
        e.target.value = ''
      }}
      defaultValue=""
      className="rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-white px-2 py-1 text-xs cursor-pointer transition-colors [&>option]:text-stone-900"
    >
      <option value="" disabled>{placeholder}</option>
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
  const palette = tone === 'danger'
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

function SortHeader({ label, dir, onClick, right }: { label: string; dir?: 'asc' | 'desc'; onClick: () => void; right?: boolean }) {
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

function ExpenseDrawer({
  expense,
  onClose,
  onPrev,
  onNext,
  onEdit,
  hasPrev,
  hasNext,
}: {
  expense: ExpenseItem
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

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-[slideInRight_.25s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header band */}
        <div className="relative px-6 pt-6 pb-5 border-b border-stone-100">
          <div className={`absolute left-0 top-6 bottom-5 w-[3px] rounded-full ${STATUS_BAR[expense.status] ?? 'bg-stone-200'}`} aria-hidden />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pl-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-medium">
                Dépense · {fmtDate(expense.invoiceDate)}
              </p>
              <h3 className="mt-1 font-serif text-2xl text-stone-900 leading-tight truncate">
                {expense.supplier || expense.name || 'Sans fournisseur'}
              </h3>
              {expense.name && expense.name !== expense.supplier && (
                <p className="mt-1 text-sm text-stone-500 truncate">{expense.name}</p>
              )}
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
              <div className="font-mono tabular-nums text-3xl font-semibold text-[#5B5781]">{fmtMoney(expense.totalInclVat)}</div>
            </div>
            <div className="h-10 w-px bg-stone-200" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">HT</div>
              <div className="font-mono tabular-nums text-base text-stone-600">{fmtMoney(expense.amountExclVat)}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <DrawerField label="Statut">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${STATUS_PILL[expense.status] ?? 'text-stone-600 ring-stone-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_BAR[expense.status] ?? 'bg-stone-300'}`} />
                {STATUS_LABELS[expense.status] ?? expense.status}
              </span>
            </DrawerField>
            <DrawerField label="Catégorie">
              {expense.categoryLabel || expense.category || <span className="text-stone-400 italic">Non catégorisée</span>}
            </DrawerField>
            <DrawerField label="Type">
              {EXPENSE_TYPE_LABELS[expense.expenseType] ?? expense.expenseType}
            </DrawerField>
            <DrawerField label="Zone facturation">
              {expense.billingZone ? (BILLING_ZONE_LABELS[expense.billingZone] ?? expense.billingZone) : '—'}
            </DrawerField>
            <DrawerField label="Pôles" wide>
              {(expense.poles || []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(expense.poles || []).map((p) => (
                    <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium">
                      {POLE_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              ) : '—'}
            </DrawerField>
            {expense.paymentDate && (
              <DrawerField label="Payée le">{fmtDate(expense.paymentDate)}</DrawerField>
            )}
            {expense.paymentType && (
              <DrawerField label="Mode paiement">{expense.paymentType}</DrawerField>
            )}
          </dl>

          {expense.notes && (
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium mb-2">Notes</div>
              <div className="rounded-lg bg-stone-50 border border-stone-200/60 p-4 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                {stripHtml(expense.notes)}
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
            aria-label="Dépense précédente"
            title="Précédente (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Dépense suivante"
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
