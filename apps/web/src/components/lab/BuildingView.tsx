'use client'

import type { Pitch, Scope, ChowderItem, HillChartSnapshot } from '@terranova/types'
import { HillChart } from './HillChart'
import { ScopeCard } from './ScopeCard'
import { ChowderList } from './ChowderList'
import { updateHillPosition } from '@/actions/lab-management'

interface BuildingViewProps {
  pitch: Pitch
  scopes: Scope[]
  chowderItems: ChowderItem[]
  hillChartSnapshots: HillChartSnapshot[]
  onRefresh?: () => void
}

export function BuildingView({
  pitch,
  scopes,
  chowderItems,
  hillChartSnapshots,
  onRefresh,
}: BuildingViewProps) {
  const handleUpdatePosition = async (scopeId: string, position: number) => {
    try {
      await updateHillPosition(scopeId, Math.round(position))
      onRefresh?.()
    } catch (error) {
      alert('Error updating position: ' + (error as Error).message)
    }
  }

  // Calculate overall progress
  const totalTasks = scopes.reduce((sum, s) => sum + s.tasks.length, 0)
  const completedTasks = scopes.reduce(
    (sum, s) => sum + s.tasks.filter((t) => t.completed).length,
    0
  )
  const overallProgress =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pitch.title}</h1>
            <p className="mt-2 text-gray-600">{pitch.problem}</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            Building
          </span>
        </div>

        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>
              {completedTasks}/{totalTasks} tasks ({overallProgress.toFixed(0)}%)
            </span>
          </div>
          <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hill Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Hill Chart
        </h2>
        <HillChart scopes={scopes} onUpdatePosition={handleUpdatePosition} />
      </div>

      {/* Scopes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Scopes</h2>
        {scopes.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-sm text-gray-500">
              No scopes yet. Create your first scope!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scopes.map((scope) => (
              <ScopeCard
                key={scope.id}
                scope={scope}
                onUpdateHillPosition={handleUpdatePosition}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Chowder List */}
      <ChowderList
        pitchId={pitch.id}
        chowderItems={chowderItems}
        scopes={scopes}
        onRefresh={onRefresh}
      />

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-gray-500">Appetite</div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {pitch.appetite}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">
              Rabbit Holes
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {pitch.rabbitHoles.length}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">No-Gos</div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {pitch.noGos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
