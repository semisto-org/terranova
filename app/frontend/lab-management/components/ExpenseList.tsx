import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, FileText, Plus, Trash2, X } from 'lucide-react'

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

const STATUS_LABELS: Record<string, string> = {
  planned: 'Prévue',
  processing: 'Traitement',
  ready_for_payment: 'À payer',
  paid: 'Payée',
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
const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Loyer', utilities: 'Charges', insurance: 'Assurance', office_supplies: 'Fournitures', software: 'Logiciels', hardware: 'Matériel',
  travel: 'Déplacements', marketing: 'Marketing', professional_services: 'Services pro', other: 'Autre',
}

const fmtMoney = (value: number) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')

type SortKey = 'invoiceDate' | 'supplier' | 'status' | 'totalInclVat' | 'amountExclVat' | 'category'

export interface ExpenseListProps {
  expenses: ExpenseItem[]
  loading?: boolean
  onCreateExpense: () => void
  onEditExpense: (expense: ExpenseItem) => void
  onDeleteExpense: (expenseId: string) => void
  onInlineUpdate?: (expenseId: string, changes: Partial<ExpenseItem>) => Promise<void> | void
  onBulkUpdate?: (ids: string[], changes: Partial<ExpenseItem>) => Promise<void> | void
  onBulkDelete?: (ids: string[]) => void
  trainingOptions?: { value: string; label: string }[]
  designProjectOptions?: { value: string; label: string }[]
}

