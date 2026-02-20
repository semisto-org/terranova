import type { Scope } from '../types'

interface HillChartProps {
  scopes: Scope[]
  pitchTitle: string
  onUpdatePosition?: (scopeId: string, position: number) => void
  onViewScope?: (scopeId: string) => void
  compact?: boolean
}

const scopeColors = [
  { fill: '#8b5cf6', label: 'text-violet-700' }, // violet-500
  { fill: '#f59e0b', label: 'text-amber-700' }, // amber-500
  { fill: '#10b981', label: 'text-emerald-700' }, // emerald-500
  { fill: '#f43f5e', label: 'text-rose-700' }, // rose-500
  { fill: '#0ea5e9', label: 'text-sky-700' }, // sky-500
]

export function HillChart({
  scopes,
  pitchTitle,
  onUpdatePosition,
  onViewScope,
  compact = false,
}: HillChartProps) {
  const chartHeight = compact ? 60 : 120

  // Basecamp-style hill: defined as a cubic bezier curve
  // The curve goes from bottom-left, rises to peak around 40-45%, then descends to bottom-right
  const hillPath = 'M 0 85 C 15 85, 25 25, 45 20 C 55 18, 55 18, 65 25 C 85 40, 95 85, 100 85'

  // Cubic bezier function: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
  const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const oneMinusT = 1 - t
    return (
      oneMinusT * oneMinusT * oneMinusT * p0 +
      3 * oneMinusT * oneMinusT * t * p1 +
      3 * oneMinusT * t * t * p2 +
      t * t * t * p3
    )
  }

  // Find t parameter for a given x value using binary search
  const findTForX = (targetX: number, x0: number, x1: number, x2: number, x3: number) => {
    let low = 0
    let high = 1
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2
      const x = cubicBezier(mid, x0, x1, x2, x3)
      if (x < targetX) {
        low = mid
      } else {
        high = mid
      }
    }
    return (low + high) / 2
  }

  // Calculate Y position on the hill for a given X percentage
  // The path has 3 bezier segments:
  // Segment 1: (0,85) -> (15,85) -> (25,25) -> (45,20)
  // Segment 2: (45,20) -> (55,18) -> (55,18) -> (65,25)
  // Segment 3: (65,25) -> (85,40) -> (95,85) -> (100,85)
  const getHillYPercent = (xPercent: number) => {
    const x = xPercent

    if (x <= 45) {
      // First bezier segment: 0 to 45
      const t = findTForX(x, 0, 15, 25, 45)
      return cubicBezier(t, 85, 85, 25, 20)
    } else if (x <= 65) {
      // Second bezier segment: 45 to 65
      const t = findTForX(x, 45, 55, 55, 65)
      return cubicBezier(t, 20, 18, 18, 25)
    } else {
      // Third bezier segment: 65 to 100
      const t = findTForX(x, 65, 85, 95, 100)
      return cubicBezier(t, 25, 40, 85, 85)
    }
  }

  return (
    <div className="w-full">
      {!compact && (
        <h4 className="font-medium text-stone-800 mb-3 truncate">
          {pitchTitle}
        </h4>
      )}

      <div className="relative" style={{ height: chartHeight }}>
        {/* Hill Chart SVG - background only */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Hill line - Basecamp-style bezier curve */}
          <path
            d={hillPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            className="text-stone-300"
          />

          {/* Center line (peak) - vertical dotted line at 50% */}
          <line
            x1="50"
            y1="15"
            x2="50"
            y2="92"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2,3"
            vectorEffect="non-scaling-stroke"
            className="text-stone-300"
          />
        </svg>

        {/* Scope dots - positioned with HTML for perfect circles */}
        {scopes.map((scope, index) => {
          const x = scope.hillPosition
          const y = getHillYPercent(x)
          const color = scopeColors[index % scopeColors.length]
          const dotSize = compact ? 10 : 14

          return (
            <button
              key={scope.id}
              onClick={() => onViewScope?.(scope.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: dotSize,
                height: dotSize,
                backgroundColor: color.fill,
                boxShadow: `0 0 0 3px ${color.fill}33`,
              }}
              title={scope.name}
            />
          )
        })}
      </div>

      {/* Labels */}
      {!compact && (
        <div className="flex justify-between text-[10px] text-stone-400 mt-1 px-1">
          <span>Figuring it out</span>
          <span>Making it happen</span>
        </div>
      )}

      {/* Scope legend */}
      <div className={`flex flex-wrap gap-x-4 gap-y-1 ${compact ? 'mt-2' : 'mt-3'}`}>
        {scopes.map((scope, index) => {
          const color = scopeColors[index % scopeColors.length]
          const completedTasks = scope.tasks.filter((t) => t.completed).length
          const totalTasks = scope.tasks.length

          return (
            <button
              key={scope.id}
              onClick={() => onViewScope?.(scope.id)}
              className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color.fill }}
              />
              <span className={`${color.label} font-medium`}>{scope.name}</span>
              {!compact && (
                <span className="text-stone-400">
                  {completedTasks}/{totalTasks}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
