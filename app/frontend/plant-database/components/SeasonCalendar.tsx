import type { FilterOption } from '../types'

interface SeasonCalendarProps {
  floweringMonths: string[]
  fruitingMonths: string[]
  harvestMonths: string[]
  plantingSeasons: string[]
  plantingSeasonsOptions?: FilterOption[]
}

const MONTHS = [
  { id: 'jan', short: 'J', label: 'Janvier' },
  { id: 'feb', short: 'F', label: 'Février' },
  { id: 'mar', short: 'M', label: 'Mars' },
  { id: 'apr', short: 'A', label: 'Avril' },
  { id: 'may', short: 'M', label: 'Mai' },
  { id: 'jun', short: 'J', label: 'Juin' },
  { id: 'jul', short: 'J', label: 'Juillet' },
  { id: 'aug', short: 'A', label: 'Août' },
  { id: 'sep', short: 'S', label: 'Septembre' },
  { id: 'oct', short: 'O', label: 'Octobre' },
  { id: 'nov', short: 'N', label: 'Novembre' },
  { id: 'dec', short: 'D', label: 'Décembre' },
]

const SEASON_MONTHS: Record<string, string[]> = {
  'spring': ['mar', 'apr', 'may'],
  'summer': ['jun', 'jul', 'aug'],
  'autumn': ['sep', 'oct', 'nov'],
  'winter': ['dec', 'jan', 'feb'],
}

// Seasons aligned to calendar columns (jan=0 .. dec=11)
// Each season spans 3 months. Hiver wraps: dec(11), jan(0), feb(1).
// For display, we show seasons in calendar order:
const SEASON_COLUMNS = [
  { key: 'winter-start', label: 'Hiver', seasonKey: 'winter', startCol: 0, spanCols: 2 },
  { key: 'spring', label: 'Printemps', seasonKey: 'spring', startCol: 2, spanCols: 3 },
  { key: 'summer', label: 'Été', seasonKey: 'summer', startCol: 5, spanCols: 3 },
  { key: 'autumn', label: 'Automne', seasonKey: 'autumn', startCol: 8, spanCols: 3 },
  { key: 'winter-end', label: 'Hiver', seasonKey: 'winter', startCol: 11, spanCols: 1 },
]

interface TrackConfig {
  key: string
  label: string
  months: string[]
  color: string
  gradient: string
}

