import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  suffix?: string
  icon: ReactNode
  accent?: 'primary' | 'secondary' | 'neutral'
}

export function StatsCard({
  label,
  value,
  suffix,
  icon,
  accent = 'neutral'
}: StatsCardProps) {
  const accentColors = {
    primary: {
      bg: 'bg-[#e1e6d8] dark:bg-[#AFBD00]/10',
      icon: 'text-[#AFBD00]',
      border: 'border-[#AFBD00]/20'
    },
    secondary: {
      bg: 'bg-[#c8bfd2] dark:bg-[#5B5781]/10',
      icon: 'text-[#5B5781] dark:text-[#8B84B0]',
      border: 'border-[#5B5781]/20'
    },
    neutral: {
      bg: 'bg-stone-100 dark:bg-stone-800',
      icon: 'text-stone-500 dark:text-stone-400',
      border: 'border-stone-200 dark:border-stone-700'
    }
  }

  const colors = accentColors[accent]

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-white dark:bg-stone-900 p-4 sm:p-5`}>
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 opacity-30 ${colors.bg}`} />

      <div className="relative">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg} ${colors.icon} mb-3`}>
          {icon}
        </div>

        {/* Value */}
        <div className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {value}{suffix && <span className="text-lg text-stone-500 dark:text-stone-400 font-normal">{suffix}</span>}
        </div>

        {/* Label */}
        <div className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          {label}
        </div>
      </div>
    </div>
  )
}
