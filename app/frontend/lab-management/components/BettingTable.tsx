import { useState } from 'react'
import type { Pitch, Bet, Member, Cycle, Appetite } from '../types'

interface BettingTableProps {
  pitches: Pitch[]
  bets: Bet[]
  members: Member[]
  cycles: Cycle[]
  currentMemberId: string
  isCooldown: boolean
  onPlaceBet?: (pitchId: string, teamMemberIds: string[]) => void
  onRemoveBet?: (betId: string) => void
  onViewPitch?: (pitchId: string) => void
}

const appetiteLabels: Record<Appetite, { label: string; weeks: number; color: string }> = {
  '2-weeks': {
    label: '2 semaines',
    weeks: 2,
    color: 'bg-emerald-100 text-emerald-700',
  },
  '3-weeks': {
    label: '3 semaines',
    weeks: 3,
    color: 'bg-amber-100 text-amber-700',
  },
  '6-weeks': {
    label: '6 semaines',
    weeks: 6,
    color: 'bg-violet-100 text-violet-700',
  },
}

export function BettingTable({
  pitches,
  bets,
  members,
  cycles,
  currentMemberId,
  isCooldown,
  onPlaceBet,
  onRemoveBet,
  onViewPitch,
}: BettingTableProps) {
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string[]>([])

  // Get active cycle
  const activeCycle = cycles.find((c) => c.status === 'active' || c.status === 'cooldown')

  // Get pitches available for betting (shaped or already in betting)
  const availablePitches = pitches.filter((p) => p.status === 'shaped' || p.status === 'betting')

  // Get bets for the current cycle
  const cycleBets = bets.filter((b) => b.cycleId === activeCycle?.id)

  // Calculate capacity used
  const totalWeeksUsed = cycleBets.reduce((sum, bet) => {
    const pitch = pitches.find((p) => p.id === bet.pitchId)
    if (!pitch) return sum
    return sum + (appetiteLabels[pitch.appetite]?.weeks || 0)
  }, 0)

  // Get available team members (active members)
  const availableMembers = members.filter((m) => m.status === 'active')

  // Current user is admin?
  const currentMember = members.find((m) => m.id === currentMemberId)
  const isAdmin = currentMember?.isAdmin

  // Handle team member toggle
  const toggleTeamMember = (memberId: string) => {
    setSelectedTeam((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  // Handle place bet
  const handlePlaceBet = () => {
    if (selectedPitchId && selectedTeam.length > 0) {
      onPlaceBet?.(selectedPitchId, selectedTeam)
      setSelectedPitchId(null)
      setSelectedTeam([])
    }
  }

  // Cancel selection
  const handleCancel = () => {
    setSelectedPitchId(null)
    setSelectedTeam([])
  }

  if (!isCooldown) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h3 className="font-semibold text-stone-800 mb-2">
          Betting non disponible
        </h3>
        <p className="text-stone-500 text-sm max-w-md mx-auto">
          Le betting s'ouvre pendant la période de cooldown, entre deux cycles de construction.
          {activeCycle && (
            <span className="block mt-2">
              Prochain cooldown:{' '}
              <span className="font-medium text-stone-700">
                {new Date(activeCycle.cooldownStart).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </span>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Capacity indicator */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-stone-800">
            Capacité du cycle
          </h3>
          <span className="text-sm text-stone-500">
            {totalWeeksUsed} / 6 semaines utilisées
          </span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              totalWeeksUsed > 6
                ? 'bg-red-500'
                : totalWeeksUsed === 6
                  ? 'bg-[#AFBD00]'
                  : 'bg-[#5B5781]'
            }`}
            style={{ width: `${Math.min((totalWeeksUsed / 6) * 100, 100)}%` }}
          />
        </div>
        {totalWeeksUsed > 6 && (
          <p className="mt-2 text-xs text-red-600">
            ⚠️ La capacité dépasse 6 semaines. Retirez des projets ou réduisez les appetites.
          </p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available pitches */}
        <div>
          <h3 className="font-semibold text-stone-800 mb-4">
            Pitches disponibles
          </h3>

          {availablePitches.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <p className="text-stone-400 text-sm">
                Aucun pitch prêt pour le betting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availablePitches.map((pitch) => {
                const author = members.find((m) => m.id === pitch.authorId)
                const appetiteConfig = appetiteLabels[pitch.appetite]
                const isAlreadyBet = cycleBets.some((b) => b.pitchId === pitch.id)
                const isSelected = selectedPitchId === pitch.id

                return (
                  <div
                    key={pitch.id}
                    className={`
                      bg-white rounded-xl border-2 transition-all
                      ${
                        isSelected
                          ? 'border-[#5B5781] shadow-lg'
                          : isAlreadyBet
                            ? 'border-[#AFBD00]/50 opacity-60'
                            : 'border-stone-200 hover:border-stone-300'
                      }
                    `}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => onViewPitch?.(pitch.id)}
                          className="text-left hover:opacity-80 transition-opacity"
                        >
                          <h4 className="font-semibold text-stone-800">
                            {pitch.title}
                          </h4>
                          <p className="text-sm text-stone-500 line-clamp-2 mt-1">
                            {pitch.problem}
                          </p>
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${appetiteConfig.color}`}>
                          {appetiteConfig.label}
                        </span>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-2 mt-3">
                        {author && (
                          <>
                            <img
                              src={author.avatar}
                              alt={author.firstName}
                              className="w-5 h-5 rounded-full bg-stone-100"
                            />
                            <span className="text-xs text-stone-400">
                              {author.firstName} {author.lastName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2">
                        {isAlreadyBet ? (
                          <span className="text-sm text-[#AFBD00] font-medium">
                            ✓ Pari placé
                          </span>
                        ) : isSelected ? (
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPitchId(pitch.id)}
                            className="px-3 py-1.5 text-sm bg-[#5B5781] hover:bg-[#4a4670] text-white rounded-lg font-medium transition-colors"
                          >
                            Parier sur ce pitch
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Team selection panel */}
                    {isSelected && (
                      <div className="border-t border-stone-200 p-4 bg-stone-50 rounded-b-xl">
                        <h5 className="text-sm font-medium text-stone-700 mb-3">
                          Sélectionner l'équipe
                        </h5>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {availableMembers.map((member) => {
                            const isInTeam = selectedTeam.includes(member.id)
                            return (
                              <button
                                key={member.id}
                                onClick={() => toggleTeamMember(member.id)}
                                className={`
                                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all
                                  ${
                                    isInTeam
                                      ? 'bg-[#5B5781] text-white'
                                      : 'bg-white text-stone-600 border border-stone-200 hover:border-[#5B5781]'
                                  }
                                `}
                              >
                                <img
                                  src={member.avatar}
                                  alt={member.firstName}
                                  className="w-5 h-5 rounded-full bg-stone-100"
                                />
                                {member.firstName}
                                {isInTeam && (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        <button
                          onClick={handlePlaceBet}
                          disabled={selectedTeam.length === 0}
                          className={`
                            w-full px-4 py-2 rounded-lg font-medium transition-colors
                            ${
                              selectedTeam.length > 0
                                ? 'bg-[#AFBD00] hover:bg-[#9aaa00] text-white'
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            }
                          `}
                        >
                          {selectedTeam.length > 0
                            ? `Confirmer le pari (${selectedTeam.length} membre${selectedTeam.length > 1 ? 's' : ''})`
                            : 'Sélectionnez au moins 1 membre'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Current bets */}
        <div>
          <h3 className="font-semibold text-stone-800 mb-4">
            Paris du cycle
          </h3>

          {cycleBets.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-stone-300 p-8 text-center">
              <div className="text-4xl mb-3">🎲</div>
              <p className="text-stone-400 text-sm">
                Aucun pari placé pour ce cycle
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cycleBets.map((bet) => {
                const pitch = pitches.find((p) => p.id === bet.pitchId)
                if (!pitch) return null

                const appetiteConfig = appetiteLabels[pitch.appetite]
                const team = bet.teamMemberIds
                  .map((id) => members.find((m) => m.id === id))
                  .filter(Boolean) as Member[]
                const placedBy = members.find((m) => m.id === bet.placedBy)

                return (
                  <div
                    key={bet.id}
                    className="bg-white rounded-xl border border-[#AFBD00]/30 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => onViewPitch?.(pitch.id)}
                          className="text-left hover:opacity-80 transition-opacity"
                        >
                          <h4 className="font-semibold text-stone-800">
                            {pitch.title}
                          </h4>
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${appetiteConfig.color}`}>
                          {appetiteConfig.label}
                        </span>
                      </div>

                      {/* Team */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-stone-500">Équipe:</span>
                        <div className="flex -space-x-2">
                          {team.map((member) => (
                            <img
                              key={member.id}
                              src={member.avatar}
                              alt={`${member.firstName} ${member.lastName}`}
                              title={`${member.firstName} ${member.lastName}`}
                              className="w-6 h-6 rounded-full border-2 border-white bg-stone-100"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
                        <span>
                          Pari placé par {placedBy?.firstName} le{' '}
                          {new Date(bet.placedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        {isAdmin && onRemoveBet && (
                          <button
                            onClick={() => onRemoveBet(bet.id)}
                            className="text-red-500 hover:text-red-600 font-medium"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
