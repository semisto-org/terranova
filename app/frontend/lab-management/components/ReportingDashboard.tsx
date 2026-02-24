import React, { useMemo } from 'react'

type ReportingPayload = any

type Props = {
  data: ReportingPayload | null
  loading?: boolean
  error?: string | null
  filters: { from: string; to: string; pole: string; category: string; supplier: string }
  onChangeFilters: (next: Partial<Props['filters']>) => void
  onApplyPreset: (preset: '3m' | '6m' | '12m' | 'ytd') => void
}

const euro = (v: number) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0)

function MiniBars({ rows, keyName }: { rows: any[]; keyName: string }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.revenues || 0, r.expenses || 0)))
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row[keyName]}>
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>{row[keyName]}</span>
            <span>{euro(row.netBalance || 0)}</span>
          </div>
          <div className="mt-1 h-2 rounded bg-stone-100 overflow-hidden flex">
            <div className="bg-emerald-500" style={{ width: `${((row.revenues || 0) / max) * 100}%` }} />
            <div className="bg-rose-400" style={{ width: `${((row.expenses || 0) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReportingDashboard({ data, loading, error, filters, onChangeFilters, onApplyPreset }: Props) {
  const hasData = (data?.timeseries || []).length > 0

  const csvContent = useMemo(() => {
    if (!data) return ''
    const lines = ['month,revenues,expenses,net_balance']
    ;(data.timeseries || []).forEach((row: any) => {
      lines.push(`${row.month},${row.revenues},${row.expenses},${row.netBalance}`)
    })
    return lines.join('\n')
  }, [data])

  const downloadCsv = () => {
    if (!csvContent) return
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lab-reporting.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-stone-500 p-4">Chargement du reporting…</p>
  if (error) return <p className="text-red-700 p-4">Erreur reporting: {error}</p>

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input type="date" value={filters.from} onChange={(e) => onChangeFilters({ from: e.target.value })} className="border rounded px-2 py-1.5" />
          <input type="date" value={filters.to} onChange={(e) => onChangeFilters({ to: e.target.value })} className="border rounded px-2 py-1.5" />
          <input placeholder="Pôle (lab/design/academy…)" value={filters.pole} onChange={(e) => onChangeFilters({ pole: e.target.value })} className="border rounded px-2 py-1.5" />
          <input placeholder="Catégorie" value={filters.category} onChange={(e) => onChangeFilters({ category: e.target.value })} className="border rounded px-2 py-1.5" />
          <input placeholder="Fournisseur" value={filters.supplier} onChange={(e) => onChangeFilters({ supplier: e.target.value })} className="border rounded px-2 py-1.5" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="text-xs border rounded px-2 py-1" onClick={() => onApplyPreset('3m')}>3 mois</button>
          <button className="text-xs border rounded px-2 py-1" onClick={() => onApplyPreset('6m')}>6 mois</button>
          <button className="text-xs border rounded px-2 py-1" onClick={() => onApplyPreset('12m')}>12 mois</button>
          <button className="text-xs border rounded px-2 py-1" onClick={() => onApplyPreset('ytd')}>YTD</button>
          <button className="text-xs border rounded px-2 py-1 ml-auto" onClick={downloadCsv}>Exporter CSV</button>
        </div>
      </div>

      {!hasData && <p className="text-stone-500 p-4">Aucune donnée pour cette période.</p>}

      {hasData && (
        <>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-500">Revenus</p><p className="font-semibold">{euro(data.kpis.revenues)}</p></div>
            <div className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-500">Dépenses</p><p className="font-semibold">{euro(data.kpis.expenses)}</p></div>
            <div className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-500">Solde net</p><p className="font-semibold">{euro(data.kpis.netBalance)}</p></div>
            <div className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-500">Burn rate mensuel</p><p className="font-semibold">{euro(data.kpis.monthlyBurnRate)}</p></div>
            <div className="rounded-xl border bg-white p-3"><p className="text-xs text-stone-500">Runway estimé</p><p className="font-semibold">{data.kpis.estimatedRunwayMonths ? `${data.kpis.estimatedRunwayMonths} mois` : 'N/A'}</p></div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold mb-2">Tendance mensuelle</h3>
              <MiniBars rows={data.timeseries} keyName="month" />
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold mb-2">Top postes de coûts</h3>
              <ul className="text-sm space-y-1">
                {(data.topCostItems || []).map((item: any) => (
                  <li key={item.label} className="flex justify-between"><span>{item.label}</span><span>{euro(item.amount)}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold mb-2">Répartition par pôle</h3>
              <MiniBars rows={data.breakdowns.byPole || []} keyName="pole" />
            </div>
            <div className="rounded-xl border bg-white p-4">
              <h3 className="font-semibold mb-2">Répartition par catégorie</h3>
              <MiniBars rows={data.breakdowns.byCategory || []} keyName="category" />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 text-sm">
            <h3 className="font-semibold mb-2">Alertes</h3>
            <ul className="list-disc ml-5 space-y-1 text-stone-700">
              {(data.alerts?.deficitMonths || []).length > 0 && <li>Mois déficitaires: {(data.alerts.deficitMonths || []).join(', ')}</li>}
              {(data.alerts?.spendingSpikes || []).map((s: any) => <li key={s.month}>Hausse forte des dépenses en {s.month} (+{Math.round((s.growthRate || 0) * 100)}%)</li>)}
              {(data.alerts?.criticalCostPosts || []).map((p: any) => <li key={p.label}>Poste critique: {p.label} ({euro(p.amount)})</li>)}
              {(data.alerts?.deficitMonths || []).length === 0 && (data.alerts?.spendingSpikes || []).length === 0 && (data.alerts?.criticalCostPosts || []).length === 0 && <li>Aucune alerte majeure sur la période.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
