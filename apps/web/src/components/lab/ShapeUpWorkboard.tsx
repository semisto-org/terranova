'use client'

import { useState } from 'react'
import type {
  Pitch,
  Bet,
  Cycle,
  Member,
  IdeaList,
  PitchStatus,
} from '@terranova/types'
import { PitchCard } from './PitchCard'
import { BettingTable } from './BettingTable'
import { IdeaLists } from './IdeaLists'

interface ShapeUpWorkboardProps {
  pitches: Pitch[]
  bets: Bet[]
  cycles: Cycle[]
  members: Member[]
  ideaLists: IdeaList[]
  currentMemberId: string
  onCreatePitch?: () => void
  onViewPitch?: (pitchId: string) => void
  onEditPitch?: (pitchId: string) => void
  onDeletePitch?: (pitchId: string) => void
  onPlaceBet?: (pitchId: string) => void
  onRemoveBet?: (betId: string) => void
  onRefresh?: () => void
}

export function ShapeUpWorkboard({
  pitches,
  bets,
  cycles,
  members,
  ideaLists,
  currentMemberId,
  onCreatePitch,
  onViewPitch,
  onEditPitch,
  onDeletePitch,
  onPlaceBet,
  onRemoveBet,
  onRefresh,
}: ShapeUpWorkboardProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | PitchStatus>('all')
  const [view, setView] = useState<'pitches' | 'betting' | 'ideas'>('pitches')

  const currentCycle = cycles.find(
    (c) => c.status === 'active' || c.status === 'cooldown'
  )

  // Filter pitches
  const filteredPitches =
    statusFilter === 'all'
      ? pitches
      : pitches.filter((p) => p.status === statusFilter)

  // Sort pitches (newest first)
  const sortedPitches = [...filteredPitches].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Count by status
  const statusCounts = {
    raw: pitches.filter((p) => p.status === 'raw').length,
    shaped: pitches.filter((p) => p.status === 'shaped').length,
    betting: pitches.filter((p) => p.status === 'betting').length,
    building: pitches.filter((p) => p.status === 'building').length,
    completed: pitches.filter((p) => p.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Shape Up Workboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage pitches, betting, and ideas
          </p>
        </div>

        {onCreatePitch && (
          <button
            onClick={onCreatePitch}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Pitch
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setView('pitches')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'pitches'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Pitches ({pitches.length})
          </button>
          <button
            onClick={() => setView('betting')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'betting'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Betting Table ({bets.length})
          </button>
          <button
            onClick={() => setView('ideas')}
            className={`border-b-2 px-1 py-3 text-sm font-medium ${
              view === 'ideas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Ideas ({ideaLists.reduce((sum, list) => sum + list.items.length, 0)})
          </button>
        </nav>
      </div>

      {/* Pitches View */}
      {view === 'pitches' && (
        <>
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({pitches.length})
            </button>
            <button
              onClick={() => setStatusFilter('raw')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'raw'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Raw ({statusCounts.raw})
            </button>
            <button
              onClick={() => setStatusFilter('shaped')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'shaped'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Shaped ({statusCounts.shaped})
            </button>
            <button
              onClick={() => setStatusFilter('betting')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'betting'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Betting ({statusCounts.betting})
            </button>
            <button
              onClick={() => setStatusFilter('building')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'building'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Building ({statusCounts.building})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                statusFilter === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              Completed ({statusCounts.completed})
            </button>
          </div>

          {/* Pitches Grid */}
          {sortedPitches.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'No pitches yet'
                  : `No ${statusFilter} pitches`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPitches.map((pitch) => {
                const author = members.find((m) => m.id === pitch.authorId)
                return (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    author={author}
                    onViewPitch={onViewPitch}
                    onEditPitch={onEditPitch}
                    onDeletePitch={onDeletePitch}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Betting View */}
      {view === 'betting' && (
        <BettingTable
          bets={bets}
          pitches={pitches}
          cycles={cycles}
          members={members}
          currentCycle={currentCycle}
          onPlaceBet={onPlaceBet}
          onRemoveBet={onRemoveBet}
        />
      )}

      {/* Ideas View */}
      {view === 'ideas' && (
        <IdeaLists
          ideaLists={ideaLists}
          currentMemberId={currentMemberId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
