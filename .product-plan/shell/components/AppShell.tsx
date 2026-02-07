import { useState, useEffect } from 'react'
import { MainNav } from './MainNav'
import { ContextSwitcher } from './ContextSwitcher'
import { Bell, Search, Menu, X } from 'lucide-react'

export interface Pole {
  id: string
  label: string
  color: string
  bgColor: string
  icon?: React.ReactNode
}

export interface Lab {
  id: string
  name: string
}

export interface User {
  name: string
  email: string
  avatarUrl?: string
}

export interface NavItem {
  label: string
  href: string
  isActive?: boolean
}

export interface AppShellProps {
  children: React.ReactNode
  poles: Pole[]
  activePoleId: string
  labs: Lab[]
  activeLabId: string
  user: User
  navItems: NavItem[]
  showLabManagement?: boolean
  showWebsite?: boolean
  unreadNotificationsCount?: number
  onPoleChange?: (poleId: string) => void
  onLabChange?: (labId: string) => void
  onNavigate?: (href: string) => void
  onSearch?: () => void
  onNotifications?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

export function AppShell({
  children,
  poles,
  activePoleId,
  labs,
  activeLabId,
  user,
  navItems,
  showLabManagement = true,
  showWebsite = false,
  unreadNotificationsCount = 0,
  onPoleChange,
  onLabChange,
  onNavigate,
  onSearch,
  onNotifications,
  onSettings,
  onLogout,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when navigating on mobile
  const handleNavigate = (href: string) => {
    setSidebarOpen(false)
    onNavigate?.(href)
  }

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const activePole = poles.find(p => p.id === activePoleId)
  const activeLab = labs.find(l => l.id === activeLabId)
  const poleColor = activePole?.color || '#5B5781'

  // Background colors for header by pole
  const headerBgColors: Record<string, string> = {
    'design-studio': '#e1e6d8',
    'academy': '#eac7b8',
    'nursery': '#fbe6c3',
    'mise-en-oeuvre': '#c9d1d9',
    'lab-management': '#c8bfd2',
    'website': '#FFFFFF',
  }
  const headerBgColor = headerBgColors[activePoleId] || '#FFFFFF'

  // Get active pole label for display
  const activePoleLabel = activePoleId === 'lab-management'
    ? 'Gestion du Lab'
    : activePoleId === 'website'
    ? 'Website'
    : activePole?.label || ''

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200"
        style={{ backgroundColor: headerBgColor }}
      >
        {/* Header content */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-stone-200/50">
        {/* Left: Hamburger + Context Switcher */}
        <div className="flex items-center">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ml-2 mr-1 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-black/5 transition-colors"
            aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <ContextSwitcher
          poles={poles}
          activePoleId={activePoleId}
          activePoleLabel={activePoleLabel}
          labs={labs}
          activeLabId={activeLabId}
          user={user}
          showLabManagement={showLabManagement}
          showWebsite={showWebsite}
          onPoleChange={onPoleChange}
          onLabChange={onLabChange}
          onSettings={onSettings}
          onLogout={onLogout}
        />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNotifications}
            className="relative p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-black/5 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            onClick={onSearch}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-black/5 transition-colors"
            aria-label="Recherche"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        </div>

        {/* Pole color indicator - full width, part of header */}
        <div
          className="h-0.5 transition-colors duration-200"
          style={{ backgroundColor: poleColor }}
        />
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - positioned below header + color bar */}
      <aside
        className={`fixed top-[58px] left-0 bottom-0 w-56 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-transform duration-200 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <MainNav
          items={navItems}
          poleColor={poleColor}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* Main Content - positioned below header + color bar (58px = 56px + 2px) */}
      <main className="pt-[58px] transition-all duration-200 lg:pl-56">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
