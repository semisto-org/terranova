import React, { forwardRef, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
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
import { TaskRow } from './TaskRow'
import { SortableTaskRow } from './SortableTaskRow'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { Task, MemberOption } from './types'

interface TaskListBlockProps {
  id: string
  name: string
  tasks: Task[]
  onToggleTask: (taskId: string) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onAddTask?: (taskListId: string) => void
  onEditList?: (id: string, name: string) => void
  onDeleteList?: (id: string) => void
  onReorderTasks?: (taskListId: string, orderedIds: string[]) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
  dragHandleProps?: Record<string, any>
  isDragging?: boolean
  style?: React.CSSProperties
}

export const TaskListBlock = forwardRef<HTMLDivElement, TaskListBlockProps>(function TaskListBlock({
  id,
  name,
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onEditList,
  onDeleteList,
  onReorderTasks,
  busy,
  accentColor = '#5B5781',
  members = [],
  dragHandleProps,
  isDragging = false,
  style,
}, ref) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  React.useEffect(() => { setLocalTasks(null) }, [tasks])

  const effectiveTasks = localTasks ?? tasks
  const pendingTasks = useMemo(() => effectiveTasks.filter(t => t.status !== 'completed'), [effectiveTasks])
  const completedTasks = useMemo(() => effectiveTasks.filter(t => t.status === 'completed'), [effectiveTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const taskIds = useMemo(() => pendingTasks.map(t => t.id), [pendingTasks])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = effectiveTasks.findIndex(t => t.id === String(active.id))
    const newIndex = effectiveTasks.findIndex(t => t.id === String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(effectiveTasks, oldIndex, newIndex)
    setLocalTasks(reordered)
    onReorderTasks?.(id, reordered.map(t => t.id))
  }

  const completedCount = completedTasks.length
  const totalCount = effectiveTasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div
      ref={ref}
      style={style}
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
        isDragging
          ? 'shadow-xl border-stone-300 ring-2 ring-stone-200/60 scale-[1.01] z-50 opacity-95'
          : 'border-stone-200 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 group">
        <div className="flex items-center gap-3 min-w-0">
          {dragHandleProps && (
            <button
              type="button"
              {...dragHandleProps}
              className="flex items-center justify-center w-5 h-8 -ml-1 rounded cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
              aria-label="Réorganiser la liste"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-lg font-semibold text-stone-900 truncate">{name}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-stone-400 tabular-nums">
              {completedCount}/{totalCount}
            </span>
            {totalCount > 0 && (
              <div className="w-12 h-1 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progress === 100 ? '#10b981' : accentColor,
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onAddTask && (
            <button
              onClick={() => onAddTask(id)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              title="Ajouter une tâche"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {onEditList && (
            <button
              onClick={() => onEditList(id, name)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
              title="Renommer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDeleteList && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
              title="Supprimer la liste"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active tasks */}
      <div className="px-4 py-1.5">
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-xs text-stone-400 py-4 text-center">Aucune tâche</p>
        )}

        {onReorderTasks && pendingTasks.length > 1 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {pendingTasks.map(task => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  busy={busy}
                  accentColor={accentColor}
                  members={members}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          pendingTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              busy={busy}
              accentColor={accentColor}
              members={members}
            />
          ))
        )}
      </div>

      {/* Completed tasks (collapsible) */}
      {completedTasks.length > 0 && (
        <div className="border-t border-stone-100">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center gap-2 px-5 py-2.5 text-xs text-stone-400 hover:text-stone-500 transition-colors"
          >
            {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {completedTasks.length} terminée{completedTasks.length > 1 ? 's' : ''}
          </button>
          {showCompleted && (
            <div className="px-4 pb-2">
              {completedTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  busy={busy}
                  accentColor={accentColor}
                  members={members}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick add footer */}
      {onAddTask && (
        <div className="px-4 py-2.5 border-t border-stone-100">
          <button
            onClick={() => onAddTask(id)}
            className="px-4 py-1.5 text-xs text-stone-400 hover:text-stone-600 hover:border-stone-400 border border-stone-200 rounded-full transition-colors"
          >
            Ajouter une tâche
          </button>
        </div>
      )}

      {showDeleteConfirm && onDeleteList && (
        <ConfirmDeleteModal
          title="Supprimer cette liste ?"
          message={`« ${name} » et toutes ses tâches seront définitivement supprimées.`}
          onConfirm={() => { onDeleteList(id); setShowDeleteConfirm(false) }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
})
