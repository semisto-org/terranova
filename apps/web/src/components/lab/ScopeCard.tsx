'use client'

import { useState } from 'react'
import type { Scope } from '@terranova/types'
import { TaskList } from './TaskList'
import { addTask } from '@/actions/lab-management'

interface ScopeCardProps {
  scope: Scope
  onUpdateHillPosition?: (scopeId: string, position: number) => void
  onRefresh?: () => void
}

export function ScopeCard({
  scope,
  onUpdateHillPosition,
  onRefresh,
}: ScopeCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)

  const completedCount = scope.tasks.filter((t) => t.completed).length
  const totalCount = scope.tasks.length
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Determine if uphill or downhill
  const isUphill = scope.hillPosition <= 50
  const phase = isUphill ? 'Figuring Out' : 'Making It Happen'

  const handleAddTask = async (isNiceToHave: boolean) => {
    if (!newTaskTitle.trim()) return

    setIsAddingTask(true)
    try {
      await addTask(scope.id, newTaskTitle, isNiceToHave)
      setNewTaskTitle('')
      onRefresh?.()
    } catch (error) {
      alert('Error adding task: ' + (error as Error).message)
    } finally {
      setIsAddingTask(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="cursor-pointer px-4 py-3 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{scope.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{scope.description}</p>
          </div>
          <button className="ml-3 text-gray-400 hover:text-gray-600">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {completedCount}/{totalCount} tasks
            </span>
            <span>{scope.hillPosition}% • {phase}</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full ${
                completionPercentage === 100
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tasks */}
          <TaskList scope={scope} onRefresh={onRefresh} />

          {/* Add Task Form */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddTask(false)
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isAddingTask || !newTaskTitle.trim()}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingTask ? 'Adding...' : 'Add Must-Have'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTask(true)}
                  disabled={isAddingTask || !newTaskTitle.trim()}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Add Nice-to-Have
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
