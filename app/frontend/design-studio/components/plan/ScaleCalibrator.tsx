import { useState, useCallback } from 'react'
import { Ruler, Check, RotateCcw } from 'lucide-react'
import type { ScaleData } from '../../types'

interface ScaleCalibratorProps {
  onSave: (scaleData: ScaleData) => void
  onSkip: () => void
}

export function ScaleCalibrator({ onSave, onSkip }: ScaleCalibratorProps) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([])
  const [realWorldCm, setRealWorldCm] = useState('')

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (points.length >= 2) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setPoints((prev) => [...prev, { x, y }])
    },
    [points.length]
  )

  const handleConfirm = useCallback(() => {
    const cm = Number(realWorldCm)
    if (points.length === 2 && cm > 0) {
      onSave({ point1: points[0], point2: points[1], realWorldCm: cm })
    }
  }, [points, realWorldCm, onSave])

  const handleReset = useCallback(() => {
    setPoints([])
    setRealWorldCm('')
  }, [])

  return (
    <>
      {/* Clickable overlay */}
      <div
        className="absolute inset-0 z-20"
        style={{ cursor: points.length < 2 ? 'crosshair' : 'default' }}
        onClick={handleImageClick}
      />

      {/* SVG overlay for line and points */}
      <svg className="absolute inset-0 z-20 w-full h-full pointer-events-none">
        {points.map((pt, i) => (
          <circle
            key={i}
            cx={`${pt.x * 100}%`}
            cy={`${pt.y * 100}%`}
            r={6}
            fill="#AFBD00"
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
            stroke="#AFBD00"
            strokeWidth={2}
            strokeDasharray="6 3"
          />
        )}
      </svg>

      {/* Instruction banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-xl bg-white/95 backdrop-blur-sm border border-stone-200 shadow-lg px-5 py-3 max-w-lg">
        {points.length === 0 && (
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-[#AFBD00] shrink-0" />
            <div>
              <p className="text-sm font-medium text-stone-900">Calibration de l'échelle</p>
              <p className="text-xs text-stone-500">Cliquez un premier point sur l'image</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSkip() }}
              className="ml-4 text-xs text-stone-400 hover:text-stone-600 underline whitespace-nowrap"
            >
              Passer
            </button>
          </div>
        )}

        {points.length === 1 && (
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-[#AFBD00] shrink-0" />
            <div>
              <p className="text-sm font-medium text-stone-900">Calibration de l'échelle</p>
              <p className="text-xs text-stone-500">Cliquez un second point pour définir la distance</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleReset() }}
              className="ml-4 p-1.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {points.length === 2 && (
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Ruler className="w-5 h-5 text-[#AFBD00] shrink-0" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-stone-900 whitespace-nowrap">Distance réelle :</label>
              <input
                type="number"
                min={1}
                value={realWorldCm}
                onChange={(e) => setRealWorldCm(e.target.value)}
                placeholder="ex: 500"
                className="w-24 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                autoFocus
              />
              <span className="text-sm text-stone-500">cm</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={!realWorldCm || Number(realWorldCm) <= 0}
              className="rounded-lg bg-[#AFBD00] p-1.5 text-stone-900 hover:bg-[#9BAA00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Valider"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
