import type { FilterOption } from '../types'

interface PropertyBadgeProps {
  value: string
  options?: FilterOption[]
  variant?: 'default' | 'accent' | 'subtle'
}

export function PropertyBadge({ value, options, variant = 'default' }: PropertyBadgeProps) {
  const label = options?.find(o => o.id === value)?.label || value

  const variants = {
    default: 'bg-stone-100 text-stone-700',
    accent: 'bg-[#AFBD00]/15 text-[#7a8200]',
    subtle: 'bg-stone-50 text-stone-600'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  )
}
