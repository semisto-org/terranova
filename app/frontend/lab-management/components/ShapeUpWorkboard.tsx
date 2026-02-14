import { useState } from 'react'
import type {
  Member,
  Cycle,
  Pitch,
  Bet,
  Scope,
  ChowderItem,
  IdeaList,
  HillChartSnapshot,
} from '../types'
import { BuildingView } from './BuildingView'
import { PitchCard } from './PitchCard'
import { BettingTable } from './BettingTable'
import { IdeaLists } from './IdeaLists'

type ShapeUpTab = 'shaping' | 'betting' | 'building'

export interface ShapeUpWorkboardProps {
  // Data
  members: Member[]
  cycles: Cycle[]
  pitches: Pitch[]
  bets: Bet[]
  scopes: Scope[]
  chowderItems: ChowderItem[]
  ideaLists: IdeaList[]
  hillChartSnapshots: HillChartSnapshot[]

  // Current user context
  currentMemberId: string

  // Pitch actions
  onCreatePitch?: () => void
  onViewPitch?: (pitchId: string) => void
  onEditPitch?: (pitchId: string) => void
  onDeletePitch?: (pitchId: string) => void

  // Betting actions
  onPlaceBet?: (pitchId: string, teamMemberIds: string[]) => void
  onRemoveBet?: (betId: string) => void

  // Building actions
  onUpdateHillPosition?: (scopeId: string, position: number) => void
  onToggleTask?: (scopeId: string, taskId: string) => void
  onAddTask?: (scopeId: string) => void
  onCreateScope?: (pitchId: string) => void
  onAddChowderItem?: (pitchId: string) => void
  onMoveChowderToScope?: (itemId: string, scopeId: string) => void
  onDeleteChowderItem?: (itemId: string) => void
  onViewHistory?: (pitchId: string) => void

  // Idea list actions
  onAddIdea?: (listId: string, title: string) => void
  onVoteIdea?: (listId: string, ideaId: string) => void
}

const tabConfig: { id: ShapeUpTab; label: string; emoji: string; description: string }[] = [
  {
    id: 'shaping',
    label: 'Shaping',
    emoji: '🎨',
    description: 'Définir et affiner les pitches',
  },
  {
    id: 'betting',
    label: 'Betting',
    emoji: '🎲',
    description: 'Parier sur les projets du cycle',
  },
  {
    id: 'building',
    label: 'Building',
    emoji: '🏗️',
    description: 'Suivre la construction des projets',
  },
]

