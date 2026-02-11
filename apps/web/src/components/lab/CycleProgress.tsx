import type { Cycle } from '@terranova/types'

interface CycleProgressProps {
  cycle: Cycle
}

export function CycleProgress({ cycle }: CycleProgressProps) {
  const now = new Date()
  const startDate = new Date(cycle.startDate)
  const endDate = new Date(cycle.endDate)
  const cooldownStart = new Date(cycle.cooldownStart)
  const cooldownEnd = new Date(cycle.cooldownEnd)

  // Calculate progress
  const totalDuration = cooldownEnd.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))

  // Determine phase
  const isBuilding = now >= startDate && now < cooldownStart
  const isCooldown = now >= cooldownStart && now <= cooldownEnd

  // Calculate days remaining
  const targetDate = isCooldown ? cooldownEnd : endDate
  const daysRemaining = Math.ceil(
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="mt-4">
      {/* Cycle Info */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
          <p className="text-sm text-gray-500">
            {startDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {cooldownEnd.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              isBuilding
                ? 'bg-blue-100 text-blue-800'
                : isCooldown
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isBuilding ? 'Building' : isCooldown ? 'Cooldown' : cycle.status}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          {/* Building phase */}
          <div
            className="absolute h-3 bg-blue-500"
            style={{
              width: `${
                ((cooldownStart.getTime() - startDate.getTime()) /
                  totalDuration) *
                100
              }%`,
            }}
          />
          {/* Cooldown phase */}
          <div
            className="absolute h-3 bg-yellow-400"
            style={{
              left: `${
                ((cooldownStart.getTime() - startDate.getTime()) /
                  totalDuration) *
                100
              }%`,
              width: `${
                ((cooldownEnd.getTime() - cooldownStart.getTime()) /
                  totalDuration) *
                100
              }%`,
            }}
          />
          {/* Progress indicator */}
          <div
            className="absolute h-3 bg-gradient-to-r from-gray-900/20 to-transparent"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current position marker */}
        <div
          className="absolute top-0 h-3 w-0.5 bg-gray-900"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Phase Labels */}
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Building Phase</span>
        <span>Cooldown</span>
      </div>
    </div>
  )
}
