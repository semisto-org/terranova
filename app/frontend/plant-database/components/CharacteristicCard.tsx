import type { ReactNode } from 'react'
import type { FilterOption } from '../types'

interface CharacteristicCardProps {
  icon: ReactNode
  label: string
  value: string
  options?: FilterOption[]
  color?: 'default' | 'green' | 'orange' | 'blue' | 'purple'
}

export function CharacteristicCard({
  icon,
  label,
  value,
  options,
  color = 'default'
}: CharacteristicCardProps) {
  const displayValue = options?.find(o => o.id === value)?.label || value

  const colorClasses = {
    default: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
    green: 'bg-[#AFBD00]/10 dark:bg-[#AFBD00]/20 text-[#7a8200] dark:text-[#d4e34d]',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-[#5B5781]/10 dark:bg-[#5B5781]/20 text-[#5B5781] dark:text-[#a89ec4]'
  }

  return (
    <div className="flex flex-col items-center text-center p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-tight">
        {displayValue}
      </p>
    </div>
  )
}