export function ShapeUpWorkboard({
  members,
  cycles,
  pitches,
  bets,
  scopes,
  chowderItems,
  ideaLists,
  hillChartSnapshots,
  currentMemberId,
  onCreatePitch,
  onViewPitch,
  onEditPitch,
  onDeletePitch,
  onPlaceBet,
  onRemoveBet,
  onUpdateHillPosition,
  onToggleTask,
  onAddTask,
  onCreateScope,
  onAddChowderItem,
  onMoveChowderToScope,
  onDeleteChowderItem,
  onViewHistory,
  onAddIdea,
  onVoteIdea,
}: ShapeUpWorkboardProps) {
  const [activeTab, setActiveTab] = useState<ShapeUpTab>('building')

  // Get active cycle
  const activeCycle = cycles.find((c) => c.status === 'active' || c.status === 'cooldown')
  const isCooldown = activeCycle?.status === 'cooldown'

  // Current member
  const currentMember = members.find((m) => m.id === currentMemberId)
  const isShaper = currentMember?.roles.includes('shaper')

  // Categorize pitches by status
  const rawPitches = pitches.filter((p) => p.status === 'raw')
  const shapedPitches = pitches.filter((p) => p.status === 'shaped')
  const bettingPitches = pitches.filter((p) => p.status === 'betting')
  const buildingPitches = pitches.filter((p) => p.status === 'building')

  // Get days until end of cooldown (for betting)
  const getCooldownDaysLeft = () => {
    if (!activeCycle || activeCycle.status !== 'cooldown') return null
    const now = new Date()
    const end = new Date(activeCycle.cooldownEnd)
    const diff = end.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const cooldownDaysLeft = getCooldownDaysLeft()

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 dark:text-stone-100">
                Shape Up
              </h1>
              <p className="text-stone-500 dark:text-stone-400 mt-1">
                {activeCycle ? (
                  <>
                    <span className="font-medium">{activeCycle.name}</span>
                    {isCooldown && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Cooldown
                      </span>
                    )}
                  </>
                ) : (
                  'Aucun cycle actif'
                )}
              </p>
            </div>

            {/* Cycle indicator */}
            {activeCycle && (
              <div className="flex items-center gap-4">
                {isCooldown && cooldownDaysLeft !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {cooldownDaysLeft}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      jours avant betting
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-stone-200 dark:border-stone-700">
            <nav className="flex gap-1 -mb-px" aria-label="Tabs">
              {tabConfig.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
                      ${
                        isActive
                          ? 'text-[#5B5781] dark:text-[#c8bfd2]'
                          : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>

                    {/* Active indicator */}
                    <span
                      className={`
                        absolute bottom-0 left-0 right-0 h-0.5 transition-all
                        ${isActive ? 'bg-[#5B5781] dark:bg-[#c8bfd2]' : 'bg-transparent group-hover:bg-stone-200 dark:group-hover:bg-stone-700'}
                      `}
                    />

                    {/* Notification badges */}
                    {tab.id === 'shaping' && rawPitches.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-stone-400 rounded-full">
                        {rawPitches.length}
                      </span>
                    )}
                    {tab.id === 'betting' && bettingPitches.length > 0 && isCooldown && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-amber-500 rounded-full">
                        {bettingPitches.length}
                      </span>
                    )}
                    {tab.id === 'building' && buildingPitches.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-[#5B5781] rounded-full">
                        {buildingPitches.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab description */}
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            {tabConfig.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'shaping' && (
            <ShapingTrack
              pitches={pitches}
              members={members}
              ideaLists={ideaLists}
              currentMemberId={currentMemberId}
              isShaper={isShaper || false}
              onCreatePitch={onCreatePitch}
              onViewPitch={onViewPitch}
              onEditPitch={onEditPitch}
              onDeletePitch={onDeletePitch}
              onAddIdea={onAddIdea}
              onVoteIdea={onVoteIdea}
            />
          )}

          {activeTab === 'betting' && (
            <BettingTable
              pitches={pitches}
              bets={bets}
              members={members}
              cycles={cycles}
              currentMemberId={currentMemberId}
              isCooldown={isCooldown || false}
              onPlaceBet={onPlaceBet}
              onRemoveBet={onRemoveBet}
              onViewPitch={onViewPitch}
            />
          )}

          {activeTab === 'building' && (
            <BuildingView
              pitches={pitches}
              bets={bets}
              scopes={scopes}
              chowderItems={chowderItems}
              members={members}
              cycles={cycles}
              hillChartSnapshots={hillChartSnapshots}
              onUpdateHillPosition={onUpdateHillPosition}
              onToggleTask={onToggleTask}
              onAddTask={onAddTask}
              onCreateScope={onCreateScope}
              onAddChowderItem={onAddChowderItem}
              onMoveChowderToScope={onMoveChowderToScope}
              onDeleteChowderItem={onDeleteChowderItem}
              onViewHistory={onViewHistory}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Shaping Track (Internal Component)
// =============================================================================

interface ShapingTrackProps {
  pitches: Pitch[]
  members: Member[]
  ideaLists: IdeaList[]
  currentMemberId: string
  isShaper: boolean
  onCreatePitch?: () => void
  onViewPitch?: (pitchId: string) => void
  onEditPitch?: (pitchId: string) => void
  onDeletePitch?: (pitchId: string) => void
  onAddIdea?: (listId: string, title: string) => void
  onVoteIdea?: (listId: string, ideaId: string) => void
}

function ShapingTrack({
  pitches,
  members,
  ideaLists,
  currentMemberId,
  isShaper,
  onCreatePitch,
  onViewPitch,
  onEditPitch,
  onDeletePitch,
  onAddIdea,
  onVoteIdea,
}: ShapingTrackProps) {
  // Categorize pitches
  const rawPitches = pitches.filter((p) => p.status === 'raw')
  const shapedPitches = pitches.filter((p) => p.status === 'shaped')

  return (
    <div className="space-y-8">
      {/* Shaper workspace - only visible to shapers */}
      {isShaper && (
        <>
          {/* Create new pitch button */}
          <div className="flex justify-end">
            <button
              onClick={onCreatePitch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5781] hover:bg-[#4a4670] text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau pitch
            </button>
          </div>

          {/* Pitch kanban by status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw pitches column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                  Brouillons
                </h3>
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-full">
                  {rawPitches.length}
                </span>
              </div>

              {rawPitches.length === 0 ? (
                <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 p-8 text-center">
                  <p className="text-stone-400 dark:text-stone-500 text-sm">
                    Aucun brouillon en cours
                  </p>
                  <button
                    onClick={onCreatePitch}
                    className="mt-3 text-sm text-[#5B5781] dark:text-[#c8bfd2] font-medium hover:underline"
                  >
                    Créer un premier pitch
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rawPitches.map((pitch) => (
                    <PitchCard
                      key={pitch.id}
                      pitch={pitch}
                      author={members.find((m) => m.id === pitch.authorId)}
                      onView={() => onViewPitch?.(pitch.id)}
                      onEdit={() => onEditPitch?.(pitch.id)}
                      onDelete={() => onDeletePitch?.(pitch.id)}
                      showActions
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Shaped pitches column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                  Prêts pour le betting
                </h3>
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold bg-[#AFBD00]/20 text-[#7a8200] dark:bg-[#AFBD00]/30 dark:text-[#AFBD00] rounded-full">
                  {shapedPitches.length}
                </span>
              </div>

              {shapedPitches.length === 0 ? (
                <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 p-8 text-center">
                  <p className="text-stone-400 dark:text-stone-500 text-sm">
                    Aucun pitch prêt
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shapedPitches.map((pitch) => (
                    <PitchCard
                      key={pitch.id}
                      pitch={pitch}
                      author={members.find((m) => m.id === pitch.authorId)}
                      onView={() => onViewPitch?.(pitch.id)}
                      onEdit={() => onEditPitch?.(pitch.id)}
                      showActions
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Non-shapers see read-only view */}
      {!isShaper && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-2">
            Espace réservé aux Shapers
          </h3>
          <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto">
            Le Shaping est géré par les membres avec le rôle Shaper. Consultez les listes d'idées ci-dessous pour proposer des améliorations.
          </p>
        </div>
      )}

      {/* Idea Lists - visible to all */}
      <div className="border-t border-stone-200 dark:border-stone-700 pt-8">
        <h3 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          Listes d'idées
        </h3>
        <IdeaLists
          ideaLists={ideaLists}
          onAddIdea={onAddIdea}
          onVoteIdea={onVoteIdea}
        />
      </div>
    </div>
  )
}
