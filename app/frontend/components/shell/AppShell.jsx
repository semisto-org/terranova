import React, { useState, useEffect } from 'react'
import { usePage, router } from '@inertiajs/react'
import { Activity, ListTodo, X } from 'lucide-react'
import { ShellProvider } from './ShellContext'
import ContextSwitcher from './ContextSwitcher'
import MainNav from './MainNav'
import GlobalSearch from './GlobalSearch'
// import { NovaChat } from '../nova-chat'
import { TimesheetForm } from '../../lab-management/components'
import { MyTasksDashboard } from '@/components/tasks'
import { apiRequest } from '@/lib/api'
import GlobalSearchPalette from './GlobalSearchPalette'

function MyTasksDrawer({ open, onClose }) {
  if (!open) return null
  // Navigue vers le projet lui-même (page projets unifiée), pour TOUS les types.
  // Auparavant lab/guilde renvoyaient vers /lab (le tableau de bord) — bug
  // rapporté par Michael : « ça n'envoie pas vers le projet ».
  const navigate = (projectType, projectId) => {
    if (!projectType || !projectId) return
    onClose()
    router.visit(`/projects/${projectType}/${projectId}`)
  }
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-50 border-l border-stone-200 shadow-2xl flex flex-col safe-top safe-bottom safe-right">
        <div className="h-13 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 text-stone-800 font-semibold text-sm">
            <ListTodo className="w-4 h-4 text-[#5B5781]" />
            Mes tâches
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <MyTasksDashboard onNavigateToProject={navigate} />
        </div>
      </aside>
    </>
  )
}

function ShellLayout({ children }) {
  const { auth } = usePage().props
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false)
  const [timesheetBusy, setTimesheetBusy] = useState(false)
  const [myTasksOpen, setMyTasksOpen] = useState(false)

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-stone-50" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-stone-200 flex flex-col transition-transform lg:translate-x-0 safe-top safe-bottom safe-left ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-stone-200 px-2 py-2">
          <ContextSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto">
          <MainNav />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        {/* Header */}
        <header className="h-13 border-b border-stone-200 bg-white flex items-center px-4 gap-3 shrink-0 sticky top-0 z-10 safe-top safe-right">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <GlobalSearchPalette />

          {/* Mes tâches (drawer) */}
          <button
            onClick={() => setMyTasksOpen(true)}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            aria-label="Mes tâches"
          >
            <ListTodo className="w-5 h-5" />
          </button>

          {/* Timesheet quick-add */}
          <button
            onClick={() => setTimesheetModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            aria-label="Ajouter une prestation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <button
            onClick={() => router.visit('/activity')}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
            aria-label="Activité"
            title="Activité"
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* Feedback (Tally) */}
          <button
            data-tally-open="LZWR7O"
            data-tally-hide-title="1"
            data-tally-emoji-text="👋"
            data-tally-emoji-animation="wave"
            data-tally-auto-close="5000"
            data-email={auth?.member?.email ?? ''}
            data-ref={typeof window !== 'undefined' ? window.location.href : ''}
            className="p-1.5 rounded-lg hover:bg-[#5B5781]/10 text-stone-500 hover:text-[#5B5781] transition-colors"
            aria-label="Donner un feedback"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>

        </header>

        {/* Content */}
        <main className="flex-1 safe-bottom safe-right">
          {children}
        </main>
      </div>

      {/* Mes tâches — drawer latéral droit */}
      <MyTasksDrawer open={myTasksOpen} onClose={() => setMyTasksOpen(false)} />

      {/* Global search modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Timesheet quick-add modal */}
      {timesheetModalOpen && (
        <TimesheetForm
          onSubmit={async (values) => {
            setTimesheetBusy(true)
            try {
              const member = auth.member
              await apiRequest('/api/v1/lab/timesheets', {
                method: 'POST',
                body: JSON.stringify({
                  ...values,
                  member_id: member.id,
                  member_name: `${member.firstName} ${member.lastName}`,
                }),
              })
              return true
            } catch (err) {
              console.error('Failed to create timesheet:', err)
              alert('Erreur lors de la création de la prestation')
              return false
            } finally {
              setTimesheetBusy(false)
            }
          }}
          onCancel={() => setTimesheetModalOpen(false)}
          busy={timesheetBusy}
        />
      )}
    </div>
  )
}

export default function AppShell({ children }) {
  return (
    <ShellProvider>
      <ShellLayout>{children}</ShellLayout>
      {/* NovaChat temporairement désactivé — feature pas prête */}
      {/* <NovaChat /> */}
    </ShellProvider>
  )
}
