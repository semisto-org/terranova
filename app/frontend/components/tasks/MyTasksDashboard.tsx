import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ListTodo, ChevronRight, Inbox, Plus, X } from 'lucide-react'
import { TaskRow } from './TaskRow'
import { TaskForm } from './TaskForm'
import type { Task, ProjectGroup, ProjectTypeKey, MemberOption } from './types'
import { PROJECT_ACCENT_COLORS, PROJECT_TYPE_LABELS } from './types'

interface MyProject {
  projectType: ProjectTypeKey
  projectId: string
  projectName: string
  members: MemberOption[]
  taskLists: { id: string; name: string }[]
}

interface MyTasksDashboardProps {
  onNavigateToProject?: (projectType: ProjectTypeKey, projectId: string) => void
}

const projectKey = (type: string, id: string) => `${type}-${id}`

export function MyTasksDashboard({ onNavigateToProject }: MyTasksDashboardProps) {
  const [projects, setProjects] = useState<ProjectGroup[]>([])
  const [myProjects, setMyProjects] = useState<MyProject[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState<{ task: Task; key: string; accent: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState<{ listId: string; members: MemberOption[] } | null>(null)

  // silent: ne pas repasser par l'état `loading` (qui démonte la liste et
  // ferait sauter le scroll du drawer quand on coche une tâche).
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        apiRequest('/api/v1/my-tasks'),
        apiRequest('/api/v1/my-projects'),
      ])
      setProjects(tasksRes.projects || [])
      setMyProjects(projectsRes.projects || [])
    } catch {
      // silently handle
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const membersFor = useCallback(
    (key: string) => myProjects.find(p => projectKey(p.projectType, p.projectId) === key)?.members || [],
    [myProjects]
  )

  const handleToggle = useCallback(async (taskId: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/tasks/${taskId}/toggle`, { method: 'PATCH' })
      await load(true)
    } finally {
      setBusy(false)
    }
  }, [load])

  const handleDelete = useCallback(async (taskId: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' })
      await load(true)
    } finally {
      setBusy(false)
    }
  }, [load])

  const handleEditSubmit = useCallback(async (values: any) => {
    if (!editing) return
    setBusy(true)
    try {
      await apiRequest(`/api/v1/tasks/${editing.task.id}`, { method: 'PATCH', body: JSON.stringify(values) })
      await load(true)
      setEditing(null)
    } finally {
      setBusy(false)
    }
  }, [editing, load])

  const handleCreateSubmit = useCallback(async (values: any) => {
    if (!creating) return
    setBusy(true)
    try {
      await apiRequest(`/api/v1/task-lists/${creating.listId}/tasks`, { method: 'POST', body: JSON.stringify(values) })
      await load(true)
      setCreating(null)
    } finally {
      setBusy(false)
    }
  }, [creating, load])

  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0)

  if (loading) return null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B5781]/10 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-[#5B5781]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Mes tâches</h3>
              <p className="text-xs text-stone-500">{totalTasks} en cours</p>
            </div>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/15 transition-colors"
            disabled={myProjects.length === 0}
            title={myProjects.length === 0 ? "Vous n'êtes membre d'aucun projet" : 'Ajouter une tâche'}
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
      </div>

      {totalTasks === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">Aucune tâche assignée</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
          {projects.map(project => {
            const key = projectKey(project.projectType, project.projectId)
            const accent = PROJECT_ACCENT_COLORS[project.projectType] || '#5B5781'
            const typeLabel = PROJECT_TYPE_LABELS[project.projectType] || ''
            const members = membersFor(key)

            return (
              <div key={key} className="px-4 py-3">
                <button
                  onClick={() => onNavigateToProject?.(project.projectType, project.projectId)}
                  className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 hover:underline transition-colors"
                  style={{ color: accent }}
                >
                  <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: accent }} />
                  {project.projectName}
                  {typeLabel && <span className="text-stone-400 font-normal ml-1">· {typeLabel}</span>}
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>

                {project.tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onEdit={t => setEditing({ task: t, key, accent })}
                    onDelete={handleDelete}
                    busy={busy}
                    accentColor={accent}
                    members={members}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Édition d'une tâche existante */}
      {editing && (
        <TaskForm
          task={editing.task}
          members={membersFor(editing.key)}
          onSubmit={handleEditSubmit}
          onClose={() => setEditing(null)}
          busy={busy}
          accentColor={editing.accent}
        />
      )}

      {/* Choix projet + liste avant ajout */}
      {adding && (
        <AddTaskPicker
          myProjects={myProjects}
          onClose={() => setAdding(false)}
          onPicked={(listId, members) => { setAdding(false); setCreating({ listId, members }) }}
        />
      )}

      {/* Formulaire de création */}
      {creating && (
        <TaskForm
          members={creating.members}
          onSubmit={handleCreateSubmit}
          onClose={() => setCreating(null)}
          busy={busy}
        />
      )}
    </div>
  )
}

/* Petit sélecteur projet → liste pour ajouter une tâche depuis le drawer. */
function AddTaskPicker({ myProjects, onClose, onPicked }: {
  myProjects: MyProject[]
  onClose: () => void
  onPicked: (listId: string, members: MemberOption[]) => void
}) {
  const [projectIdx, setProjectIdx] = useState<number>(myProjects.length === 1 ? 0 : -1)
  const project = projectIdx >= 0 ? myProjects[projectIdx] : null
  const [listId, setListId] = useState<string>('')
  const [newListName, setNewListName] = useState('')
  const [busy, setBusy] = useState(false)

  const proceed = useCallback(async () => {
    if (!project) return
    setBusy(true)
    try {
      let targetListId = listId
      if (!targetListId && newListName.trim()) {
        const created = await apiRequest(
          `/api/v1/projects/${project.projectType}/${project.projectId}/task-lists`,
          { method: 'POST', body: JSON.stringify({ name: newListName.trim() }) }
        )
        targetListId = created.id
      }
      if (!targetListId) return
      onPicked(targetListId, project.members)
    } finally {
      setBusy(false)
    }
  }, [project, listId, newListName, onPicked])

  const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white'
  const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'
  const canProceed = !!project && (!!listId || !!newListName.trim())

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 tracking-tight">Ajouter une tâche</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <label className="block space-y-1.5">
            <span className={labelClass}>Projet</span>
            <select
              value={projectIdx}
              onChange={e => { setProjectIdx(Number(e.target.value)); setListId(''); setNewListName('') }}
              className={inputClass}
            >
              <option value={-1} disabled>Choisir un projet…</option>
              {myProjects.map((p, i) => (
                <option key={projectKey(p.projectType, p.projectId)} value={i}>{p.projectName}</option>
              ))}
            </select>
          </label>

          {project && (
            <label className="block space-y-1.5">
              <span className={labelClass}>Liste</span>
              {project.taskLists.length > 0 ? (
                <select value={listId} onChange={e => setListId(e.target.value)} className={inputClass}>
                  <option value="">Choisir une liste…</option>
                  {project.taskLists.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className={inputClass}
                  placeholder="Nom de la première liste (ex. À faire)"
                />
              )}
            </label>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={proceed}
            disabled={!canProceed || busy}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors bg-[#5B5781]"
          >
            {busy ? '…' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  )
}
