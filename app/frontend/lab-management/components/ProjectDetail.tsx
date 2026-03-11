import React, { useCallback, useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { apiRequest } from '@/lib/api'
import { ArrowLeft, Plus, Calendar, MapPin, ChevronRight, Pencil, FileText } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskListBlock } from './TaskListBlock'
import { SortableTaskListBlock } from './SortableTaskListBlock'
import { TaskListForm } from './TaskListForm'
import { ActionForm } from './ActionForm'
import { ProjectEditModal } from './ProjectEditModal'
import { ProjectDocuments } from './ProjectDocuments'
import { CollaborativeEditor } from './CollaborativeEditor'
import { MemberDisplay, MemberAvatarStack, type MemberOption } from './MemberPicker'
import { type ActionItem } from './ActionRow'

interface TaskListData {
  id: string
  name: string
  position: number
  actions: ActionItem[]
}

interface EventData {
  id: string
  title: string
  type: string
  startDate: string
  endDate: string
  location: string
}

interface DocumentData {
  id: string
  filename: string
  contentType: string
  byteSize: number
  url: string
  uploadedBy: string | null
  createdAt: string
}

interface ProjectData {
  id: string
  name: string
  description: string | null
  pole: string | null
  status: string
  leadName: string
  teamNames: string[]
  needsReclassification: boolean
  totalActions: number
  completedActions: number
  inProgressActions: number
  notes: string | null
  documents: DocumentData[]
  taskLists: TaskListData[]
  unlistedActions: ActionItem[]
  events: EventData[]
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  'Idée': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-400' },
  'En attente': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'En cours': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Standby': { bg: 'bg-stone-100', text: 'text-stone-600', dot: 'bg-stone-400' },
  'Terminé': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Annulé': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  'No go': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

const POLE_CONFIG: Record<string, { label: string; accent: string; bg: string }> = {
  academy: { label: 'Academy', accent: '#B01A19', bg: '#eac7b8' },
  design: { label: 'Design Studio', accent: '#AFBD00', bg: '#e1e6d8' },
  nursery: { label: 'Nursery', accent: '#EF9B0D', bg: '#fbe6c3' },
}

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const { auth } = usePage<any>().props
  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [taskListModal, setTaskListModal] = useState<{ id?: string; name?: string } | null>(null)
  const [actionModal, setActionModal] = useState<{ taskListId: string; action?: ActionItem } | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [members, setMembers] = useState<MemberOption[]>([])

