import type { Scope } from '../types'
import { TaskList } from './TaskList'

interface ScopeCardProps {
  scope: Scope
  color: string
  isSelected?: boolean
  onSelect?: () => void
  onToggleTask?: (taskId: string) => void
  onAddTask?: () => void
}

export function ScopeCard({
  scope,
  color,
  isSelected,
  onSelect,
  onToggleTask,
  onAddTask,
}: ScopeCardProps) {
  const completedTasks = scope.tasks.filter((t) => t.completed).length
  const totalTasks = scope.tasks.length
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Determine phase based on hill position
  const phase = scope.hillPosition <= 50 ? 'uphill' : 'downhill'
  const phaseLabel = phase === 'uphill' ? 'Figuring it out' : 'Making it happen'

  return (
    <div
      className={`
        bg-white dark:bg-stone-800/50 rounded-xl border-2 transition-all
        ${isSelected ? 'border-[#5B5781] shadow-lg' : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'}
      `}
    >
      {/* Header */}
      <button
        onClick={onSelect}
        className="w-full text-left p-4 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                {scope.name}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                {scope.description}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-stone-800 dark:text-stone-100">
              {completedTasks}/{totalTasks}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">tâches</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center justify-between mt-3">
          <span
            className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium
              ${phase === 'uphill'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}
            `}
          >
            <span>{phase === 'uphill' ? '⛰️' : '🏃'}</span>
            {phaseLabel}
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Position: {scope.hillPosition}%
          </span>
        </div>
      </button>

      {/* Expanded task list */}
      {isSelected && (
        <div className="border-t border-stone-200 dark:border-stone-700 p-4">
          <TaskList
            tasks={scope.tasks}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
          />
        </div>
      )}
    </div>
  )
}
