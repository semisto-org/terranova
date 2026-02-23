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
        className="flex overflow-x-auto scrollbar-hide -mx-1 px-1 mb-6"
        role="tablist"
        style={{ scrollPaddingInline: '1rem' }}
      >
        <div className="flex min-w-0 gap-0.5 border-b border-stone-200/80">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    relative flex-shrink-0 inline-flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium
                    tracking-tight transition-all duration-200 ease-out
                    before:absolute before:inset-x-2 before:bottom-0 before:h-0.5 before:rounded-full before:content-[''] before:transition-all before:duration-200
                    rounded-t-lg
                    ${
                      isActive
                        ? 'text-stone-900 before:bg-[#AFBD00] before:opacity-100'
                        : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50/80 before:opacity-0 hover:before:bg-stone-300 hover:before:opacity-30'
                    }
                  `}
                >
                  {tab.icon && (
                    <span
                      className={`flex-shrink-0 w-4 h-4 [&>svg]:w-4 [&>svg]:h-4 transition-opacity duration-200 ${
                        isActive ? 'opacity-100 text-[#6B7A00]' : 'opacity-60'
                      }`}
                    >
                      {tab.icon}
                    </span>
                  )}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              )
            })}
        </div>
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
