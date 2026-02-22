import React, { useState } from 'react'
import { ShellProvider } from './ShellContext'
import ContextSwitcher from './ContextSwitcher'
import MainNav from './MainNav'
import { NovaChat } from '../nova-chat'
import { TimesheetForm } from '../../lab-management/components'
import { apiRequest } from '@/lib/api'

function ShellLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timesheetModalOpen, setTimesheetModalOpen] = useState(false)
  const [timesheetBusy, setTimesheetBusy] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-stone-200 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-13 border-b border-stone-200 bg-white flex items-center px-4 gap-3 shrink-0">
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

          {/* Search placeholder */}
          <button className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-400 hover:border-stone-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Rechercher...</span>
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

          {/* Feedback (Tally) */}
          <button
            data-tally-open="LZWR7O"
            data-tally-hide-title="1"
            data-tally-emoji-text="👋"
            data-tally-emoji-animation="wave"
            data-tally-auto-close="5000"
            className="p-1.5 rounded-lg hover:bg-[#5B5781]/10 text-stone-500 hover:text-[#5B5781] transition-colors"
            aria-label="Donner un feedback"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>

          {/* Notifications placeholder */}
          <button className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Timesheet quick-add modal */}
      {timesheetModalOpen && (
        <TimesheetForm
          onSubmit={async (values) => {
            setTimesheetBusy(true)
            try {
              await apiRequest('/api/v1/lab/timesheets', {
                method: 'POST',
                body: JSON.stringify({ timesheet: values }),
              })
              setTimesheetModalOpen(false)
            } catch (err) {
              console.error('Failed to create timesheet:', err)
              alert('Erreur lors de la création de la prestation')
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
      <NovaChat />
    </ShellProvider>
  )
}