export function SeasonCalendar({
  floweringMonths,
  fruitingMonths,
  harvestMonths,
  plantingSeasons,
}: SeasonCalendarProps) {
  // Build planting months from seasons
  const plantingMonths = plantingSeasons.flatMap(season => SEASON_MONTHS[season] || [])

  // Order: Plantation, Floraison, Fructification, Récolte
  const tracks: TrackConfig[] = [
    {
      key: 'planting',
      label: 'Plantation',
      months: plantingMonths,
      color: '#8b5cf6',
      gradient: 'from-violet-400 to-purple-600',
    },
    {
      key: 'flowering',
      label: 'Floraison',
      months: floweringMonths,
      color: '#ec4899',
      gradient: 'from-pink-400 to-rose-500',
    },
    {
      key: 'fruiting',
      label: 'Fructification',
      months: fruitingMonths,
      color: '#f97316',
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      key: 'harvest',
      label: 'Récolte',
      months: harvestMonths,
      color: '#22c55e',
      gradient: 'from-emerald-400 to-green-600',
    },
  ]

  const activeTracks = tracks.filter(t => t.months.length > 0)

  if (activeTracks.length === 0) {
    return (
      <p className="text-sm text-stone-400 italic py-2">Aucune donnée calendaire disponible</p>
    )
  }

  // Build contiguous ranges, handling wrap-around by producing separate ranges
  // e.g. winter ['dec','jan','feb'] => ranges [{start:0,end:1}, {start:11,end:11}]
  function getMonthRanges(monthIds: string[]): { start: number; end: number }[] {
    const activeSet = new Set(monthIds)
    const indices = MONTHS.map((m, i) => activeSet.has(m.id) ? i : -1).filter(i => i !== -1)
    if (indices.length === 0) return []

    indices.sort((a, b) => a - b)

    const ranges: { start: number; end: number }[] = []
    let rangeStart = indices[0]
    let prev = indices[0]

    for (let i = 1; i < indices.length; i++) {
      if (indices[i] === prev + 1) {
        prev = indices[i]
      } else {
        ranges.push({ start: rangeStart, end: prev })
        rangeStart = indices[i]
        prev = indices[i]
      }
    }
    ranges.push({ start: rangeStart, end: prev })
    return ranges
  }

  return (
    <div className="space-y-1">
      {/* Month headers */}
      <div className="flex items-end mb-2">
        <div className="w-28 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-12 gap-px">
          {MONTHS.map((month) => (
            <div key={month.id} className="text-center">
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                {month.short}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="relative">
        <div className="relative space-y-1.5">
          {activeTracks.map((track) => {
            const ranges = getMonthRanges(track.months)

            return (
              <div key={track.key} className="flex items-center group">
                {/* Label — no icon */}
                <div className="w-28 flex-shrink-0 pr-3 text-right">
                  <span className="text-xs font-medium text-stone-600">
                    {track.label}
                  </span>
                </div>

                {/* Bar grid */}
                <div className="flex-1 relative h-7">
                  {/* Background cells */}
                  <div className="absolute inset-0 grid grid-cols-12 gap-px">
                    {MONTHS.map((month) => (
                      <div
                        key={month.id}
                        className="rounded-[3px]"
                        style={{
                          backgroundColor: track.months.includes(month.id) ? 'transparent' : 'rgb(245 245 244)',
                        }}
                        title={`${month.label} — ${track.label}`}
                      />
                    ))}
                  </div>

                  {/* Colored bars for each contiguous range */}
                  {ranges.map((range, ri) => {
                    const startPct = (range.start / 12) * 100
                    const widthPct = ((range.end - range.start + 1) / 12) * 100

                    return (
                      <div
                        key={ri}
                        className={`absolute top-0 bottom-0 rounded-md bg-gradient-to-r ${track.gradient} shadow-sm transition-all duration-300 group-hover:shadow-md`}
                        style={{
                          left: `calc(${startPct}% + 1px)`,
                          width: `calc(${widthPct}% - 2px)`,
                          opacity: 0.85,
                        }}
                      >
                        <div className="absolute inset-0 rounded-md bg-gradient-to-b from-white/25 to-transparent" style={{ height: '50%' }} />

                        {/* Label inside bars that span 3+ months */}
                        {(range.end - range.start + 1) >= 3 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm tracking-wide uppercase">
                              {track.label}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Season labels — aligned to actual month columns */}
      <div className="flex items-center mt-3 pt-2 border-t border-stone-100">
        <div className="w-28 flex-shrink-0" />
        <div className="flex-1 relative" style={{ height: '16px' }}>
          <div className="absolute inset-0 grid grid-cols-12">
            {SEASON_COLUMNS.map((sc) => {
              const isPlanting = plantingSeasons.includes(sc.seasonKey)
              return (
                <div
                  key={sc.key}
                  className="flex items-center justify-center"
                  style={{
                    gridColumn: `${sc.startCol + 1} / span ${sc.spanCols}`,
                  }}
                >
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${
                    isPlanting ? 'text-violet-600' : 'text-stone-300'
                  }`}>
                    {isPlanting && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block flex-shrink-0" />
                    )}
                    {sc.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-2 border-t border-stone-100">
        {activeTracks.map((track) => (
          <div key={track.key} className="flex items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-sm bg-gradient-to-r ${track.gradient}`}
              style={{ opacity: 0.85 }}
            />
            <span className="text-[11px] text-stone-500">{track.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
