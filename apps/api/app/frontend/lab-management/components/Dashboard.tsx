import type {
  Member,
  Cycle,
  Pitch,
  Bet,
  Scope,
  Event,
  Wallet,
  SemosTransaction,
  SemosEmission,
  Guild,
} from '../types'

import { HillChart } from './HillChart'
import { EventCard } from './EventCard'
import { SemosWalletCard } from './SemosWalletCard'
import { CycleProgress } from './CycleProgress'

export interface DashboardProps {
  // Data
  members: Member[]
  cycles: Cycle[]
  guilds: Guild[]
  pitches: Pitch[]
  bets: Bet[]
  scopes: Scope[]
  events: Event[]
  wallets: Wallet[]
  semosTransactions: SemosTransaction[]
  semosEmissions: SemosEmission[]

  // Current user context
  currentMemberId: string

  // Actions
  onViewPitch?: (pitchId: string) => void
  onViewScope?: (scopeId: string) => void
  onViewEvent?: (eventId: string) => void
  onViewCycle?: (cycleId: string) => void
  onCreateEvent?: () => void
  onTransferSemos?: () => void
  onViewSemosHistory?: () => void
  onViewMember?: (memberId: string) => void
}

export function Dashboard({
  members,
  cycles,
  guilds,
  pitches,
  bets,
  scopes,
  events,
  wallets,
  semosTransactions,
  semosEmissions,
  currentMemberId,
  onViewPitch,
  onViewScope,
  onViewEvent,
  onViewCycle,
  onCreateEvent,
  onTransferSemos,
  onViewSemosHistory,
  onViewMember,
}: DashboardProps) {
  // Get current member and their wallet
  const currentMember = members.find((m) => m.id === currentMemberId)
  const currentWallet = wallets.find((w) => w.memberId === currentMemberId)

  // Get active cycle
  const activeCycle = cycles.find((c) => c.status === 'active' || c.status === 'cooldown')

  // Get projects in building phase (bets in progress)
  const buildingBets = bets.filter((b) => b.status === 'in_progress')
  const buildingPitches = buildingBets
    .map((bet) => {
      const pitch = pitches.find((p) => p.id === bet.pitchId)
      const pitchScopes = scopes.filter((s) => s.pitchId === bet.pitchId)
      const team = bet.teamMemberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean)
      return pitch ? { pitch, scopes: pitchScopes, bet, team: team as Member[] } : null
    })
    .filter(Boolean) as { pitch: Pitch; scopes: Scope[]; bet: Bet; team: Member[] }[]

  // Get upcoming events (next 7 days)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.startDate)
      return eventDate >= now && eventDate <= nextWeek
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 4)

  // Get member's guilds
  const memberGuilds = guilds.filter((g) => currentMember?.guildIds.includes(g.id))

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 dark:text-stone-100">
            Bonjour, {currentMember?.firstName} 👋
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Voici ce qui se passe dans le Lab aujourd'hui
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Cycle */}
            {activeCycle && (
              <section>
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Cycle actif
                </h2>
                <CycleProgress
                  cycle={activeCycle}
                  onViewCycle={() => onViewCycle?.(activeCycle.id)}
                />
              </section>
            )}

            {/* Projects in Building */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Projets en cours
                </h2>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {buildingPitches.length} projet{buildingPitches.length > 1 ? 's' : ''}
                </span>
              </div>

              {buildingPitches.length === 0 ? (
                <div className="bg-white dark:bg-stone-800/50 rounded-xl p-8 border border-stone-200 dark:border-stone-700 text-center">
                  <p className="text-stone-500 dark:text-stone-400">
                    Aucun projet en cours pour ce cycle
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buildingPitches.map(({ pitch, scopes: pitchScopes, team }) => (
                    <div
                      key={pitch.id}
                      className="bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all hover:shadow-sm"
                    >
                      {/* Pitch header */}
                      <div className="flex items-start justify-between mb-4">
                        <button
                          onClick={() => onViewPitch?.(pitch.id)}
                          className="text-left hover:opacity-80 transition-opacity"
                        >
                          <h3 className="font-semibold text-stone-800 dark:text-stone-100 line-clamp-2">
                            {pitch.title}
                          </h3>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#5B5781]/10 text-[#5B5781] dark:bg-[#5B5781]/30 dark:text-[#c8bfd2]">
                            {pitch.appetite}
                          </span>
                        </button>
                        <div className="flex -space-x-2 flex-shrink-0 ml-2">
                          {team.slice(0, 3).map((member) => (
                            <img
                              key={member.id}
                              src={member.avatar}
                              alt={`${member.firstName} ${member.lastName}`}
                              title={`${member.firstName} ${member.lastName}`}
                              className="w-7 h-7 rounded-full border-2 border-white dark:border-stone-800 bg-stone-100 cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                              onClick={() => onViewMember?.(member.id)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Hill Chart */}
                      {pitchScopes.length > 0 ? (
                        <HillChart
                          scopes={pitchScopes}
                          pitchTitle={pitch.title}
                          compact
                          onViewScope={onViewScope}
                        />
                      ) : (
                        <div className="py-4 text-center text-sm text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-800 rounded-lg">
                          Aucun scope défini
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Events */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Prochains événements
                </h2>
                <button
                  onClick={onCreateEvent}
                  className="text-xs text-[#5B5781] hover:text-[#4a4670] dark:text-[#c8bfd2] dark:hover:text-white font-medium transition-colors"
                >
                  + Créer
                </button>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="bg-white dark:bg-stone-800/50 rounded-xl p-8 border border-stone-200 dark:border-stone-700 text-center">
                  <p className="text-stone-500 dark:text-stone-400">
                    Aucun événement prévu cette semaine
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      members={members}
                      onView={() => onViewEvent?.(event.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Semos Wallet */}
            {currentWallet && currentMember && (
              <section>
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Mon portefeuille
                </h2>
                <SemosWalletCard
                  wallet={currentWallet}
                  member={currentMember}
                  transactions={semosTransactions}
                  emissions={semosEmissions}
                  allMembers={members}
                  allWallets={wallets}
                  onTransfer={onTransferSemos}
                  onViewHistory={onViewSemosHistory}
                />
              </section>
            )}

            {/* My Guilds */}
            {memberGuilds.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Mes guildes
                </h2>
                <div className="space-y-2">
                  {memberGuilds.map((guild) => {
                    const leader = members.find((m) => m.id === guild.leaderId)
                    const guildMembers = members.filter((m) => guild.memberIds.includes(m.id))

                    const colorClasses = {
                      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                      purple:
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                      green:
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                      orange:
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                      red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
                    }

                    return (
                      <div
                        key={guild.id}
                        className="bg-white dark:bg-stone-800/50 rounded-lg p-4 border border-stone-200 dark:border-stone-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colorClasses[guild.color]}`}
                          >
                            {guild.name}
                          </span>
                          {leader?.id === currentMemberId && (
                            <span className="text-[10px] text-stone-400 dark:text-stone-500">
                              (Lead)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-2">
                          {guild.description}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1.5">
                            {guildMembers.slice(0, 4).map((member) => (
                              <img
                                key={member.id}
                                src={member.avatar}
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-5 h-5 rounded-full border border-white dark:border-stone-800 bg-stone-100"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500">
                            {guildMembers.length} membre{guildMembers.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Quick stats */}
            <section>
              <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                Statistiques
              </h2>
              <div className="bg-white dark:bg-stone-800/50 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <p className="text-2xl font-bold text-[#5B5781] dark:text-[#c8bfd2]">
                      {members.filter((m) => m.status === 'active').length}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Membres actifs</p>
                  </div>
                  <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <p className="text-2xl font-bold text-[#AFBD00]">{buildingPitches.length}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Projets en cours</p>
                  </div>
                  <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <p className="text-2xl font-bold text-stone-700 dark:text-stone-300">
                      {guilds.length}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Guildes</p>
                  </div>
                  <div className="text-center p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
                    <p className="text-2xl font-bold text-stone-700 dark:text-stone-300">
                      {pitches.filter((p) => p.status === 'shaped').length}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Pitches prêts</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
