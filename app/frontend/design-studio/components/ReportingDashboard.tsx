import { Fragment, useMemo, useState } from 'react'
import { statusLabels, statusColors } from './shared/StatusIndicator'

// Ordre d'affichage des groupes de statut (statusOrder n'est pas exporté par StatusIndicator).
const STATUS_GROUP_ORDER = ['active', 'pending', 'completed', 'archived']

// Lignes/membres normalisés pour l'affichage. La source est le payload brut de
// DesignReportingService (clés snake_case : kpis, timeseries, projects, members…) —
// l'adaptation snake_case → camelCase se fait dans le composant.
type ReportingRow = {
  projectId: string
  projectName: string
  status: string
  clientName: string
  revenue: number
  costs: number
  rebilledCosts: number
  nonRebilledCosts: number
  margin: number
  marginPct: number
  hours: number
  revenuePerHour: number
  costPerHour: number
}

type ReportingMember = {
  memberId: string
  memberName: string
  hours: number
  revenue: number
  revenuePerHour: number
}

// Payload tel que renvoyé par /api/v1/design_studio/reporting (DesignReportingService).
type ReportingPayload = {
  kpis?: {
    revenues?: number
    expenses?: number
    gross_margin?: number
    gross_margin_pct?: number
    total_hours?: number
    average_hourly_revenue?: number
    average_hourly_cost?: number
  }
  timeseries?: Array<{ period: string; revenues: number; expenses: number; gross_margin: number }>
  projects?: Array<Record<string, unknown>>
  members?: Array<Record<string, unknown>>
  alerts?: Array<{ level: string; kind: string; message: string; projectId?: string }>
  filter_options?: {
    projects?: Array<{ id: string; name: string }>
    clients?: Array<{ id: string; name: string }>
    members?: Array<{ id: string; name: string }>
  }
}

const euro = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 1 })
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0)

// Période ISO (ex. "2026-03-01") → libellé court "mars 26".
const formatPeriod = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('fr-BE', { month: 'short', year: '2-digit' }).format(date)
}

