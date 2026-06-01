import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { ListTodo, ChevronRight, Inbox, Plus, X, Search, LayoutList, CalendarDays, ChevronDown, Users } from 'lucide-react'
import { TaskRow } from './TaskRow'
import { TaskForm } from './TaskForm'
import { TaskDetail } from './TaskDetail'
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

type ViewMode = 'project' | 'date'

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

// Range de groupe pour la vue datée. L'ordre définit la priorité d'affectation :
// une tâche tombe dans le PREMIER groupe qui la matche (coucou avant sélection,
// etc.), de sorte que ce qui demande attention remonte tout en haut.
const DATE_GROUPS = [
  'Coucous 👋', 'Ma sélection', 'En retard', "Aujourd'hui",
  'Cette semaine', 'Plus tard', 'Sans date', 'Récemment terminé',
] as const
type DateGroup = typeof DATE_GROUPS[number]

function dateGroupFor(task: Task): DateGroup {
  if (task.status === 'completed') return 'Récemment terminé'
  if (task.pingedAt) return 'Coucous 👋'
  if (task.starredAt) return 'Ma sélection'
  if (!task.dueDate) return 'Sans date'
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(task.dueDate))
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'En retard'
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays <= 7) return 'Cette semaine'
  return 'Plus tard'
}

