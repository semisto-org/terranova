import React, { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { CheckCircle2, ListTodo, Paintbrush, Calendar, Circle, ChevronRight, User } from 'lucide-react'

interface ActionItem {
  id: string
  name: string
  status: string
  dueDate: string | null
  timeMinutes: number | null
  assigneeName: string
  tags: string[]
  priority: string
  completed: boolean
  taskListId: string | null
  createdAt: string
}

interface MyAction extends ActionItem {
  projectId: string | null
  projectName: string | null
}

interface MyDesignTask {
  id: string
  name: string
  status: string
  dueDate: string | null
  assigneeName: string
  projectId: string
  projectName: string
  taskListName: string
  createdAt: string
}

interface MyTasksDashboardProps {
  onNavigateToProject?: (projectId: string) => void
}

export function MyTasksDashboard({ onNavigateToProject }: MyTasksDashboardProps) {
  const [labActions, setLabActions] = useState<MyAction[]>([])
  const [designTasks, setDesignTasks] = useState<MyDesignTask[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/v1/lab/my-tasks')
      setLabActions(res.labActions || [])
      setDesignTasks(res.designTasks || [])
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggleLabAction = useCallback(async (actionId: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/lab/actions/${actionId}/toggle`, { method: 'PATCH' })
      await load()
    } finally {
      setBusy(false)
    }
  }, [load])

  const handleToggleDesignTask = useCallback(async (taskId: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/design/tasks/${taskId}/toggle`, { method: 'PATCH' })
      await load()
    } finally {
      setBusy(false)
    }
  }, [load])

  const totalTasks = labActions.length + designTasks.length
  const pendingTasks = labActions.filter(a => !a.completed).length + designTasks.filter(t => t.status !== 'completed').length

  if (loading) return null
  if (totalTasks === 0) return null

  // Group lab actions by project
  const actionsByProject = new Map<string, { name: string; actions: MyAction[] }>()
  for (const action of labActions) {
    const key = action.projectId || '_none'
    if (!actionsByProject.has(key)) {
      actionsByProject.set(key, { name: action.projectName || 'Sans projet', actions: [] })
    }
    actionsByProject.get(key)!.actions.push(action)
  }

  // Group design tasks by project
  const designByProject = new Map<string, { name: string; tasks: MyDesignTask[] }>()
  for (const task of designTasks) {
    if (!designByProject.has(task.projectId)) {
      designByProject.set(task.projectId, { name: task.projectName, tasks: [] })
    }
    designByProject.get(task.projectId)!.tasks.push(task)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5B5781]/10 flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-[#5B5781]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Mes tâches</h3>
            <p className="text-xs text-stone-500">{pendingTasks} en cours</p>
          </div>
        </div>
        <span className="text-lg font-semibold text-stone-900 tabular-nums">{pendingTasks}</span>
      </div>

      {/* Lab actions */}
      {labActions.length > 0 && (
        <div className="px-4 py-3">
          {Array.from(actionsByProject.entries()).map(([projectId, { name, actions }]) => (
            <div key={projectId} className="mb-3 last:mb-0">
              <button
                onClick={() => projectId !== '_none' && onNavigateToProject?.(projectId)}
                className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${
                  projectId !== '_none' ? 'text-[#5B5781] hover:underline' : 'text-stone-500'
                }`}
              >
                <div className="w-1 h-3.5 rounded-full bg-[#5B5781]" />
                {name}
              </button>
              {actions.map(action => {
                const isOverdue = action.dueDate && !action.completed && new Date(action.dueDate) < new Date()
                return (
                  <div key={action.id} className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-stone-50/80 transition-colors">
                    <button
                      onClick={() => handleToggleLabAction(action.id)}
                      disabled={busy}
                      className="mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: action.completed ? '#5B5781' : 'transparent',
                        borderColor: action.completed ? '#5B5781' : '#d6d3d1',
                        color: action.completed ? 'white' : 'transparent',
                      }}
                    >
                      {action.completed && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm leading-snug ${action.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {action.name}
                      </span>
                      {action.dueDate && (
                        <span className={`ml-2 inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-400'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(action.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Design tasks */}
      {designTasks.length > 0 && (
        <div className={`px-4 py-3 ${labActions.length > 0 ? 'border-t border-stone-100' : ''}`}>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mb-3">
            <Paintbrush className="w-3 h-3 text-[#AFBD00]" />
            Design Studio
          </div>
          {Array.from(designByProject.entries()).map(([projectId, { name, tasks }]) => (
            <div key={projectId} className="mb-3 last:mb-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8a9600] mb-2">
                <div className="w-1 h-3.5 rounded-full bg-[#AFBD00]" />
                {name}
              </div>
              {tasks.map(task => {
                const isCompleted = task.status === 'completed'
                const isOverdue = task.dueDate && !isCompleted && new Date(task.dueDate) < new Date()
                return (
                  <div key={task.id} className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-stone-50/80 transition-colors">
                    <button
                      onClick={() => handleToggleDesignTask(task.id)}
                      disabled={busy}
                      className="mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: isCompleted ? '#AFBD00' : 'transparent',
                        borderColor: isCompleted ? '#AFBD00' : '#d6d3d1',
                        color: isCompleted ? 'white' : 'transparent',
                      }}
                    >
                      {isCompleted && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm leading-snug ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {task.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.taskListName && (
                          <span className="text-[11px] text-stone-400">{task.taskListName}</span>
                        )}
                        {task.dueDate && (
                          <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-400'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
