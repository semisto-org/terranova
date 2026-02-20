import { useState } from 'react'
import type {
  Pitch,
  Bet,
  Scope,
  ChowderItem,
  Member,
  Cycle,
  HillChartSnapshot,
} from '../types'
import { HillChart } from './HillChart'
import { ScopeCard } from './ScopeCard'
import { ChowderList } from './ChowderList'

export interface BuildingViewProps {
  // Data
  pitches: Pitch[]
  bets: Bet[]
  scopes: Scope[]
  chowderItems: ChowderItem[]
  members: Member[]
  cycles: Cycle[]
  hillChartSnapshots: HillChartSnapshot[]

  // Actions
  onUpdateHillPosition?: (scopeId: string, position: number) => void
  onToggleTask?: (scopeId: string, taskId: string) => void
  onAddTask?: (scopeId: string) => void
  onCreateScope?: (pitchId: string) => void
  onAddChowderItem?: (pitchId: string) => void
  onMoveChowderToScope?: (itemId: string, scopeId: string) => void
  onDeleteChowderItem?: (itemId: string) => void
  onViewHistory?: (pitchId: string) => void
}

const scopeColors = [
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#0ea5e9', // sky
]

export function BuildingView({
  pitches,
  bets,
  scopes,
  chowderItems,
  members,
  cycles,
  hillChartSnapshots,
  onUpdateHillPosition,
  onToggleTask,
  onAddTask,
  onCreateScope,
  onAddChowderItem,
  onMoveChowderToScope,
  onDeleteChowderItem,
  onViewHistory,
}: BuildingViewProps) {
  // Get pitches in building phase
  const buildingBets = bets.filter((b) => b.status === 'in_progress')
  const buildingPitches = buildingBets
    .map((bet) => {
      const pitch = pitches.find((p) => p.id === bet.pitchId)
      const cycle = cycles.find((c) => c.id === bet.cycleId)
      return pitch ? { pitch, bet, cycle } : null
    })
    .filter(Boolean) as { pitch: Pitch; bet: Bet; cycle: Cycle | undefined }[]

  // State for selected pitch and scope
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(
    buildingPitches[0]?.pitch.id || null
  )
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null)

  const selectedPitchData = buildingPitches.find((p) => p.pitch.id === selectedPitchId)
  const selectedPitch = selectedPitchData?.pitch
  const selectedBet = selectedPitchData?.bet
  const selectedCycle = selectedPitchData?.cycle

  const pitchScopes = scopes.filter((s) => s.pitchId === selectedPitchId)
  const pitchChowder = chowderItems.filter((c) => c.pitchId === selectedPitchId)
  const teamMembers = selectedBet?.teamMemberIds.map((id) => members.find((m) => m.id === id)).filter(Boolean) as Member[] || []

  // Calculate days remaining in cycle
  const getDaysRemaining = () => {
    if (!selectedCycle) return null
    const now = new Date()
    const endDate = new Date(selectedCycle.endDate)
    const diff = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const daysRemaining = getDaysRemaining()

  if (buildingPitches.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">
            Aucun projet en construction
          </h2>
          <p className="text-stone-500">
            Les projets apparaîtront ici une fois qu'ils auront été sélectionnés lors d'une Betting Table.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with project selector */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
                Building Track
              </h1>
              <p className="text-stone-500 mt-1">
                Suivez l'avancement des projets en construction
              </p>
            </div>

            {/* Project selector dropdown */}
            {buildingPitches.length > 1 && (
              <div className="relative">
                <select
                  value={selectedPitchId || ''}
                  onChange={(e) => {
                    setSelectedPitchId(e.target.value)
                    setSelectedScopeId(null)
                  }}
                  className="appearance-none bg-white border border-stone-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-stone-700 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5B5781] focus:border-transparent cursor-pointer min-w-[200px]"
                >
                  {buildingPitches.map(({ pitch, cycle }) => (
                    <option key={pitch.id} value={pitch.id}>
                      {pitch.title}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span className="absolute -top-2 -right-2 bg-[#5B5781] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {buildingPitches.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedPitch && (
          <>
            {/* Project info bar */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-800">
                    {selectedPitch.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#5B5781]/10 text-[#5B5781]">
                      {selectedPitch.appetite}
                    </span>
                    {selectedCycle && (
                      <span className="text-sm text-stone-500">
                        {selectedCycle.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Team */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Équipe:</span>
                    <div className="flex -space-x-2">
                      {teamMembers.map((member) => (
                        <img
                          key={member.id}
                          src={member.avatar}
                          alt={`${member.firstName} ${member.lastName}`}
                          title={`${member.firstName} ${member.lastName}`}
                          className="w-8 h-8 rounded-full border-2 border-white bg-stone-100"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Days remaining */}
                  {daysRemaining !== null && (
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${daysRemaining <= 7 ? 'text-red-500' : 'text-stone-800'}`}>
                        {daysRemaining}
                      </p>
                      <p className="text-xs text-stone-500">jours restants</p>
                    </div>
                  )}

                  {/* History button */}
                  {onViewHistory && (
                    <button
                      onClick={() => onViewHistory(selectedPitch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historique
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-6">
              {/* Hill Chart */}
              <div className="bg-white rounded-xl border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-800">
                    Hill Chart
                  </h3>
                  <p className="text-xs text-stone-400">
                    Cliquez sur un point pour voir le scope
                  </p>
                </div>
                <HillChart
                  scopes={pitchScopes}
                  pitchTitle={selectedPitch.title}
                  onViewScope={(scopeId) => setSelectedScopeId(scopeId === selectedScopeId ? null : scopeId)}
                  onUpdatePosition={onUpdateHillPosition}
                />
              </div>

              {/* Scopes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-stone-800">
                    Scopes
                  </h3>
                  {onCreateScope && (
                    <button
                      onClick={() => onCreateScope(selectedPitch.id)}
                      className="text-sm text-[#5B5781] hover:text-[#4a4670] font-medium transition-colors"
                    >
                      + Nouveau scope
                    </button>
                  )}
                </div>

                {pitchScopes.length === 0 ? (
                  <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                    <p className="text-stone-500">
                      Aucun scope défini. Créez des scopes pour organiser le travail.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchScopes.map((scope, index) => (
                      <ScopeCard
                        key={scope.id}
                        scope={scope}
                        color={scopeColors[index % scopeColors.length]}
                        isSelected={selectedScopeId === scope.id}
                        onSelect={() => setSelectedScopeId(scope.id === selectedScopeId ? null : scope.id)}
                        onToggleTask={(taskId) => onToggleTask?.(scope.id, taskId)}
                        onAddTask={() => onAddTask?.(scope.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Chowder List */}
              <ChowderList
                items={pitchChowder}
                members={members}
                onMoveToScope={(itemId) => onMoveChowderToScope?.(itemId, '')}
                onDelete={onDeleteChowderItem}
                onAdd={() => onAddChowderItem?.(selectedPitch.id)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
