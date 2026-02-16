import React, { useState, useRef, useEffect } from 'react'
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, GripVertical, Check } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function buildOldToNewIndexMap(length, fromIndex, toIndex) {
  const map = {}
  for (let i = 0; i < length; i++) {
    if (i === fromIndex) {
      map[i] = toIndex
    } else if (fromIndex < toIndex) {
      map[i] = i > fromIndex && i <= toIndex ? i - 1 : i
    } else {
      map[i] = i >= toIndex && i < fromIndex ? i + 1 : i
    }
  }
  return map
}

function ChecklistSortableRow({
  id,
  index,
  item,
  isChecked,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onRemove,
}) {
  const inputRef = useRef(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-lg border bg-white p-4 transition-all ${
        isDragging
          ? 'z-50 border-[#B01A19] shadow-lg shadow-[#B01A19]/15 opacity-95'
          : 'border-stone-200 hover:border-stone-300'
      } ${isChecked ? 'opacity-80' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Réorganiser : ${item}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="shrink-0 rounded p-0.5 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20"
        aria-label={isChecked ? 'Décocher' : 'Cocher'}
      >
        {isChecked ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Circle className="w-5 h-5 text-stone-400" />
        )}
      </button>

      {isEditing ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={editDraft}
            onChange={(e) => onEditDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
            className="flex-1 min-w-0 rounded-lg border border-[#B01A19] px-3 py-1.5 text-sm text-stone-900 focus:ring-2 focus:ring-[#B01A19]/20 focus:outline-none"
            aria-label="Nouveau libellé"
          />
          <button
            type="button"
            onClick={onSaveEdit}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#B01A19] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#8f1514] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30"
            aria-label="Enregistrer"
          >
            <Check className="w-4 h-4" />
            Enregistrer
          </button>
        </>
      ) : (
        <p
          role="button"
          tabIndex={0}
          onDoubleClick={() => onStartEdit(index)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onStartEdit(index)
            }
          }}
          className={`flex-1 min-w-0 text-left text-stone-900 cursor-text select-text rounded px-1 -mx-1 hover:bg-stone-50 ${
            isChecked ? 'line-through text-stone-500' : ''
          }`}
          title="Double-cliquer pour modifier"
        >
          {item}
        </p>
      )}

      {!isEditing && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="shrink-0 rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function TrainingChecklistTab({
  checklistItems = [],
  checkedItems = [],
  onToggleChecklistItem,
  onAddChecklistItem,
  onRemoveChecklistItem,
  onReorderChecklist,
}) {
  const [newItem, setNewItem] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editingDraft, setEditingDraft] = useState('')

  const progress =
    checklistItems.length > 0
      ? Math.round((checkedItems.length / checklistItems.length) * 100)
      : 0

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddChecklistItem?.(newItem.trim())
      setNewItem('')
      setIsAdding(false)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over == null || active.id === over.id) return
    const oldIndex = Number(active.id)
    const overIndex = Number(over.id)
    if (oldIndex < 0 || oldIndex >= checklistItems.length || overIndex < 0 || overIndex >= checklistItems.length) return
    const newOrder = arrayMove(checklistItems, oldIndex, overIndex)
    const oldToNew = buildOldToNewIndexMap(checklistItems.length, oldIndex, overIndex)
    const newChecked = [...new Set(checkedItems.map((i) => oldToNew[i]).filter((i) => i != null))].sort((a, b) => a - b)
    onReorderChecklist?.(newOrder, newChecked)
  }

  const handleStartEdit = (index) => {
    setEditingIndex(index)
    setEditingDraft(checklistItems[index] ?? '')
  }

  const handleSaveEdit = () => {
    if (editingIndex == null) return
    const trimmed = editingDraft.trim()
    if (trimmed === '') return
    const newList = checklistItems.map((item, i) => (i === editingIndex ? trimmed : item))
    onReorderChecklist?.(newList, checkedItems)
    setEditingIndex(null)
    setEditingDraft('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingDraft('')
  }

  const sortableIds = checklistItems.map((_, i) => i)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Checklist</h3>
          <p className="text-sm text-stone-500 mt-1">Suivi des actions à effectuer</p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Ajouter une action
          </button>
        )}
      </div>

      {checklistItems.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-900">Progression</span>
            <span className="text-sm text-stone-500">
              {checkedItems.length} / {checklistItems.length}
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#B01A19] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-2">{progress}% complété</p>
        </div>
      )}

      {checklistItems.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <CheckSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Aucune action dans la checklist</p>
          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <Plus className="w-4 h-4" />
              Ajouter une action
            </button>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <ChecklistSortableRow
                  key={`${index}-${item}`}
                  id={index}
                  index={index}
                  item={item}
                  isChecked={checkedItems.includes(index)}
                  isEditing={editingIndex === index}
                  editDraft={editingDraft}
                  onEditDraftChange={setEditingDraft}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onToggle={onToggleChecklistItem}
                  onRemove={onRemoveChecklistItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {checklistItems.length > 0 && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Ajouter une action
        </button>
      )}

      {isAdding && (
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nouvelle action à effectuer..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewItem('')
                }
              }}
              className="flex-1 min-w-[200px] rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-[#B01A19] focus:ring-2 focus:ring-[#B01A19]/10 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-lg bg-[#B01A19] px-4 py-2 text-sm font-medium text-white hover:bg-[#8f1514]"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setNewItem('')
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
