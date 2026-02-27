import { useState, useCallback } from 'react'
import type { ScaleData } from '../../types'

interface MeasureToolProps {
  scaleData: ScaleData
  containerWidth: number
  containerHeight: number
}

function computePixelsPerCm(scaleData: ScaleData, containerWidth: number, containerHeight: number): number {
  const dx = (scaleData.point2.x - scaleData.point1.x) * containerWidth
  const dy = (scaleData.point2.y - scaleData.point1.y) * containerHeight
  const pixelDistance = Math.hypot(dx, dy)
  return pixelDistance / scaleData.realWorldCm
}

export function MeasureTool({ scaleData, containerWidth, containerHeight }: MeasureToolProps) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setPoints((prev) => (prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]))
    },
    []
  )

  const distance = (() => {
    if (points.length < 2) return null
    const pxPerCm = computePixelsPerCm(scaleData, containerWidth, containerHeight)
    if (pxPerCm <= 0) return null
    const dx = (points[1].x - points[0].x) * containerWidth
    const dy = (points[1].y - points[0].y) * containerHeight
    const pixelDist = Math.hypot(dx, dy)
    return pixelDist / pxPerCm
  })()

  const midpoint = points.length === 2
    ? {
        x: ((points[0].x + points[1].x) / 2) * 100,
        y: ((points[0].y + points[1].y) / 2) * 100,
      }
    : null

  return (
    <>
      {/* Clickable overlay */}
      <div
        className="absolute inset-0 z-20"
        style={{ cursor: 'crosshair' }}
        onClick={handleClick}
      />

      {/* SVG overlay */}
      <svg className="absolute inset-0 z-20 w-full h-full pointer-events-none">
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={`${pt.x * 100}%`}
            cy={`${pt.y * 100}%`}
            r={5}
            fill="#E76F51"
            stroke="white"
            strokeWidth={2}
          />
        ))}
        {points.length === 2 && (
          <line
            x1={`${points[0].x * 100}%`}
            y1={`${points[0].y * 100}%`}
            x2={`${points[1].x * 100}%`}
            y2={`${points[1].y * 100}%`}
            stroke="#E76F51"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}
      </svg>

      {/* Distance label */}
      {distance !== null && midpoint && (
        <div
          className="absolute z-25 pointer-events-none"
          style={{ left: `${midpoint.x}%`, top: `${midpoint.y}%`, transform: 'translate(-50%, -150%)' }}
        >
          <span className="inline-block rounded-lg bg-white/95 backdrop-blur-sm border border-stone-200 shadow-md px-2.5 py-1 text-xs font-semibold text-stone-900">
            {distance >= 100
              ? `${(distance / 100).toFixed(2)} m`
              : `${Math.round(distance)} cm`}
          </span>
        </div>
      )}

      {/* Instruction */}
      {points.length === 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-white/95 backdrop-blur-sm border border-stone-200 shadow-lg px-4 py-2">
          <p className="text-xs text-stone-600">Cliquez deux points pour mesurer la distance</p>
        </div>
      )}
    </>
  )
}

export { computePixelsPerCm }
