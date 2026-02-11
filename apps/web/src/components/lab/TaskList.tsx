'use client'

import type { Scope } from '@terranova/types'
import { toggleTask } from '@/actions/lab-management'
import { useState } from 'react'

interface TaskListProps {
  scope: Scope
  onRefresh?: () => void
}

export function TaskList({ scope, onRefresh }: TaskListProps) {
  const [togglingTask, setTogglingTask] = useState<string | null>(null)

  const handleToggleTask = async (taskId: string) => {
    setTogglingTask(taskId)
    try {
      await toggleTask(taskId)
      onRefresh?.()
    } catch (error) {
      alert('Error toggling task: ' + (error as Error).message)
    } finally {
      setTogglingTask(null)
    }
  }

  const mustHaveTasks = scope.tasks.filter((t) => !t.isNiceToHave)
  const niceToHaveTasks = scope.tasks.filter((t) => t.isNiceToHave)

  return (
    <div className="px-4 py-3">
      {/* Must-Have Tasks */}
      {mustHaveTasks.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Must-Have
          </h4>
          <div className="space-y-2">
            {mustHaveTasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  disabled={togglingTask === task.id}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span
                  className={`flex-1 text-sm ${
                    task.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Nice-to-Have Tasks */}
      {niceToHaveTasks.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Nice-to-Have
          </h4>
          <div className="space-y-2">
            {niceToHaveTasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  disabled={togglingTask === task.id}
                  className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500 disabled:opacity-50"
                />
                <span
                  className={`flex-1 text-sm italic ${
                    task.completed
                      ? 'text-gray-400 line-through'
                      : 'text-gray-600'
                  }`}
                >
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {scope.tasks.length === 0 && (
        <p className="text-center text-sm text-gray-500">No tasks yet</p>
      )}
    </div>
  )
}