  useEffect(() => {
    apiRequest('/api/v1/lab/members').then(res => {
      setMembers(res.items.map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        avatar: m.avatar,
      })))
    }).catch(() => {})
  }, [])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(`/api/v1/lab/projects/${projectId}`)
      setProject(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const runAndRefresh = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await load(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [load])

  const handleToggleAction = useCallback((actionId: string) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/actions/${actionId}/toggle`, { method: 'PATCH' }))
  }, [runAndRefresh])

  const handleCreateTaskList = useCallback((name: string) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/projects/${projectId}/task-lists`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }))
    setTaskListModal(null)
  }, [runAndRefresh, projectId])

  const handleUpdateTaskList = useCallback((id: string, name: string) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/task-lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }))
    setTaskListModal(null)
  }, [runAndRefresh])

  const handleDeleteTaskList = useCallback((id: string) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/task-lists/${id}`, { method: 'DELETE' }))
  }, [runAndRefresh])

  const handleReorderTaskLists = useCallback(async (orderedIds: string[]) => {
    await apiRequest(`/api/v1/lab/projects/${projectId}/task-lists/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ordered_ids: orderedIds }),
    })
    await load(true)
  }, [projectId, load])

  const handleReorderActions = useCallback(async (taskListId: string, orderedIds: string[]) => {
    await apiRequest(`/api/v1/lab/task-lists/${taskListId}/actions/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ ordered_ids: orderedIds }),
    })
    await load(true)
  }, [load])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleCreateAction = useCallback((taskListId: string, values: any) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/task-lists/${taskListId}/actions`, {
      method: 'POST',
      body: JSON.stringify(values),
    }))
    setActionModal(null)
  }, [runAndRefresh])

  const handleUpdateAction = useCallback((action: ActionItem, values: any) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/actions/${action.id}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    }))
    setActionModal(null)
  }, [runAndRefresh])

  const handleDeleteAction = useCallback((actionId: string) => {
    runAndRefresh(() => apiRequest(`/api/v1/lab/actions/${actionId}`, { method: 'DELETE' }))
  }, [runAndRefresh])

  const handleUploadDocuments = useCallback(async (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('documents[]', file))
    setBusy(true)
    setError(null)
    try {
      await fetch(`/api/v1/lab/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        },
      })
      await load(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [projectId, load])

  const handleDeleteDocument = useCallback(async (docId: string) => {
    await runAndRefresh(() => apiRequest(`/api/v1/lab/documents/${docId}`, { method: 'DELETE' }))
  }, [runAndRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-7 h-7 border-2 border-stone-200 border-t-[#5B5781] rounded-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-stone-500">Projet introuvable</p>
        <button onClick={onBack} className="mt-3 text-sm font-medium text-[#5B5781] hover:underline">Retour aux projets</button>
      </div>
    )
  }

  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG['Standby']
  const poleConfig = project.pole ? POLE_CONFIG[project.pole] : null
  const totalTasks = project.totalActions
  const completedTasks = project.completedActions
  const inProgressTasks = project.inProgressActions || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const inProgressProgress = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0
  const hasUnlisted = project.unlistedActions.length > 0

  const currentMember = auth?.member ? {
    id: String(auth.member.id),
    firstName: auth.member.firstName,
    lastName: auth.member.lastName,
  } : { id: '0', firstName: 'Anonyme', lastName: '' }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#5B5781] mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Projets
      </button>

      {/* Project header card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {project.status}
              </span>
              {poleConfig && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: poleConfig.bg, color: poleConfig.accent }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: poleConfig.accent }} />
                  {poleConfig.label}
                </span>
              )}
              <button
                onClick={() => setEditModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-[#5B5781] transition-colors ml-1"
              >
                <Pencil className="w-3 h-3" />
                Modifier
              </button>
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-stone-500 mb-3 leading-relaxed">{project.description}</p>
            )}
            {!project.description && <div className="mb-2" />}
            <div className="flex items-center gap-4 flex-wrap">
              {project.leadName && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mr-1">Lead</span>
                  <MemberDisplay name={project.leadName} members={members} size={22} />
                </div>
              )}
              {project.teamNames?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mr-1">Équipe</span>
                  <MemberAvatarStack names={project.teamNames} members={members} size={24} />
                  <span className="text-xs text-stone-500">
                    {project.teamNames.map((name, i) => {
                      const m = members.find(m => `${m.firstName} ${m.lastName}` === name || m.firstName === name)
                      return m ? m.firstName : name
                    }).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {totalTasks > 0 && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#f5f5f4" strokeWidth="3" />
                  {/* In progress arc (behind completed) */}
                  {inProgressProgress > 0 && (
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke="#5B578130"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - (progress + inProgressProgress) / 100)}`}
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                  {/* Completed arc */}
                  <circle
                    cx="22" cy="22" r="18" fill="none"
                    stroke={progress === 100 ? '#10b981' : '#5B5781'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-stone-700 tabular-nums">
                  {progress}%
                </span>
              </div>
              <span className="text-[11px] text-stone-400 tabular-nums">{completedTasks}/{totalTasks}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Task Lists */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tâches</h2>
          <button
            onClick={() => setTaskListModal({})}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5B5781] bg-[#5B5781]/5 hover:bg-[#5B5781]/10 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle liste
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event
            if (!over || active.id === over.id || !project) return
            const oldIndex = project.taskLists.findIndex(tl => tl.id === String(active.id))
            const newIndex = project.taskLists.findIndex(tl => tl.id === String(over.id))
            if (oldIndex === -1 || newIndex === -1) return
            const reordered = arrayMove(project.taskLists, oldIndex, newIndex)
            setProject({ ...project, taskLists: reordered })
            handleReorderTaskLists(reordered.map(tl => tl.id))
          }}
        >
          <SortableContext
            items={project.taskLists.map(tl => tl.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {project.taskLists.map(tl => (
                <SortableTaskListBlock
                  key={tl.id}
                  id={tl.id}
                  name={tl.name}
                  actions={tl.actions}
                  onToggleAction={handleToggleAction}
                  onEditAction={action => setActionModal({ taskListId: tl.id, action })}
                  onDeleteAction={handleDeleteAction}
                  onAddAction={taskListId => setActionModal({ taskListId })}
                  onEditList={(id, name) => setTaskListModal({ id, name })}
                  onDeleteList={handleDeleteTaskList}
                  onReorderActions={handleReorderActions}
                  busy={busy}
                  members={members}
                />
              ))}

              {hasUnlisted && (
                <TaskListBlock
                  id="__unlisted"
                  name="Non classées"
                  actions={project.unlistedActions}
                  onToggleAction={handleToggleAction}
                  onEditAction={a => setActionModal({ taskListId: '', action: a })}
                  onDeleteAction={handleDeleteAction}
                  busy={busy}
                  accentColor="#a8a29e"
                  members={members}
                />
              )}

              {project.taskLists.length === 0 && !hasUnlisted && (
                <div className="rounded-xl border-2 border-dashed border-stone-200 py-12 flex flex-col items-center justify-center">
                  <p className="text-sm text-stone-500 mb-2">Aucune tâche pour ce projet</p>
                  <button
                    onClick={() => setTaskListModal({})}
                    className="text-sm font-medium text-[#5B5781] hover:underline"
                  >
                    Créer une liste de tâches
                  </button>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Notes (Collaborative Editor) */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Notes
          </span>
        </h2>
        <CollaborativeEditor
          projectId={projectId}
          initialContent={project.notes || ''}
          currentMember={currentMember}
          members={members}
        />
      </div>

      {/* Documents */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
          Documents
          {project.documents.length > 0 && (
            <span className="ml-2 text-stone-400 normal-case font-normal">{project.documents.length}</span>
          )}
        </h2>
        <ProjectDocuments
          documents={project.documents}
          projectId={projectId}
          onUpload={handleUploadDocuments}
          onDelete={handleDeleteDocument}
          busy={busy}
        />
      </div>

      {/* Related Events */}
      {project.events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
            Événements liés
            <span className="ml-2 text-stone-400 normal-case font-normal">{project.events.length}</span>
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
            {project.events.map(event => (
              <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#5B5781]/5 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-[#5B5781]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{event.title}</p>
                  <p className="text-xs text-stone-500">
                    {new Date(event.startDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.type && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium">{event.type}</span>
                    )}
                  </p>
                </div>
                {event.location && (
                  <span className="text-xs text-stone-400 flex items-center gap-1 flex-shrink-0">
                    <MapPin className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{event.location}</span>
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskListModal && (
        <TaskListForm
          initialName={taskListModal.name}
          onSubmit={name => {
            if (taskListModal.id) {
              handleUpdateTaskList(taskListModal.id, name)
            } else {
              handleCreateTaskList(name)
            }
          }}
          onClose={() => setTaskListModal(null)}
          busy={busy}
        />
      )}

      {actionModal && (
        <ActionForm
          action={actionModal.action}
          members={members}
          onSubmit={values => {
            if (actionModal.action) {
              handleUpdateAction(actionModal.action, values)
            } else {
              handleCreateAction(actionModal.taskListId, values)
            }
          }}
          onClose={() => setActionModal(null)}
          busy={busy}
        />
      )}

      {editModal && project && (
        <ProjectEditModal
          project={project}
          onSave={() => { setEditModal(false); load() }}
          onDelete={onBack}
          onClose={() => setEditModal(false)}
        />
      )}
    </div>
  )
}
