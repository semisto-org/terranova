import React, { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ListTodo, Calendar, ChevronRight, Inbox } from 'lucide-react'
import type { Task, ProjectGroup, ProjectTypeKey } from './types'
import { PROJECT_ACCENT_COLORS, PROJECT_TYPE_LABELS } from './types'

interface MyTasksDashboardProps {
  onNavigateToProject?: (projectType: ProjectTypeKey, projectId: string) => void
}

export function MyTasksDashboard({ onNavigateToProject }: MyTasksDashboardProps) {
  const [projects, setProjects] = useState<ProjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/v1/my-tasks')
      setProjects(res.projects || [])
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = useCallback(async (taskId: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/tasks/${taskId}/toggle`, { method: 'PATCH' })
      await load()
    } finally {
      setBusy(false)
    }
  }, [load])

  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)

  if (loading) return null
  if (totalTasks === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-stone-400" />
          </div>
          <p className="text-sm text-stone-500">Aucune tâche assignée</p>
        </div>
      </div>
    )
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
            <p className="text-xs text-stone-500">{totalTasks} en cours</p>
          </div>
        </div>
        <span className="text-lg font-semibold text-stone-900 tabular-nums">{totalTasks}</span>
      </div>

      {/* Project groups */}
      <div className="divide-y divide-stone-100">
        {projects.map(project => {
          const accent = PROJECT_ACCENT_COLORS[project.projectType] || '#5B5781'
          const typeLabel = PROJECT_TYPE_LABELS[project.projectType] || ''

          return (
            <div key={`${project.projectType}-${project.projectId}`} className="px-4 py-3">
              <button
                onClick={() => onNavigateToProject?.(project.projectType, project.projectId)}
                className="flex items-center gap-1.5 text-xs font-semibold mb-2 hover:underline transition-colors"
                style={{ color: accent }}
              >
                <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: accent }} />
                {project.projectName}
                {typeLabel && (
                  <span className="text-stone-400 font-normal ml-1">· {typeLabel}</span>
                )}
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>

              {project.tasks.map(task => {
                const isOverdue = task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date()
                return (
                  <div key={task.id} className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-stone-50/80 transition-colors">
                    <button
                      onClick={() => handleToggle(task.id)}
                      disabled={busy}
                      className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: task.status === 'completed' ? accent : 'transparent',
                        borderWidth: task.status === 'in_progress' ? 0 : task.status === 'completed' ? 0 : 2,
                        borderStyle: 'solid',
                        borderColor: task.status === 'completed' ? accent : '#d6d3d1',
                        color: task.status === 'completed' ? 'white' : 'transparent',
                      }}
                    >
                      {task.status === 'completed' && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {task.status === 'in_progress' && (
                        <svg className="absolute inset-0 w-5 h-5" viewBox="0 0 20 20" fill="none"
                          style={{ animation: 'taskStatusSpin 2s linear infinite' }}>
                          <circle cx="10" cy="10" r="7.5" stroke={accent} strokeWidth="2"
                            strokeDasharray="12 35" strokeLinecap="round"
                            style={{ animation: 'taskStatusPulse 2s ease-in-out infinite' }} />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm leading-snug ${
                        task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-900'
                      }`}>
                        {task.name}
                      </span>
                      {task.dueDate && (
                        <span className={`ml-2 inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-400'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
