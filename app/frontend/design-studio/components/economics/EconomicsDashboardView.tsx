import { TrendingUp, TrendingDown, DollarSign, Landmark, ArrowUpDown, Ruler, Timer } from 'lucide-react'
import type { EconomicsDashboard } from './types'
import { euro, euroDecimal, numberFmt, INPUT_CATEGORY_LABELS, OUTPUT_CATEGORY_LABELS, INPUT_CATEGORY_COLORS, OUTPUT_CATEGORY_COLORS } from './types'
import type { InputCategory, OutputCategory } from './types'

interface EconomicsDashboardViewProps {
  dashboard: EconomicsDashboard | null
}

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent ? `${accent}18` : '#f5f5f4' }}
        >
          <div style={{ color: accent || '#78716c' }}>{icon}</div>
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-stone-900 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BreakdownBar({ entries, colors }: { entries: [string, number][]; colors: Record<string, string> }) {
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  if (total === 0) return <div className="h-3 rounded-full bg-stone-100" />

  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px">
      {entries.map(([key, val]) => {
        const pct = (val / total) * 100
        if (pct < 0.5) return null
        return (
          <div
            key={key}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: colors[key] || '#94a3b8' }}
            title={`${key}: ${euro.format(val / 100)}`}
          />
        )
      })}
    </div>
  )
}

function BreakdownLegend({ entries, labels, colors }: { entries: [string, number][]; labels: Record<string, string>; colors: Record<string, string> }) {
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  return (
    <div className="space-y-2 mt-3">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[key] || '#94a3b8' }} />
            <span className="text-stone-700">{labels[key] || key}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-500 text-xs">{total > 0 ? `${numberFmt.format((val / total) * 100)}%` : '—'}</span>
            <span className="font-medium text-stone-800 tabular-nums">{euro.format(val / 100)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function EconomicsDashboardView({ dashboard }: EconomicsDashboardViewProps) {
  if (!dashboard) return null

  const { totals, metrics, breakdown } = dashboard
  const balance = totals.balance_cents
  const balancePositive = balance >= 0

  const inputEntries = Object.entries(breakdown.inputs_by_category_cents) as [string, number][]
  const outputEntries = Object.entries(breakdown.outputs_by_category_cents) as [string, number][]

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total coûts"
          value={euro.format(totals.inputs_cents / 100)}
          icon={<TrendingDown className="w-4 h-4" />}
          accent="#ef4444"
        />
        <KpiCard
          label="Total revenus"
          value={euro.format(totals.outputs_cents / 100)}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="#22c55e"
        />
        <KpiCard
          label="Balance"
          value={euro.format(balance / 100)}
          icon={<ArrowUpDown className="w-4 h-4" />}
          accent={balancePositive ? '#22c55e' : '#ef4444'}
        />
        <KpiCard
          label="Productivité"
          value={metrics.productivity_eur_per_ha != null ? `${euroDecimal.format(metrics.productivity_eur_per_ha)}/ha` : '—'}
          sub={metrics.area_m2 != null ? `Surface : ${numberFmt.format(metrics.area_m2)} m²` : 'Aucune surface définie'}
          icon={<Landmark className="w-4 h-4" />}
          accent="#AFBD00"
        />
        <KpiCard
          label="Coût au m²"
          value={metrics.cost_eur_per_m2 != null ? `${euroDecimal.format(metrics.cost_eur_per_m2)}/m²` : '—'}
          icon={<Ruler className="w-4 h-4" />}
          accent="#6366f1"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Répartition des coûts</h3>
          <BreakdownBar entries={inputEntries} colors={INPUT_CATEGORY_COLORS as Record<string, string>} />
          <BreakdownLegend entries={inputEntries} labels={INPUT_CATEGORY_LABELS as Record<string, string>} colors={INPUT_CATEGORY_COLORS as Record<string, string>} />
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Répartition des revenus</h3>
          <BreakdownBar entries={outputEntries} colors={OUTPUT_CATEGORY_COLORS as Record<string, string>} />
          <BreakdownLegend entries={outputEntries} labels={OUTPUT_CATEGORY_LABELS as Record<string, string>} colors={OUTPUT_CATEGORY_COLORS as Record<string, string>} />
        </div>
      </div>
    </div>
  )
}
