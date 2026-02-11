'use client'

import type { Pitch, Member } from '@terranova/types'

interface PitchCardProps {
  pitch: Pitch
  author: Member | undefined
  onViewPitch?: (pitchId: string) => void
  onEditPitch?: (pitchId: string) => void
  onDeletePitch?: (pitchId: string) => void
}

export function PitchCard({
  pitch,
  author,
  onViewPitch,
  onEditPitch,
  onDeletePitch,
}: PitchCardProps) {
  const statusColors: Record<string, string> = {
    raw: 'bg-gray-100 text-gray-800',
    shaped: 'bg-blue-100 text-blue-800',
    betting: 'bg-yellow-100 text-yellow-800',
    building: 'bg-green-100 text-green-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const appetiteLabels: Record<string, string> = {
    '2-weeks': '2 weeks',
    '3-weeks': '3 weeks',
    '6-weeks': '6 weeks',
  }

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
      onClick={onViewPitch ? () => onViewPitch(pitch.id) : undefined}
      style={{ cursor: onViewPitch ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{pitch.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            by {author ? `${author.firstName} ${author.lastName}` : 'Unknown'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusColors[pitch.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {pitch.status}
          </span>
          <span className="text-xs text-gray-500">
            {appetiteLabels[pitch.appetite] || pitch.appetite}
          </span>
        </div>
      </div>

      {/* Problem */}
      <div className="mb-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Problem
        </h4>
        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
          {pitch.problem}
        </p>
      </div>

      {/* Solution */}
      <div className="mb-3">
        <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Solution
        </h4>
        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
          {pitch.solution}
        </p>
      </div>

      {/* Rabbit Holes & No-Gos */}
      {(pitch.rabbitHoles.length > 0 || pitch.noGos.length > 0) && (
        <div className="mb-4 flex gap-4 text-xs">
          {pitch.rabbitHoles.length > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <span>⚠️</span>
              <span>{pitch.rabbitHoles.length} rabbit holes</span>
            </div>
          )}
          {pitch.noGos.length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <span>🚫</span>
              <span>{pitch.noGos.length} no-gos</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <div className="text-xs text-gray-500">
          {new Date(pitch.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>

        {(onEditPitch || onDeletePitch) && (
          <div className="flex gap-2">
            {onEditPitch && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditPitch(pitch.id)
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
            {onDeletePitch && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePitch(pitch.id)
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
