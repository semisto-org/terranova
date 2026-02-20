import type { Task } from '../types'

interface TaskListProps {
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
  onAddTask?: () => void
}

export function TaskList({ tasks, onToggleTask, onAddTask }: TaskListProps) {
  const mustHaves = tasks.filter((t) => !t.isNiceToHave)
  const niceToHaves = tasks.filter((t) => t.isNiceToHave)

  return (
    <div className="space-y-3">
      {/* Must-haves */}
      {mustHaves.length > 0 && (
        <div className="space-y-1">
          {mustHaves.map((task) => (
            <label
              key={task.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask?.(task.id)}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[#5B5781] focus:ring-[#5B5781] cursor-pointer"
              />
              <span
                className={`text-sm ${
                  task.completed
                    ? 'line-through text-stone-400'
                    : 'text-stone-700'
                }`}
              >
                {task.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Nice-to-haves */}
      {niceToHaves.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-stone-400 font-medium px-2 pt-2">
            Nice-to-have ~
          </p>
          {niceToHaves.map((task) => (
            <label
              key={task.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggleTask?.(task.id)}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-400 focus:ring-stone-400 cursor-pointer"
              />
              <span
                className={`text-sm italic ${
                  task.completed
                    ? 'line-through text-stone-400'
                    : 'text-stone-500'
                }`}
              >
                ~ {task.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Add task button */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une tâche
        </button>
      )}
    </div>
  )
}
