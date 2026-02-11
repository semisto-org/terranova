'use client'

import type { Scope } from '@terranova/types'

interface HillChartProps {
  scopes: Scope[]
  onUpdatePosition?: (scopeId: string, position: number) => void
}

export function HillChart({ scopes, onUpdatePosition }: HillChartProps) {
  const width = 600
  const height = 200
  const padding = 40

  // Hill curve function (parabola)
  const hillY = (x: number) => {
    const normalizedX = (x / 100) * 2 - 1 // -1 to 1
    return height - padding - (1 - normalizedX * normalizedX) * (height - 2 * padding)
  }

  // Generate hill path
  const hillPath = Array.from({ length: 100 }, (_, i) => {
    const x = (i / 100) * (width - 2 * padding) + padding
    const position = (i / 100) * 100
    const y = hillY(position)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxWidth: '600px' }}
      >
        {/* Background grid */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <line
          x1={width / 2}
          y1={padding}
          x2={width / 2}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Hill curve */}
        <path d={hillPath} stroke="#9ca3af" strokeWidth="2" fill="none" />

        {/* Labels */}
        <text
          x={padding + (width - 2 * padding) * 0.25}
          y={height - padding + 20}
          textAnchor="middle"
          className="fill-gray-500 text-xs"
        >
          Figuring Out
        </text>
        <text
          x={padding + (width - 2 * padding) * 0.75}
          y={height - padding + 20}
          textAnchor="middle"
          className="fill-gray-500 text-xs"
        >
          Making It Happen
        </text>

        {/* Scope dots */}
        {scopes.map((scope, idx) => {
          const x =
            padding + ((scope.hillPosition / 100) * (width - 2 * padding))
          const y = hillY(scope.hillPosition)
          const color = [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
          ][idx % 5]

          return (
            <g key={scope.id}>
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={color}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: onUpdatePosition ? 'pointer' : 'default' }}
                onClick={
                  onUpdatePosition
                    ? (e) => {
                        const svg = e.currentTarget.ownerSVGElement
                        if (!svg) return
                        const rect = svg.getBoundingClientRect()
                        const clickX = e.clientX - rect.left
                        const position =
                          ((clickX - padding) / (width - 2 * padding)) * 100
                        onUpdatePosition(
                          scope.id,
                          Math.max(0, Math.min(100, position))
                        )
                      }
                    : undefined
                }
              />
              <title>{scope.name}</title>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 space-y-1">
        {scopes.map((scope, idx) => {
          const color = [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
          ][idx % 5]
          const completedTasks = scope.tasks.filter((t) => t.completed).length
          const totalTasks = scope.tasks.length

          return (
            <div key={scope.id} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium text-gray-700">{scope.name}</span>
              <span className="text-gray-500">
                ({completedTasks}/{totalTasks} tasks)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