export function MyTasksDashboard({ onNavigateToProject }: MyTasksDashboardProps) {
  const page = usePage() as any
  const currentMemberId: string | null = page?.props?.auth?.member?.id ?? null

  const [projects, setProjects] = useState<ProjectGroup[]>([])
  const [myProjects, setMyProjects] = useState<MyProject[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // Membre dont on consulte les tâches (null = moi). Voir un collègue permet de
  // lui faire « coucou » sur une tâche importante (elle remonte dans SA liste).
  const [viewedMemberId, setViewedMemberId] = useState<string | null>(null)
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false)
  const isOwn = !viewedMemberId || viewedMemberId === currentMemberId
  const tasksEndpoint = isOwn ? '/api/v1/my-tasks' : `/api/v1/member-tasks/${viewedMemberId}`

  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('project')
  const [projectFilter, setProjectFilter] = useState<string>('all') // 'all' | projectKey

  const [detail, setDetail] = useState<{ task: Task; key: string; accent: string } | null>(null)
  const [editing, setEditing] = useState<{ task: Task; key: string; accent: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [creating, setCreating] = useState<{ listId: string; members: MemberOption[] } | null>(null)

  // silent: ne pas repasser par l'état `loading` (qui démonte la liste et
  // ferait sauter le scroll du drawer quand on coche/épingle une tâche).
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const tasksRes = await apiRequest(tasksEndpoint)
      setProjects(tasksRes.projects || [])
      if (isOwn) {
        const projectsRes = await apiRequest('/api/v1/my-projects')
        setMyProjects(projectsRes.projects || [])
      }
    } catch {
      // silently handle
    } finally {
      if (!silent) setLoading(false)
    }
  }, [tasksEndpoint, isOwn])

  useEffect(() => { load() }, [load])

  // Liste des membres pour le sélecteur « voir la liste d'un collègue ».
  useEffect(() => {
    apiRequest('/api/v1/lab/members')
      .then(res => setMembers((res.items || []).map((m: any) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, avatar: m.avatar }))))
      .catch(() => {})
  }, [])

  const viewedMember = useMemo(
    () => (isOwn ? null : members.find(m => m.id === viewedMemberId) || null),
    [isOwn, members, viewedMemberId]
  )

  const membersFor = useCallback(
    (key: string) => myProjects.find(p => projectKey(p.projectType, p.projectId) === key)?.members || [],
    [myProjects]
  )

  // Garde le détail/édition synchronisés avec les données rechargées.
  const refreshOpenTask = useCallback((list: ProjectGroup[]) => {
    setDetail(prev => {
      if (!prev) return prev
      const fresh = list.flatMap(p => p.tasks).find(t => t.id === prev.task.id)
      return fresh ? { ...prev, task: fresh } : null
    })
  }, [])

  const patch = useCallback(async (path: string, options?: RequestInit) => {
    setBusy(true)
    try {
      await apiRequest(path, { method: 'PATCH', ...options })
      const tasksRes = await apiRequest(tasksEndpoint)
      const list: ProjectGroup[] = tasksRes.projects || []
      setProjects(list)
      refreshOpenTask(list)
    } finally {
      setBusy(false)
    }
  }, [refreshOpenTask, tasksEndpoint])

  const handleToggle = useCallback((id: string) => patch(`/api/v1/tasks/${id}/toggle`), [patch])
  const handleStar = useCallback((id: string) => patch(`/api/v1/tasks/${id}/star`), [patch])
  const handlePing = useCallback((id: string) => patch(`/api/v1/tasks/${id}/ping`), [patch])

  const handleDelete = useCallback(async (id: string) => {
    setBusy(true)
    try {
      await apiRequest(`/api/v1/tasks/${id}`, { method: 'DELETE' })
      await load(true)
      setDetail(null)
    } finally {
      setBusy(false)
    }
  }, [load])

  const handleSaveNotes = useCallback((id: string, notes: string) =>
    patch(`/api/v1/tasks/${id}`, { body: JSON.stringify({ notes }) }), [patch])

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

  const accentForType = (type: string) => PROJECT_ACCENT_COLORS[type as ProjectTypeKey] || '#5B5781'

  // Coucou : sur les tâches d'un collègue (pour faire remonter), ou sur mes
  // propres tâches uniquement si un coucou y a déjà été posé (pour le retirer).
  const pingHandlerFor = (task: Task) => (!isOwn || task.pingedAt ? handlePing : undefined)
  // Étoile « ma sélection » : uniquement sur mes propres tâches.
  const starHandlerFor = () => (isOwn ? handleStar : undefined)

  // Recherche + filtre projet appliqués à toutes les tâches.
  const matches = useCallback((t: Task) => {
    if (projectFilter !== 'all' && projectKey(t.projectType || '', t.projectId || '') !== projectFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [t.name, t.description, t.notes, t.projectName].some(v => v?.toLowerCase().includes(q))
  }, [search, projectFilter])

  const filteredProjects = useMemo(
    () => projects.map(p => ({ ...p, tasks: p.tasks.filter(matches) })).filter(p => p.tasks.length > 0),
    [projects, matches]
  )

  const allTasks = useMemo(() => projects.flatMap(p => p.tasks), [projects])
  const filteredTasks = useMemo(() => allTasks.filter(matches), [allTasks, matches])
  const activeCount = useMemo(() => allTasks.filter(t => t.status !== 'completed').length, [allTasks])

  // Vue datée : affectation au premier groupe qui matche.
  const dateGrouped = useMemo(() => {
    const map = new Map<DateGroup, Task[]>()
    for (const t of filteredTasks) {
      const g = dateGroupFor(t)
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(t)
    }
    return DATE_GROUPS.filter(g => map.has(g)).map(g => ({ group: g, tasks: map.get(g)! }))
  }, [filteredTasks])

  const projectOptions = useMemo(
    () => projects.map(p => ({ key: projectKey(p.projectType, p.projectId), name: p.projectName })),
    [projects]
  )

  const openDetail = (task: Task, key: string, accent: string) => setDetail({ task, key, accent })

  if (loading) return null

  const inputClass = 'w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400'

  return (
    <div className="space-y-3">
      {/* Header — pas d'overflow-hidden : le menu déroulant du sélecteur de
          personne doit pouvoir déborder sous l'en-tête sans être rogné. */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="relative flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5B5781]/10 flex items-center justify-center shrink-0">
              <ListTodo className="w-4 h-4 text-[#5B5781]" />
            </div>
            {/* Sélecteur de personne : mes tâches, ou la liste d'un collègue */}
            <button
              onClick={() => setOwnerMenuOpen(o => !o)}
              className="flex items-center gap-1.5 text-left rounded-lg px-1.5 py-1 -ml-1 hover:bg-stone-50 transition-colors"
            >
              <div>
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-1">
                  {isOwn ? 'Mes tâches' : `Tâches de ${viewedMember?.firstName || '…'}`}
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </h3>
                <p className="text-xs text-stone-500">{activeCount} en cours</p>
              </div>
            </button>

            {ownerMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOwnerMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 w-60 max-h-72 overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-xl py-1">
                  <button
                    onClick={() => { setViewedMemberId(null); setOwnerMenuOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50 ${isOwn ? 'text-[#5B5781] font-medium' : 'text-stone-700'}`}
                  >
                    <ListTodo className="w-4 h-4" /> Mes tâches
                  </button>
                  <div className="px-3 py-1 mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-stone-400">
                    <Users className="w-3 h-3" /> Listes des collègues
                  </div>
                  {members.filter(m => m.id !== currentMemberId).map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setViewedMemberId(m.id); setOwnerMenuOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50 ${viewedMemberId === m.id ? 'text-[#5B5781] font-medium' : 'text-stone-700'}`}
                    >
                      {m.avatar
                        ? <img src={m.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                        : <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-[9px] text-stone-500">{m.firstName[0]}{m.lastName[0]}</span>}
                      {m.firstName} {m.lastName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {isOwn && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#5B5781]/10 text-[#5B5781] hover:bg-[#5B5781]/15 transition-colors shrink-0"
              disabled={myProjects.length === 0}
              title={myProjects.length === 0 ? "Vous n'êtes membre d'aucun projet" : 'Ajouter une tâche'}
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          )}
        </div>

        {/* Recherche + filtres + bascule de vue */}
        <div className="px-4 pb-4 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans mes tâches…"
              className={inputClass}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
              <button
                onClick={() => setView('project')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${view === 'project' ? 'bg-[#5B5781] text-white' : 'text-stone-500 hover:text-stone-800'}`}
              >
                <LayoutList className="w-3.5 h-3.5" /> Projet
              </button>
              <button
                onClick={() => setView('date')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${view === 'date' ? 'bg-[#5B5781] text-white' : 'text-stone-500 hover:text-stone-800'}`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Date
              </button>
            </div>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg bg-white border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
            >
              <option value="all">Tous les projets</option>
              {projectOptions.map(o => <option key={o.key} value={o.key}>{o.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">{search || projectFilter !== 'all' ? 'Aucune tâche ne correspond' : 'Aucune tâche assignée'}</p>
          </div>
        </div>
      ) : view === 'project' ? (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
          {filteredProjects.map(project => {
            const key = projectKey(project.projectType, project.projectId)
            const accent = accentForType(project.projectType)
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
                    onOpenDetail={t => openDetail(t, key, accent)}
                    onStar={starHandlerFor()}
                    onPing={pingHandlerFor(task)}
                    busy={busy}
                    accentColor={accent}
                    members={members}
                  />
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm divide-y divide-stone-100">
          {dateGrouped.map(({ group, tasks }) => (
            <div key={group} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-stone-600">{group}</span>
                <span className="text-[10px] text-stone-400">{tasks.length}</span>
              </div>
              {tasks.map(task => {
                const key = projectKey(task.projectType || '', task.projectId || '')
                const accent = accentForType(task.projectType || '')
                return (
                  <div key={task.id}>
                    <TaskRow
                      task={task}
                      onToggle={handleToggle}
                      onOpenDetail={t => openDetail(t, key, accent)}
                      onStar={starHandlerFor()}
                      onPing={pingHandlerFor(task)}
                      busy={busy}
                      accentColor={accent}
                      members={membersFor(key)}
                    />
                    {task.projectName && (
                      <button
                        onClick={() => task.projectType && task.projectId && onNavigateToProject?.(task.projectType, task.projectId)}
                        className="ml-8 -mt-1 mb-1 text-[11px] text-stone-400 hover:text-stone-600 hover:underline"
                      >
                        {task.projectName}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Détail d'une tâche (provenance, historique, notes) */}
      {detail && (
        <TaskDetail
          task={detail.task}
          accentColor={detail.accent}
          busy={busy}
          onClose={() => setDetail(null)}
          onEdit={t => { setEditing({ task: t, key: detail.key, accent: detail.accent }); setDetail(null) }}
          onDelete={handleDelete}
          onStar={starHandlerFor()}
          onPing={pingHandlerFor(detail.task)}
          onSaveNotes={handleSaveNotes}
          onNavigateToProject={onNavigateToProject}
        />
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
