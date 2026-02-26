import React, { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Calendar, User, X } from 'lucide-react'

interface DesignTask {
  id: string
  name: string
  status: string
  dueDate: string | null
  assigneeName: string | null
  notes: string | null
  position: number
  completed: boolean
}

interface DesignTaskList {
  id: string
  name: string
  position: number
  tasks: DesignTask[]
}

interface TeamMember {
  id: string
  memberName: string
}

interface TasksTabProps {
  taskLists: DesignTaskList[]
  teamMembers: TeamMember[]
  projectId: string
  onCreateTaskList: (name: string) => void
  onUpdateTaskList: (id: string, name: string) => void
  onDeleteTaskList: (id: string) => void
  onCreateTask: (taskListId: string, data: { name: string; due_date?: string; assignee_id?: string; notes?: string }) => void
  onUpdateTask: (id: string, data: { name: string; due_date?: string; assignee_id?: string; notes?: string }) => void
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  busy?: boolean
}

export function TasksTab({
  taskLists,
  teamMembers,
  projectId,
  onCreateTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onCreateTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  busy,
}: TasksTabProps) {
  const [showListForm, setShowListForm] = useState(false)
  const [listFormName, setListFormName] = useState('')
  const [editingList, setEditingList] = useState<{ id: string; name: string } | null>(null)
  const [taskFormFor, setTaskFormFor] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<DesignTask | null>(null)
  const [taskForm, setTaskForm] = useState({ name: '', due_date: '', assignee_id: '', notes: '' })

  const handleCreateList = () => {
    if (!listFormName.trim()) return
    onCreateTaskList(listFormName.trim())
    setListFormName('')
    setShowListForm(false)
  }

  const handleUpdateList = () => {
    if (!editingList || !editingList.name.trim()) return
    onUpdateTaskList(editingList.id, editingList.name.trim())
    setEditingList(null)
  }

  const openTaskForm = (taskListId: string, task?: DesignTask) => {
    if (task) {
      setEditingTask(task)
      setTaskForm({
        name: task.name,
        due_date: task.dueDate || '',
        assignee_id: '',
        notes: task.notes || '',
      })
    } else {
      setEditingTask(null)
      setTaskForm({ name: '', due_date: '', assignee_id: '', notes: '' })
    }
    setTaskFormFor(taskListId)
  }

  const handleSaveTask = () => {
    if (!taskForm.name.trim() || !taskFormFor) return
    const data: { name: string; due_date?: string; assignee_id?: string; notes?: string } = {
      name: taskForm.name.trim(),
    }
    if (taskForm.due_date) data.due_date = taskForm.due_date
    if (taskForm.assignee_id) data.assignee_id = taskForm.assignee_id
    if (taskForm.notes) data.notes = taskForm.notes

    if (editingTask) {
      onUpdateTask(editingTask.id, data)
    } else {
      onCreateTask(taskFormFor, data)
    }
    setTaskFormFor(null)
    setEditingTask(null)
    setTaskForm({ name: '', due_date: '', assignee_id: '', notes: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Tâches</h2>
        <button
          onClick={() => setShowListForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#AFBD00' }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle liste
        </button>
      </div>

      {showListForm && (
        <div className="flex items-center gap-2 bg-stone-50 rounded-xl border border-stone-200 p-3">
          <input
            autoFocus
            type="text"
            value={listFormName}
            onChange={e => setListFormName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateList()}
            placeholder="Nom de la liste..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <button
            onClick={handleCreateList}
            className="px-3 py-1.5 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: '#AFBD00' }}
          >
            Créer
          </button>
          <button
            onClick={() => { setShowListForm(false); setListFormName('') }}
            className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700"
          >
            Annuler
          </button>
        </div>
      )}

      {taskLists.length === 0 && !showListForm && (
        <div className="text-center py-12 text-stone-400">
          <p className="text-sm">Aucune liste de tâches</p>
          <p className="text-xs mt-1">Créez une liste pour organiser les tâches de ce projet</p>
        </div>
      )}

      {taskLists.map(tl => (
        <DesignTaskListBlock
          key={tl.id}
          taskList={tl}
          onToggleTask={onToggleTask}
          onAddTask={() => openTaskForm(tl.id)}
          onEditTask={(task) => openTaskForm(tl.id, task)}
          onDeleteTask={onDeleteTask}
          onEditList={() => setEditingList({ id: tl.id, name: tl.name })}
          onDeleteList={() => onDeleteTaskList(tl.id)}
          busy={busy}
        />
      ))}

      {/* Edit list modal */}
      {editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }}>
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Renommer la liste</h3>
            <input
              autoFocus
              type="text"
              value={editingList.name}
              onChange={e => setEditingList({ ...editingList, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleUpdateList()}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingList(null)} className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700">
                Annuler
              </button>
              <button onClick={handleUpdateList} className="px-3 py-1.5 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#AFBD00' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task form modal */}
      {taskFormFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }}>
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h3>
              <button onClick={() => { setTaskFormFor(null); setEditingTask(null) }} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={taskForm.name}
                onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
                placeholder="Nom de la tâche..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Échéance</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">Assignée à</label>
                  <select
                    value={taskForm.assignee_id}
                    onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
                  >
                    <option value="">—</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.memberName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Notes</label>
                <textarea
                  value={taskForm.notes}
                  onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setTaskFormFor(null); setEditingTask(null) }} className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700">
                Annuler
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!taskForm.name.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#AFBD00' }}
              >
                {editingTask ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Task List Block (design-specific, uses #AFBD00 accent) --- */

function DesignTaskListBlock({
  taskList,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditList,
  onDeleteList,
  busy,
}: {
  taskList: DesignTaskList
  onToggleTask: (id: string) => void
  onAddTask: () => void
  onEditTask: (task: DesignTask) => void
  onDeleteTask: (id: string) => void
  onEditList: () => void
  onDeleteList: () => void
  busy?: boolean
}) {
  const [showCompleted, setShowCompleted] = useState(false)
  const pending = taskList.tasks.filter(t => !t.completed)
  const completed = taskList.tasks.filter(t => t.completed)

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#AFBD00' }} />
          <h3 className="text-sm font-semibold text-stone-900">{taskList.name}</h3>
          <span className="text-xs text-stone-400">
            {completed.length}/{taskList.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onAddTask} className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors" title="Ajouter une tâche">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onEditList} className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors" title="Renommer">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDeleteList} className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors" title="Supprimer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        {pending.length === 0 && completed.length === 0 && (
          <p className="text-xs text-stone-400 py-2 text-center">Aucune tâche</p>
        )}

        {pending.map(task => (
          <DesignTaskRow key={task.id} task={task} onToggle={onToggleTask} onEdit={onEditTask} onDelete={onDeleteTask} busy={busy} />
        ))}

        {completed.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 py-1 transition-colors"
            >
              {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {completed.length} terminée{completed.length > 1 ? 's' : ''}
            </button>
            {showCompleted && completed.map(task => (
              <DesignTaskRow key={task.id} task={task} onToggle={onToggleTask} onEdit={onEditTask} onDelete={onDeleteTask} busy={busy} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DesignTaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  busy,
}: {
  task: DesignTask
  onToggle: (id: string) => void
  onEdit: (task: DesignTask) => void
  onDelete: (id: string) => void
  busy?: boolean
}) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date()

  return (
    <div className={`group flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-stone-50 transition-colors ${task.completed ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(task.id)}
        disabled={busy}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-[#AFBD00] border-[#AFBD00] text-white'
            : 'border-stone-300 hover:border-[#AFBD00]'
        }`}
      >
        {task.completed && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button onClick={() => onEdit(task)} className="text-left w-full">
          <span className={`text-sm ${task.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
            {task.name}
          </span>
        </button>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.assigneeName && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              <User className="w-3 h-3" />
              {task.assigneeName}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
        title="Supprimer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
