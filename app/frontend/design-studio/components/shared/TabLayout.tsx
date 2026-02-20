import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
}

interface TabLayoutProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
  className?: string
}

export function TabLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
  className = '',
}: TabLayoutProps) {
  return (
    <div className={className}>
      <nav
        className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide border-b border-stone-200 dark:border-stone-700 mb-6"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-shrink-0 inline-flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-medium
                transition-all duration-200 ease-out
                ${
                  isActive
                    ? 'bg-[#AFBD00] text-stone-900 shadow-sm border border-b-0 border-stone-200 dark:border-stone-700 -mb-px'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
                }
              `}
            >
              {tab.icon && (
                <span className="flex-shrink-0 w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </nav>
      <div
        role="tabpanel"
        className="animate-in fade-in duration-200"
        key={activeTab}
      >
        {children}
      </div>
    </div>
  )
}
