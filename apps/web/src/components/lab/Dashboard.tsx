'use client'

import type {
  Member,
  Cycle,
  Pitch,
  Bet,
  Scope,
  Event,
  Wallet,
  SemosTransaction,
} from '@terranova/types'
import { HillChart } from './HillChart'
import { EventCard } from './EventCard'
import { SemosWalletCard } from './SemosWalletCard'
import { CycleProgress } from './CycleProgress'

interface DashboardProps {
  members: Member[]
  cycles: Cycle[]
  pitches: Pitch[]
  bets: Bet[]
  scopes: Scope[]
  events: Event[]
  wallets: Wallet[]
  transactions: SemosTransaction[]
  currentMemberId: string
}

export function Dashboard({
  members,
  cycles,
  pitches,
  bets,
  scopes,
  events,
  wallets,
  transactions,
  currentMemberId,
}: DashboardProps) {
  const currentMember = members.find((m) => m.id === currentMemberId)
  const currentWallet = wallets.find((w) => w.memberId === currentMemberId)
  const currentCycle = cycles.find((c) => c.status === 'active' || c.status === 'cooldown')

  // Get active pitches (building status)
  const activePitches = pitches.filter((p) => p.status === 'building')

  // Get upcoming events (next 7 days)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingEvents = events.filter((e) => {
    const eventDate = new Date(e.startDate)
    return eventDate >= now && eventDate <= nextWeek
  })

  // Get recent transactions for current user
  const recentTransactions = currentWallet
    ? transactions
        .filter(
          (t) =>
            t.fromWalletId === currentWallet.id ||
            t.toWalletId === currentWallet.id
        )
        .slice(0, 5)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {currentMember?.firstName}!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Cycle */}
          {currentCycle && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Cycle
              </h2>
              <CycleProgress cycle={currentCycle} />
            </div>
          )}

          {/* Active Pitches with Hill Chart */}
          {activePitches.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Active Projects
              </h2>
              {activePitches.map((pitch) => {
                const pitchScopes = scopes.filter((s) => s.pitchId === pitch.id)
                return (
                  <div key={pitch.id} className="mb-6 last:mb-0">
                    <h3 className="mb-2 font-medium text-gray-900">
                      {pitch.title}
                    </h3>
                    <HillChart scopes={pitchScopes} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {activePitches.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">
                No active projects at the moment
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Semos Wallet */}
          {currentWallet && (
            <SemosWalletCard
              wallet={currentWallet}
              transactions={recentTransactions}
              members={members}
              wallets={wallets}
            />
          )}

          {/* Upcoming Events */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Upcoming Events
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} members={members} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active Projects</span>
                <span className="text-sm font-medium text-gray-900">
                  {activePitches.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Members</span>
                <span className="text-sm font-medium text-gray-900">
                  {members.filter((m) => m.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Open Bets</span>
                <span className="text-sm font-medium text-gray-900">
                  {bets.filter((b) => b.status === 'pending').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
