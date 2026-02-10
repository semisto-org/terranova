'use client'

import { useState } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { AppShell } from './AppShell'
import { SearchDialog } from './SearchDialog'
import { NotificationsDrawer } from './NotificationsDrawer'
import { mockUser, mockLabs, mockPoles, navigationConfig } from '@/lib/mock-session'

function derivePoleFromPath(pathname: string): string {
  if (pathname.startsWith('/design')) return 'design-studio'
  if (pathname.startsWith('/academy')) return 'academy'
  if (pathname.startsWith('/nursery')) return 'nursery'
  if (pathname.startsWith('/engagement')) return 'mise-en-oeuvre'
  if (pathname.startsWith('/website')) return 'website'
  return 'lab-management'
}

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const activePoleId = derivePoleFromPath(pathname)
  const navItems = (navigationConfig[activePoleId] || []).map(item => ({
    ...item,
    isActive: pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')),
  }))

  const poleRouteMap: Record<string, string> = {
    'design-studio': '/design',
    'academy': '/academy',
    'nursery': '/nursery',
    'mise-en-oeuvre': '/engagement',
    'lab-management': '/lab',
    'website': '/website',
  }

  const handlePoleChange = (poleId: string) => {
    const route = poleRouteMap[poleId]
    if (route) router.push(route)
  }

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  return (
    <>
      <AppShell
        poles={mockPoles}
        activePoleId={activePoleId}
        labs={mockLabs}
        activeLabId="lab-wallonie"
        user={mockUser}
        navItems={navItems}
        showLabManagement
        showWebsite
        unreadNotificationsCount={3}
        onPoleChange={handlePoleChange}
        onNavigate={handleNavigate}
        onSearch={() => setSearchOpen(true)}
        onNotifications={() => setNotificationsOpen(true)}
      >
        {children}
      </AppShell>

      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={[]}
      />
    </>
  )
}
