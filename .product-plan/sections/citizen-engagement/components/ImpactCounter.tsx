import { useEffect, useState } from 'react'

interface ImpactCounterProps {
  value: number
  label: string
  unit?: string
  icon: React.ReactNode
  color: 'green' | 'lime' | 'emerald' | 'teal' | 'amber'
  delay?: number
}

export function ImpactCounter({ value, label, unit, icon, color, delay = 0 }: ImpactCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const stepValue = value / steps
    let current = 0
    let step = 0

    const interval = setInterval(() => {
      step++
      current = Math.min(Math.round(stepValue * step), value)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(interval)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [value, isVisible])

  const colorClasses = {
    green: 'from-green-400 to-green-600 shadow-green-500/30',
    lime: 'from-lime-400 to-lime-600 shadow-lime-500/30',
    emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/30',
    teal: 'from-teal-400 to-teal-600 shadow-teal-500/30',
    amber: 'from-amber-400 to-amber-600 shadow-amber-500/30',
  }

  const iconBgClasses = {
    green: 'bg-green-500/20 text-green-600 dark:text-green-400',
    lime: 'bg-lime-500/20 text-lime-600 dark:text-lime-400',
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    teal: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    amber: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl bg-white dark:bg-stone-900 p-5
        border border-stone-200 dark:border-stone-700
        transform transition-all duration-700 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        hover:scale-[1.02] hover:shadow-lg
        group
      `}
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />

      {/* Floating particles effect on hover */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${colorClasses[color]} animate-float-1`} style={{ top: '20%', left: '10%' }} />
        <div className={`absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorClasses[color]} animate-float-2`} style={{ top: '60%', left: '80%' }} />
        <div className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${colorClasses[color]} animate-float-3`} style={{ top: '40%', left: '60%' }} />
      </div>

      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconBgClasses[color]} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-stone-900 dark:text-white tabular-nums tracking-tight">
              {displayValue.toLocaleString('fr-BE')}
            </span>
            {unit && (
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                {unit}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5 truncate">
            {label}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.8; }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-25px) scale(1.3); opacity: 0.9; }
        }
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 2.5s ease-in-out infinite 0.5s; }
        .animate-float-3 { animation: float-3 2s ease-in-out infinite 1s; }
      `}</style>
    </div>
  )
}