export function ExpenseList({
  expenses,
  loading = false,
  onCreateExpense,
  onEditExpense,
  onDeleteExpense,
  onInlineUpdate,
  onBulkUpdate,
  onBulkDelete,
}: ExpenseListProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [poleFilter, setPoleFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [periodPreset, setPeriodPreset] = useState<'all' | 'thisMonth' | 'noCategory' | 'withoutBill' | 'toValidate'>('all')
  const [density, setDensity] = useState<'compact' | 'comfort'>('comfort')
  const [sort, setSort] = useState<Array<{ key: SortKey; dir: 'asc' | 'desc' }>>([{ key: 'invoiceDate', dir: 'desc' }])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [drawerExpenseId, setDrawerExpenseId] = useState<string | null>(null)

  const statuses = useMemo(() => Array.from(new Set(expenses.map((e) => e.status))), [expenses])
  const poles = useMemo(() => Array.from(new Set(expenses.flatMap((e) => e.poles || []))), [expenses])
  const categories = useMemo(() => Array.from(new Set(expenses.map((e) => e.category).filter(Boolean) as string[])), [expenses])
  const zones = useMemo(() => Array.from(new Set(expenses.map((e) => e.billingZone).filter(Boolean) as string[])), [expenses])

  const filtered = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return expenses.filter((e) => {
      const hay = `${e.name || ''} ${e.supplier || ''} ${e.notes || ''}`.toLowerCase()
      if (query && !hay.includes(query.toLowerCase())) return false
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (poleFilter !== 'all' && !(e.poles || []).includes(poleFilter)) return false
      if (categoryFilter !== 'all' && (e.category || 'none') !== categoryFilter) return false
      if (zoneFilter !== 'all' && e.billingZone !== zoneFilter) return false

      const d = new Date(e.invoiceDate || e.createdAt)
      if (periodPreset === 'thisMonth' && !(d.getMonth() === month && d.getFullYear() === year)) return false
      if (periodPreset === 'noCategory' && e.category) return false
      if (periodPreset === 'withoutBill' && e.documentUrl) return false
      if (periodPreset === 'toValidate' && !['processing', 'ready_for_payment'].includes(e.status)) return false
      return true
    })
  }, [expenses, query, statusFilter, poleFilter, categoryFilter, zoneFilter, periodPreset])

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
      const key = e.category || 'Non catégorisé'
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
      if (!current) return [{ key, dir: 'asc' }, ...prev].slice(0, 2)
      if (current.dir === 'asc') return prev.map((s) => s.key === key ? { ...s, dir: 'desc' } : s)
      return prev.filter((s) => s.key !== key)
    })
  }

  return <div className="space-y-4">
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Dépenses</h3>
        <p className="text-sm text-stone-500">{sorted.length} résultats · TTC {fmtMoney(totals.totalInclVat)} · HT {fmtMoney(totals.totalExclVat)}</p>
      </div>
      <div className="flex gap-2">
        <button className={`px-3 py-1.5 text-sm rounded-lg border ${density === 'compact' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`} onClick={() => setDensity('compact')}>Compact</button>
        <button className={`px-3 py-1.5 text-sm rounded-lg border ${density === 'comfort' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300'}`} onClick={() => setDensity('comfort')}>Confort</button>
        <button type="button" onClick={onCreateExpense} className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white"><Plus className="w-4 h-4" />Ajouter</button>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-6 gap-2">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Recherche texte / fournisseur..." className="xl:col-span-2 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Tous statuts</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}</select>
      <select value={poleFilter} onChange={(e) => setPoleFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Tous pôles</option>{poles.map((p) => <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>)}</select>
      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Toutes catégories</option><option value="none">Non catégorisé</option>{categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}</select>
      <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"><option value="all">Toutes zones</option>{zones.map((z) => <option key={z} value={z}>{BILLING_ZONE_LABELS[z] ?? z}</option>)}</select>
    </div>

    <div className="flex flex-wrap gap-2">
      {[
        ['all', 'Tout'],
        ['thisMonth', 'Ce mois'],
        ['noCategory', 'Non catégorisé'],
        ['withoutBill', 'Sans facture'],
        ['toValidate', 'À valider'],
      ].map(([id, label]) => <button key={id} className={`px-3 py-1.5 rounded-full border text-xs ${periodPreset === id ? 'bg-[#5B5781] text-white border-[#5B5781]' : 'border-stone-300 text-stone-700'}`} onClick={() => setPeriodPreset(id as any)}>{label}</button>)}
      <div className="ml-auto text-xs text-stone-500">Top catégories: {totals.topCategories.map(([k, v]) => `${k} (${fmtMoney(v)})`).join(' · ') || '—'}</div>
    </div>

    {selectedIds.length > 0 && <div className="rounded-lg border border-[#5B5781]/30 bg-[#5B5781]/5 p-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-800">{selectedIds.length} sélectionnée(s)</span>
      <select className="rounded-lg border border-stone-300 px-2 py-1 text-xs" onChange={(e) => e.target.value && onBulkUpdate?.(selectedIds, { status: e.target.value })} defaultValue=""><option value="">Statut de masse</option>{statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}</select>
      <select className="rounded-lg border border-stone-300 px-2 py-1 text-xs" onChange={(e) => e.target.value && onBulkUpdate?.(selectedIds, { category: e.target.value })} defaultValue=""><option value="">Catégorie de masse</option>{categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}</select>
      <select className="rounded-lg border border-stone-300 px-2 py-1 text-xs" onChange={(e) => e.target.value && onBulkUpdate?.(selectedIds, { poles: [e.target.value] as any })} defaultValue=""><option value="">Pôle de masse</option>{poles.map((p) => <option key={p} value={p}>{POLE_LABELS[p] ?? p}</option>)}</select>
      <button className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-300 text-red-700 px-3 py-1.5 text-xs" onClick={() => onBulkDelete ? onBulkDelete(selectedIds) : selectedIds.forEach(onDeleteExpense)}><Trash2 className="w-3.5 h-3.5" />Supprimer lot</button>
    </div>}

    {loading ? <div className="py-16 text-center text-stone-500">Chargement des dépenses...</div> : sorted.length === 0 ? <div className="rounded-xl border border-stone-200 bg-stone-50/50 py-14 text-center"><FileText className="w-12 h-12 mx-auto text-stone-300 mb-2" /><p className="text-stone-600">Aucune dépense pour ce filtre.</p></div> : <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-3 py-2"><input type="checkbox" checked={allPageSelected} onChange={() => setSelectedIds((prev) => allPageSelected ? prev.filter((id) => !paginated.some((e) => e.id === id)) : Array.from(new Set([...prev, ...paginated.map((e) => e.id)])))} /></th>
              <Sortable label="Date" onClick={() => cycleSort('invoiceDate')} />
              <Sortable label="Fournisseur" onClick={() => cycleSort('supplier')} />
              <Sortable label="Catégorie" onClick={() => cycleSort('category')} />
              <Sortable label="Statut" onClick={() => cycleSort('status')} />
              <Sortable label="HT" right onClick={() => cycleSort('amountExclVat')} />
              <Sortable label="TTC" right onClick={() => cycleSort('totalInclVat')} />
              <th className="px-3 py-2 text-xs font-semibold text-stone-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((e) => {
              const isAnomaly = anomalies.has(e.id)
              return <tr key={e.id} className={`border-b border-stone-100 hover:bg-stone-50 cursor-pointer ${isAnomaly ? 'bg-red-50/40' : ''}`} onClick={() => setDrawerExpenseId(e.id)}>
                <td className="px-3 py-2" onClick={(ev) => ev.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(e.id)} onChange={(ev) => setSelectedIds((prev) => ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id))} /></td>
                <td className={`px-3 ${density === 'compact' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'}`}>{fmtDate(e.invoiceDate)}</td>
                <td className={`px-3 ${density === 'compact' ? 'py-1.5 text-xs' : 'py-2.5 text-sm'} font-medium`}>{e.supplier || '—'}</td>
                <td className="px-3 py-2 text-sm" onClick={(ev) => ev.stopPropagation()}>
                  <select className="text-xs rounded border border-stone-300 px-2 py-1 bg-white" value={e.category || ''} onChange={(ev) => onInlineUpdate?.(e.id, { category: ev.target.value || null })}>
                    <option value="">—</option>{categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-sm" onClick={(ev) => ev.stopPropagation()}>
                  <select className="text-xs rounded border border-stone-300 px-2 py-1 bg-white" value={e.status} onChange={(ev) => onInlineUpdate?.(e.id, { status: ev.target.value })}>
                    {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-sm text-right">{fmtMoney(e.amountExclVat)}</td>
                <td className="px-3 py-2 text-sm text-right font-semibold">
                  <span className="inline-flex items-center gap-1">{isAnomaly && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}{fmtMoney(e.totalInclVat)}</span>
                </td>
                <td className="px-3 py-2" onClick={(ev) => ev.stopPropagation()}>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded hover:bg-stone-100 text-stone-600" onClick={() => onEditExpense(e)}><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-red-600" onClick={() => onDeleteExpense(e.id)}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-stone-200 bg-stone-50 text-sm">
        <div>Page {page}/{totalPages}</div>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded border border-stone-300 px-2 py-1 text-xs">
            {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <button className="px-2 py-1 rounded border border-stone-300 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Précédent</button>
          <button className="px-2 py-1 rounded border border-stone-300 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
        </div>
      </div>
    </div>}

    {drawerExpense && <ExpenseDrawer expense={drawerExpense} onClose={() => setDrawerExpenseId(null)} onPrev={() => drawerIndex > 0 && setDrawerExpenseId(sorted[drawerIndex - 1].id)} onNext={() => drawerIndex < sorted.length - 1 && setDrawerExpenseId(sorted[drawerIndex + 1].id)} onEdit={() => onEditExpense(drawerExpense)} hasPrev={drawerIndex > 0} hasNext={drawerIndex < sorted.length - 1} />}
  </div>
}

function Sortable({ label, onClick, right }: { label: string; onClick: () => void; right?: boolean }) {
  return <th className={`px-3 py-2 text-xs font-semibold text-stone-600 uppercase ${right ? 'text-right' : ''}`}><button className="hover:text-stone-900" onClick={onClick}>{label}</button></th>
}

function ExpenseDrawer({ expense, onClose, onPrev, onNext, onEdit, hasPrev, hasNext }: { expense: ExpenseItem; onClose: () => void; onPrev: () => void; onNext: () => void; onEdit: () => void; hasPrev: boolean; hasNext: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose}>
    <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">{expense.name || expense.supplier || 'Dépense'}</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
      <div className="space-y-2 text-sm">
        <p><b>Fournisseur:</b> {expense.supplier || '—'}</p>
        <p><b>Date:</b> {fmtDate(expense.invoiceDate)}</p>
        <p><b>Statut:</b> {STATUS_LABELS[expense.status] ?? expense.status}</p>
        <p><b>Catégorie:</b> {expense.category ? (CATEGORY_LABELS[expense.category] ?? expense.category) : '—'}</p>
        <p><b>Pôles:</b> {(expense.poles || []).map((p) => POLE_LABELS[p] ?? p).join(', ') || '—'}</p>
        <p><b>Type:</b> {EXPENSE_TYPE_LABELS[expense.expenseType] ?? expense.expenseType}</p>
        <p><b>Zone:</b> {expense.billingZone ? (BILLING_ZONE_LABELS[expense.billingZone] ?? expense.billingZone) : '—'}</p>
        <p><b>HT:</b> {fmtMoney(expense.amountExclVat)} · <b>TTC:</b> {fmtMoney(expense.totalInclVat)}</p>
        {expense.notes && <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 whitespace-pre-wrap">{expense.notes}</div>}
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button onClick={onPrev} disabled={!hasPrev} className="px-3 py-2 rounded border border-stone-300 disabled:opacity-50 inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Prec.</button>
        <button onClick={onNext} disabled={!hasNext} className="px-3 py-2 rounded border border-stone-300 disabled:opacity-50 inline-flex items-center gap-1">Suiv.<ChevronRight className="w-4 h-4" /></button>
        <button onClick={onEdit} className="ml-auto px-3 py-2 rounded bg-[#5B5781] text-white inline-flex items-center gap-1"><Edit className="w-4 h-4" />Modifier</button>
      </div>
    </aside>
  </div>
}
