import { useEffect, useState } from 'react'

interface MetricCardProps {
  value: number
  label: string
  unit?: string
  icon: React.ReactNode
  color: string
  bgColor: string
  delay?: number
  format?: 'number' | 'decimal' | 'currency'
}

export function MetricCard({ value, label, unit, icon, color, bgColor, delay = 0, format = 'number' }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!isVisible) return
    const duration = 1800
    const steps = 50
    const stepValue = value / steps
    let step = 0

    const interval = setInterval(() => {
      step++
      setDisplayValue(Math.min(step * stepValue, value))
      if (step >= steps) {
        clearInterval(interval)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [value, isVisible])

  const formatValue = (v: number) => {
    if (format === 'currency') return v.toLocaleString('fr-BE', { maximumFractionDigits: 0 })
    if (format === 'decimal') return v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return Math.round(v).toLocaleString('fr-BE')
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-white dark:bg-stone-900
        border border-stone-200/80 dark:border-stone-800
        transform transition-all duration-700 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}
        hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
        group
      `}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: color }} />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: bgColor }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tabular-nums tracking-tight">
            {formatValue(displayValue)}
          </span>
          {unit && (
            <span className="text-sm font-medium text-stone-400 dark:text-stone-500">{unit}</span>
          )}
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{label}</p>
      </div>
    </div>
  )
}
