import React, { forwardRef, useMemo, useState } from 'react'
import { Calendar, Clock, GripVertical, Star, Trash2 } from 'lucide-react'
import type { MemberOption } from './MemberPicker'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'

export interface ActionItem {
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

interface ActionRowProps {
  action: ActionItem
  onToggle: (id: string) => void
  onEdit?: (action: ActionItem) => void
  onDelete?: (id: string) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
  dragHandleProps?: Record<string, any>
  isDragging?: boolean
  style?: React.CSSProperties
}

const STATUS_CYCLE_STYLES = `
@keyframes inProgressSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes inProgressPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
`

function StatusCheckbox({ status, accentColor, onClick, disabled }: {
  status: string
  accentColor: string
  onClick: () => void
  disabled?: boolean
}) {
  const isInProgress = status === 'En cours'
  const isCompleted = status === 'Terminé'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 relative"
      style={{
        backgroundColor: isCompleted ? accentColor : 'transparent',
        borderWidth: isInProgress ? 0 : isCompleted ? 0 : 2,
        borderStyle: 'solid',
        borderColor: isCompleted ? accentColor : '#d6d3d1',
        color: isCompleted ? 'white' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!isCompleted && !isInProgress) (e.currentTarget as HTMLElement).style.borderColor = accentColor
      }}
      onMouseLeave={e => {
        if (!isCompleted && !isInProgress) (e.currentTarget as HTMLElement).style.borderColor = '#d6d3d1'
      }}
    >
      {/* Completed: checkmark */}
      {isCompleted && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {/* In progress: animated arc */}
      {isInProgress && (
        <>
          <style>{STATUS_CYCLE_STYLES}</style>
          <svg
            className="absolute inset-0 w-5 h-5"
            viewBox="0 0 20 20"
            fill="none"
            style={{ animation: 'inProgressSpin 2s linear infinite' }}
          >
            <circle
              cx="10" cy="10" r="7.5"
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="12 35"
              strokeLinecap="round"
              style={{ animation: 'inProgressPulse 2s ease-in-out infinite' }}
            />
          </svg>
        </>
      )}
    </button>
  )
}

export const ActionRow = forwardRef<HTMLDivElement, ActionRowProps>(function ActionRow({ action, onToggle, onEdit, onDelete, busy, accentColor = '#5B5781', members = [], dragHandleProps, isDragging = false, style }, ref) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isOverdue = action.dueDate && !action.completed && new Date(action.dueDate) < new Date()
  const priorityStars = action.priority === 'ⓄⓄⓄ' ? 3 : action.priority === 'ⓄⓄ' ? 2 : action.priority === 'Ⓞ' ? 1 : 0
  const isInProgress = action.status === 'En cours'

  const assigneeMember = useMemo(
    () => action.assigneeName ? members.find(m => `${m.firstName} ${m.lastName}` === action.assigneeName || m.firstName === action.assigneeName) : null,
    [action.assigneeName, members]
  )

  return (
    <div
      ref={ref}
      style={style}
      className={`group flex items-start gap-3 py-2.5 px-1 rounded-lg transition-all ${
        isDragging
          ? 'bg-white shadow-lg ring-1 ring-stone-200 scale-[1.01] z-50'
          : 'hover:bg-stone-50/80'
      } ${action.completed ? 'opacity-50' : ''}`}
    >
      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps}
          className="mt-0.5 flex items-center justify-center w-5 h-5 rounded cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 touch-none"
          aria-label="Réorganiser la tâche"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}

      <StatusCheckbox
        status={action.status}
        accentColor={accentColor}
        onClick={() => onToggle(action.id)}
        disabled={busy}
      />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit?.(action)}
          className="text-left w-full"
        >
          <span className={`text-sm leading-snug ${
            action.completed
              ? 'line-through text-stone-400'
              : isInProgress
                ? 'text-stone-900 font-medium'
                : 'text-stone-900'
          }`}>
            {action.name}
          </span>
        </button>

        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          {action.assigneeName && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              {assigneeMember?.avatar ? (
                <img src={assigneeMember.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : assigneeMember ? (
                <span className="w-4 h-4 rounded-full bg-[#5B5781]/10 text-[#5B5781] flex items-center justify-center text-[8px] font-medium">
                  {assigneeMember.firstName[0]}{assigneeMember.lastName[0]}
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-[8px] font-medium">
                  {action.assigneeName[0]?.toUpperCase()}
                </span>
              )}
              {assigneeMember ? assigneeMember.firstName : action.assigneeName}
            </span>
          )}
          {action.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
              <Calendar className="w-3 h-3" />
              {new Date(action.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {action.timeMinutes != null && action.timeMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              <Clock className="w-3 h-3" />
              {action.timeMinutes}min
            </span>
          )}
          {priorityStars > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
              {Array.from({ length: priorityStars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </span>
          )}
          {action.tags?.map(tag => (
            <span key={tag} className="text-[11px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteConfirm(true)
          }}
          disabled={busy}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all flex-shrink-0"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {showDeleteConfirm && onDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette tâche ?"
          message={`« ${action.name} » sera définitivement supprimée.`}
          onConfirm={() => {
            onDelete(action.id)
            setShowDeleteConfirm(false)
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
})