export function ReportingDashboard({
  data,
  filters,
  onFilterChange,
  onExportCsv,
}: {
  data: ReportingPayload
  filters: { period: string; projectId: string; client: string; memberId: string; groupBy: string }
  onFilterChange: (key: string, value: string) => void
  onExportCsv: () => void
}) {
  const [sortKey, setSortKey] = useState<keyof ReportingRow>('margin')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

  const kpis = data?.kpis || {}
  const safeSummary = {
    revenue: num(kpis.revenues),
    costs: num(kpis.expenses),
    marginValue: num(kpis.gross_margin),
    marginPct: num(kpis.gross_margin_pct) * 100,
    totalHours: num(kpis.total_hours),
    revenuePerHour: num(kpis.average_hourly_revenue),
  }
  const safeSeries = asArray<{ period: string; revenues: number; expenses: number; gross_margin: number }>(data?.timeseries).map((point) => ({
    period: formatPeriod(point.period),
    revenue: num(point.revenues),
    costs: num(point.expenses),
    margin: num(point.gross_margin),
  }))
  const safeRows: ReportingRow[] = asArray<Record<string, unknown>>(data?.projects).map((row) => ({
    projectId: String(row.key ?? ''),
    projectName: String(row.label ?? `Projet #${row.key ?? ''}`),
    status: String(row.status ?? ''),
    clientName: String(row.client_name ?? ''),
    revenue: num(row.revenues),
    costs: num(row.expenses),
    rebilledCosts: num(row.rebilled_expenses),
    nonRebilledCosts: num(row.non_rebilled_expenses),
    margin: num(row.gross_margin),
    marginPct: num(row.gross_margin_pct) * 100,
    hours: num(row.hours),
    revenuePerHour: num(row.revenue_per_hour),
    costPerHour: num(row.cost_per_hour),
  }))
  const safeMemberProductivity: ReportingMember[] = asArray<Record<string, unknown>>(data?.members).map((member) => ({
    memberId: String(member.key ?? ''),
    memberName: String(member.label ?? member.key ?? ''),
    hours: num(member.hours),
    revenue: num(member.revenues),
    revenuePerHour: num(member.revenue_per_hour),
  }))
  const safeAlerts = asArray<{ level: string; kind: string; message: string; projectId?: string }>(data?.alerts)
  const safeFilterOptions = {
    projects: asArray<{ id: string; name: string }>(data?.filter_options?.projects),
    clients: asArray<{ id: string; name: string }>(data?.filter_options?.clients),
    members: asArray<{ id: string; name: string }>(data?.filter_options?.members),
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = safeRows.filter((row) => {
      // Masquer les projets sans aucune valeur € (ni recette, ni dépense).
      if (row.revenue === 0 && row.costs === 0) return false
      if (!q) return true
      return row.projectName.toLowerCase().includes(q) || row.clientName.toLowerCase().includes(q)
    })
    return [...filtered].sort((a, b) => {
      const left = a[sortKey]
      const right = b[sortKey]
      if (typeof left === 'string' && typeof right === 'string') {
        return sortDir === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
      }
      return sortDir === 'asc' ? Number(left) - Number(right) : Number(right) - Number(left)
    })
  }, [safeRows, search, sortKey, sortDir])

  // Regroupement par statut (l'ordre interne suit le tri courant). Un groupe « Autre »
  // récupère tout statut inconnu pour ne jamais perdre une ligne.
  const groupedRows = useMemo(() => {
    const byStatus = new Map<string, ReportingRow[]>()
    for (const row of rows) {
      const key = STATUS_GROUP_ORDER.includes(row.status) ? row.status : 'other'
      if (!byStatus.has(key)) byStatus.set(key, [])
      byStatus.get(key)!.push(row)
    }
    const orderedKeys = [...STATUS_GROUP_ORDER.filter((s) => byStatus.has(s)), ...(byStatus.has('other') ? ['other'] : [])]
    return orderedKeys.map((status) => {
      const groupRows = byStatus.get(status)!
      return {
        status,
        label: statusLabels[status as keyof typeof statusLabels] ?? 'Autre',
        rows: groupRows,
        subtotal: {
          revenue: groupRows.reduce((sum, r) => sum + r.revenue, 0),
          costs: groupRows.reduce((sum, r) => sum + r.costs, 0),
          nonRebilledCosts: groupRows.reduce((sum, r) => sum + r.nonRebilledCosts, 0),
          rebilledCosts: groupRows.reduce((sum, r) => sum + r.rebilledCosts, 0),
        },
      }
    })
  }, [rows])

  const toggleSort = (key: keyof ReportingRow) => {
    if (sortKey === key) {
      setSortDir((v) => (v === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const maxSeriesValue = Math.max(
    ...safeSeries.map((s) => Math.max(s.revenue, s.costs, Math.abs(s.margin))),
    1,
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Reporting</h1>
          <p className="text-stone-500">Tableau de bord d'aide à la décision Design Studio</p>
        </div>
        <button onClick={onExportCsv} className="px-3 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-50">Exporter CSV</button>
      </div>

      <section className="bg-white border border-stone-200 rounded-2xl p-4 grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-3">
        <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={filters.period} onChange={(e) => onFilterChange('period', e.target.value)}>
          <option value="30d">30 jours</option><option value="90d">90 jours</option><option value="12m">12 mois</option><option value="all">Tout</option>
        </select>
        <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={filters.projectId} onChange={(e) => onFilterChange('projectId', e.target.value)}>
          <option value="">Tous projets</option>{safeFilterOptions.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={filters.client} onChange={(e) => onFilterChange('client', e.target.value)}>
          <option value="">Tous clients</option>{safeFilterOptions.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={filters.memberId} onChange={(e) => onFilterChange('memberId', e.target.value)}>
          <option value="">Tous membres</option>{safeFilterOptions.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={filters.groupBy} onChange={(e) => onFilterChange('groupBy', e.target.value)}>
          <option value="month">Regroupement mensuel</option><option value="project">Regroupement projet</option><option value="member">Regroupement membre</option>
        </select>
      </section>

      <section className="grid lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 gap-3">
        {[
          ['CA', euro.format(safeSummary.revenue)],
          ['Coûts', euro.format(safeSummary.costs)],
          ['Marge €', euro.format(safeSummary.marginValue)],
          ['Marge %', `${number.format(safeSummary.marginPct)}%`],
          ['Heures', `${number.format(safeSummary.totalHours)} h`],
          ['€/h', euro.format(safeSummary.revenuePerHour)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white border border-stone-200 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
            <p className="text-xl font-semibold text-stone-900 mt-1">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 lg:col-span-2">
          <h3 className="font-medium text-stone-900 mb-3">Évolution CA / coûts / marge</h3>
          <div className="flex items-end gap-2 h-48">
            {safeSeries.map((point) => (
              <div key={point.period} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-40">
                  <div className="flex-1 rounded-t bg-[#AFBD00]/70" style={{ height: `${(point.revenue / maxSeriesValue) * 100}%` }} title={`CA ${euro.format(point.revenue)}`} />
                  <div className="flex-1 rounded-t bg-stone-300" style={{ height: `${(point.costs / maxSeriesValue) * 100}%` }} title={`Coûts ${euro.format(point.costs)}`} />
                  <div className={`flex-1 rounded-t ${point.margin >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ height: `${(Math.abs(point.margin) / maxSeriesValue) * 100}%` }} title={`Marge ${euro.format(point.margin)}`} />
                </div>
                <span className="text-[10px] text-stone-500">{point.period}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <h3 className="font-medium text-stone-900 mb-3">Alertes</h3>
          <div className="space-y-2">
            {safeAlerts.length === 0 ? <p className="text-sm text-stone-500">Aucune alerte critique.</p> : safeAlerts.map((a, idx) => (
              <div key={idx} className={`rounded-lg px-3 py-2 text-sm ${a.level === 'high' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{a.message}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div>
            <h3 className="font-medium text-stone-900">Rentabilité par projet</h3>
            <p className="text-xs text-stone-400">Montants HTVA · total sur la vie du projet (hors filtre de période) · projets sans recette ni dépense masqués</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" placeholder="Rechercher projet/client" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-stone-500 border-b border-stone-200">
              {[
                ['projectName', 'Projet'], ['clientName', 'Client'], ['revenue', 'CA'], ['costs', 'Coûts'], ['nonRebilledCosts', 'Prestations'], ['rebilledCosts', 'Refacturés'], ['marginPct', 'Marge %'], ['revenuePerHour', 'Revenu/h'], ['costPerHour', 'Coût/h'],
              ].map(([key, label]) => <th key={key} className="py-2 pr-3"><button onClick={() => toggleSort(key as keyof ReportingRow)}>{label}</button></th>)}
            </tr></thead>
            <tbody>
              {groupedRows.length === 0 ? (
                <tr><td colSpan={9} className="py-6 text-center text-stone-400">Aucun projet avec recette ou dépense sur la période.</td></tr>
              ) : groupedRows.map((group) => {
                const colors = statusColors[group.status as keyof typeof statusColors] ?? { dot: 'bg-stone-300', bg: 'bg-stone-50', text: 'text-stone-500' }
                return (
                  <Fragment key={group.status}>
                    <tr className={`${colors.bg} border-b border-stone-200`}>
                      <td className={`py-2 pr-3 font-semibold ${colors.text}`} colSpan={2}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`rounded-full ${colors.dot} w-2 h-2`} />
                          {group.label}
                          <span className="font-normal opacity-70">· {group.rows.length}</span>
                        </span>
                      </td>
                      <td className={`py-2 pr-3 font-semibold ${colors.text}`}>{euro.format(group.subtotal.revenue)}</td>
                      <td className={`py-2 pr-3 font-semibold ${colors.text}`}>{euro.format(group.subtotal.costs)}</td>
                      <td className={`py-2 pr-3 font-semibold ${colors.text}`}>{euro.format(group.subtotal.nonRebilledCosts)}</td>
                      <td className={`py-2 pr-3 font-semibold ${colors.text}`}>{euro.format(group.subtotal.rebilledCosts)}</td>
                      <td colSpan={3} />
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.projectId} className="border-b border-stone-100">
                        <td className="py-2 pr-3 pl-4 font-medium text-stone-800">{row.projectName}</td>
                        <td className="py-2 pr-3">{row.clientName}</td>
                        <td className="py-2 pr-3">{euro.format(row.revenue)}</td>
                        <td className="py-2 pr-3">{euro.format(row.costs)}</td>
                        <td className="py-2 pr-3" title="Prestations / coûts non refacturés au client">{euro.format(row.nonRebilledCosts)}</td>
                        <td className="py-2 pr-3" title="Coûts refacturés au client">{euro.format(row.rebilledCosts)}</td>
                        <td className={`py-2 pr-3 ${row.marginPct < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{number.format(row.marginPct)}%</td>
                        <td className="py-2 pr-3">{euro.format(row.revenuePerHour)}</td>
                        <td className="py-2 pr-3">{euro.format(row.costPerHour)}</td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-4">
        <h3 className="font-medium text-stone-900 mb-3">Productivité par membre</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {safeMemberProductivity.map((m) => (
            <div key={m.memberId} className="rounded-xl border border-stone-200 p-3">
              <p className="font-medium text-stone-900">{m.memberName}</p>
              <p className="text-sm text-stone-500">{number.format(m.hours)} h</p>
              <p className="text-sm text-stone-700">{euro.format(m.revenuePerHour)}/h</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
