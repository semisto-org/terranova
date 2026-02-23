import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import type { Timesheet } from '../../types'

const MONTH_NAMES = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
]

interface ActivityChartProps {
  timesheets: Timesheet[]
}

export function ActivityChart({ timesheets }: ActivityChartProps) {
  const { months, byMonth, maxHours } = useMemo(() => {
    const byMonth = new Map<string, number>()

    for (const t of timesheets) {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const hours = Number(t.hours || 0)
      if (hours <= 0) continue

      byMonth.set(key, (byMonth.get(key) ?? 0) + hours)
    }

    const sortedMonths = [...byMonth.keys()].sort()
    const max = Math.max(...byMonth.values(), 1)

    return {
      months: sortedMonths,
      byMonth,
      maxHours: max,
    }
  }, [timesheets])

  if (months.length === 0) return null

  const chartHeight = 140

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden bg-gradient-to-br from-white via-[#e1e6d8]/15 to-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#AFBD00]/15">
            <BarChart3 className="w-4.5 h-4.5 text-[#AFBD00]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Activité du projet
            </h3>
            <p className="text-xs text-stone-500">
              Heures par mois — repérer les périodes actives
            </p>
          </div>
        </div>

        <div
          className="grid gap-x-3 gap-y-1"
          style={{
            gridTemplateColumns: `auto repeat(${months.length}, minmax(40px, 1fr))`,
          }}
        >
          {/* Y-axis */}
          <div
            className="flex flex-col justify-between text-xs font-medium text-stone-400 tabular-nums"
            style={{ gridColumn: 1, gridRow: 1, height: chartHeight }}
          >
            <span>{maxHours}h</span>
            <span>{Math.round(maxHours / 2)}h</span>
            <span>0h</span>
          </div>

          {/* Bars - one per month column */}
          {months.map((key, monthIdx) => {
            const total = byMonth.get(key) ?? 0
            const [year, month] = key.split('-').map(Number)
            const monthLabel = MONTH_NAMES[month - 1]
            const barHeightPx =
              maxHours > 0
                ? Math.max((total / maxHours) * chartHeight, 4)
                : 0

            return (
              <div
                key={key}
                className="flex flex-col items-center justify-end animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  gridColumn: monthIdx + 2,
                  gridRow: 1,
                  height: chartHeight,
                  animationDelay: `${monthIdx * 40}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div
                  className="w-full max-w-[36px] mx-auto rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height: barHeightPx,
                    backgroundColor: '#AFBD00',
                    boxShadow: '0 -1px 2px rgba(175, 189, 0, 0.25)',
                  }}
                  title={`${monthLabel} ${year}: ${total}h`}
                />
              </div>
            )
          })}

          {/* Month labels - row 2, same columns */}
          {months.map((key, monthIdx) => {
            const [year, month] = key.split('-').map(Number)
            const monthLabel = MONTH_NAMES[month - 1]
            return (
              <div
                key={`label-${key}`}
                className="flex flex-col items-center justify-start pt-1 text-center"
                style={{ gridColumn: monthIdx + 2, gridRow: 2 }}
              >
                <span className="text-[10px] font-medium text-stone-600 leading-tight">
                  {monthLabel}
                </span>
                <span className="text-[9px] text-stone-400">{year}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 text-center">
          <span className="text-xs text-stone-500">
            Total : {[...byMonth.values()].reduce((a, b) => a + b, 0)}h sur{' '}
            {months.length} mois
          </span>
        </div>
      </div>
    </div>
  )
}
