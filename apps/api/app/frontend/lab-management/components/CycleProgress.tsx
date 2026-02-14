import type { Cycle } from '../types'

interface CycleProgressProps {
  cycle: Cycle
  onViewCycle?: () => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function calculateProgress(cycle: Cycle): {
  percent: number
  daysRemaining: number
  phase: 'work' | 'cooldown'
} {
  const now = new Date()
  const startDate = new Date(cycle.startDate)
  const endDate = new Date(cycle.endDate)
  const cooldownStart = new Date(cycle.cooldownStart)
  const cooldownEnd = new Date(cycle.cooldownEnd)

  // Check if in cooldown phase
  if (now >= cooldownStart && now <= cooldownEnd) {
    const totalCooldown = cooldownEnd.getTime() - cooldownStart.getTime()
    const elapsed = now.getTime() - cooldownStart.getTime()
    const daysRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      percent: Math.min(100, (elapsed / totalCooldown) * 100),
      daysRemaining,
      phase: 'cooldown',
    }
  }

  // Work phase
  const totalWork = endDate.getTime() - startDate.getTime()
  const elapsed = now.getTime() - startDate.getTime()
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    percent: Math.min(100, Math.max(0, (elapsed / totalWork) * 100)),
    daysRemaining: Math.max(0, daysRemaining),
    phase: 'work',
  }
}

export function CycleProgress({ cycle, onViewCycle }: CycleProgressProps) {
  const progress = calculateProgress(cycle)

  return (
    <button
      onClick={onViewCycle}
      className="w-full text-left bg-white dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide
              ${
                progress.phase === 'work'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }
            `}
            >
              {progress.phase === 'work' ? 'En cours' : 'Cooldown'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mt-1">
            {cycle.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {progress.daysRemaining}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">jours restants</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Full timeline bar */}
        <div className="h-3 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden flex">
          {/* Work phase section (75% of bar) */}
          <div className="w-3/4 relative">
            {progress.phase === 'work' && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5B5781] to-[#7B75A1] rounded-l-full transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            )}
            {progress.phase === 'cooldown' && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B5781] to-[#7B75A1] rounded-l-full" />
            )}
          </div>
          {/* Cooldown section (25% of bar) */}
          <div className="w-1/4 relative border-l-2 border-white dark:border-stone-800">
            {progress.phase === 'cooldown' && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-full transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            )}
          </div>
        </div>

        {/* Timeline labels */}
        <div className="flex justify-between mt-2 text-[10px] text-stone-400 dark:text-stone-500">
          <span>{formatDate(cycle.startDate)}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600" />
            {formatDate(cycle.cooldownStart)}
          </span>
          <span>{formatDate(cycle.cooldownEnd)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5B5781]" />
          Travail (6 sem.)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Cooldown (2 sem.)
        </span>
      </div>
    </button>
  )
}
