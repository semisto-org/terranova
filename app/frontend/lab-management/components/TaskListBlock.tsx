import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { ActionRow, type ActionItem } from './ActionRow'
import type { MemberOption } from './MemberPicker'

interface TaskListBlockProps {
  id: string
  name: string
  actions: ActionItem[]
  onToggleAction: (actionId: string) => void
  onEditAction?: (action: ActionItem) => void
  onAddAction?: (taskListId: string) => void
  onEditList?: (id: string, name: string) => void
  onDeleteList?: (id: string) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
}

export function TaskListBlock({
  id,
  name,
  actions,
  onToggleAction,
  onEditAction,
  onAddAction,
  onEditList,
  onDeleteList,
  busy,
  accentColor = '#5B5781',
  members = [],
}: TaskListBlockProps) {
  const [showCompleted, setShowCompleted] = useState(false)

  const pending = actions.filter(a => !a.completed)
  const completed = actions.filter(a => a.completed)
  const completedCount = completed.length
  const totalCount = actions.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 group">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
          <h3 className="text-sm font-semibold text-stone-900 truncate">{name}</h3>
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
              onClick={() => onDeleteList(id)}
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
        {pending.length === 0 && completedCount === 0 && (
          <p className="text-xs text-stone-400 py-4 text-center">Aucune tâche</p>
        )}

        {pending.map(action => (
          <ActionRow
            key={action.id}
            action={action}
            onToggle={onToggleAction}
            onEdit={onEditAction}
            busy={busy}
            accentColor={accentColor}
            members={members}
          />
        ))}

        {completedCount > 0 && (
          <div className="mt-1 mb-1">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 py-1.5 transition-colors"
            >
              {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>{completedCount} terminée{completedCount > 1 ? 's' : ''}</span>
            </button>
            {showCompleted && (
              <div className="animate-[fadeIn_200ms_ease-out]">
                {completed.map(action => (
                  <ActionRow
                    key={action.id}
                    action={action}
                    onToggle={onToggleAction}
                    onEdit={onEditAction}
                    busy={busy}
                    accentColor={accentColor}
                    members={members}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick add footer */}
      {onAddAction && pending.length > 0 && (
        <button
          onClick={() => onAddAction(id)}
          className="w-full px-5 py-2.5 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 border-t border-stone-100 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Ajouter une tâche
        </button>
      )}
    </div>
  )
}
