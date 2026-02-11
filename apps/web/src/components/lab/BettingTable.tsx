'use client'

import type { Bet, Pitch, Cycle, Member } from '@terranova/types'

interface BettingTableProps {
  bets: Bet[]
  pitches: Pitch[]
  cycles: Cycle[]
  members: Member[]
  currentCycle: Cycle | undefined
  onPlaceBet?: (pitchId: string) => void
  onRemoveBet?: (betId: string) => void
}

export function BettingTable({
  bets,
  pitches,
  cycles,
  members,
  currentCycle,
  onPlaceBet,
  onRemoveBet,
}: BettingTableProps) {
  // Get bets for current cycle
  const currentBets = currentCycle
    ? bets.filter((b) => b.cycleId === currentCycle.id)
    : []

  // Check if in cooldown period
  const inCooldown = currentCycle?.status === 'cooldown'

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Betting Table
            </h2>
            {currentCycle && (
              <p className="mt-1 text-sm text-gray-500">
                {currentCycle.name} •{' '}
                <span
                  className={
                    inCooldown ? 'font-medium text-yellow-600' : 'text-gray-500'
                  }
                >
                  {inCooldown ? 'Cooldown - Betting Open' : 'Building Phase'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {!currentCycle ? (
        <div className="p-12 text-center text-sm text-gray-500">
          No active cycle
        </div>
      ) : currentBets.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-gray-500">
            {inCooldown
              ? 'No bets placed yet. Place your first bet!'
              : 'No bets for this cycle'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Pitch
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Appetite
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Placed
                </th>
                {onRemoveBet && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentBets.map((bet) => {
                const pitch = pitches.find((p) => p.id === bet.pitchId)
                const teamMembers = members.filter((m) =>
                  bet.teamMemberIds.includes(m.id)
                )

                if (!pitch) return null

                return (
                  <tr
                    key={bet.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {pitch.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                        {pitch.problem}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {pitch.appetite}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex -space-x-2">
                        {teamMembers.slice(0, 3).map((member) => (
                          <div
                            key={member.id}
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600"
                            title={`${member.firstName} ${member.lastName}`}
                          >
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </div>
                        ))}
                        {teamMembers.length > 3 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                            +{teamMembers.length - 3}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          bet.status === 'in_progress'
                            ? 'bg-green-100 text-green-800'
                            : bet.status === 'completed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bet.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(bet.placedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {onRemoveBet && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onRemoveBet(bet.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Available Pitches (in cooldown) */}
      {inCooldown && onPlaceBet && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            Available Pitches
          </h3>
          <div className="space-y-2">
            {pitches
              .filter(
                (p) =>
                  p.status === 'shaped' &&
                  !currentBets.some((b) => b.pitchId === p.id)
              )
              .map((pitch) => (
                <div
                  key={pitch.id}
                  className="flex items-center justify-between rounded-md bg-white px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {pitch.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pitch.appetite}
                    </div>
                  </div>
                  <button
                    onClick={() => onPlaceBet(pitch.id)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Place Bet
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
