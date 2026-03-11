import React, { forwardRef, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
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
import { ActionRow, type ActionItem } from './ActionRow'
import { SortableActionRow } from './SortableActionRow'
import type { MemberOption } from './MemberPicker'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

interface TaskListBlockProps {
  id: string
  name: string
  actions: ActionItem[]
  onToggleAction: (actionId: string) => void
  onEditAction?: (action: ActionItem) => void
  onDeleteAction?: (actionId: string) => void
  onAddAction?: (taskListId: string) => void
  onEditList?: (id: string, name: string) => void
  onDeleteList?: (id: string) => void
  onReorderActions?: (taskListId: string, orderedIds: string[]) => void
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
  actions,
  onToggleAction,
  onEditAction,
  onDeleteAction,
  onAddAction,
  onEditList,
  onDeleteList,
  onReorderActions,
  busy,
  accentColor = '#5B5781',
  members = [],
  dragHandleProps,
  isDragging = false,
  style,
}, ref) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localActions, setLocalActions] = useState<ActionItem[] | null>(null)

  // Clear optimistic state when parent props update (after API refresh)
  React.useEffect(() => {
    setLocalActions(null)
  }, [actions])

  const effectiveActions = localActions ?? actions

  const actionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const actionIds = useMemo(() => effectiveActions.map(a => a.id), [effectiveActions])

  function handleActionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = effectiveActions.findIndex(a => a.id === String(active.id))
    const newIndex = effectiveActions.findIndex(a => a.id === String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(effectiveActions, oldIndex, newIndex)
    setLocalActions(reordered)
    onReorderActions?.(id, reordered.map(a => a.id))
  }
  const completedCount = effectiveActions.filter(a => a.completed).length
  const totalCount = effectiveActions.length
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
          {dragHandleProps ? (
            <button
              type="button"
              {...dragHandleProps}
              className="flex items-center justify-center w-5 h-8 -ml-1 rounded cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
              aria-label="Réorganiser la liste"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : null}
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
          {onAddAction && (
            <button
              onClick={() => onAddAction(id)}
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

      {/* Body */}
      <div className="px-4 py-1.5">
        {totalCount === 0 && (
          <p className="text-xs text-stone-400 py-4 text-center">Aucune tâche</p>
        )}

        {onReorderActions && totalCount > 1 ? (
          <DndContext
            sensors={actionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleActionDragEnd}
          >
            <SortableContext items={actionIds} strategy={verticalListSortingStrategy}>
              {effectiveActions.map(action => (
                <SortableActionRow
                  key={action.id}
                  action={action}
                  onToggle={onToggleAction}
                  onEdit={onEditAction}
                  onDelete={onDeleteAction}
                  busy={busy}
                  accentColor={accentColor}
                  members={members}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          effectiveActions.map(action => (
            <ActionRow
              key={action.id}
              action={action}
              onToggle={onToggleAction}
              onEdit={onEditAction}
              onDelete={onDeleteAction}
              busy={busy}
              accentColor={accentColor}
              members={members}
            />
          ))
        )}
      </div>

      {/* Quick add footer */}
      {onAddAction && (
        <div className="px-4 py-2.5 border-t border-stone-100">
          <button
            onClick={() => onAddAction(id)}
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
          onConfirm={() => {
            onDeleteList(id)
            setShowDeleteConfirm(false)
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
})
