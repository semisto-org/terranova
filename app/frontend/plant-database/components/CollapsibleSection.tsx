import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  badge?: string | number
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-stone-200 dark:border-stone-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-stone-400 dark:text-stone-500 group-hover:text-[#5B5781] dark:group-hover:text-[#a89ec4] transition-colors">
              {icon}
            </span>
          )}
          <span className="font-medium text-stone-900 dark:text-stone-100">
            {title}
          </span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[2000px] opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
