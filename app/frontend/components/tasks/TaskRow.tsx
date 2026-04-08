import React, { forwardRef, useMemo, useState } from 'react'
import { Calendar, Clock, GripVertical, Pencil, Trash2 } from 'lucide-react'
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal'
import type { Task, MemberOption } from './types'
import { STATUS_NEXT } from './types'

interface TaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
  dragHandleProps?: Record<string, any>
  isDragging?: boolean
  style?: React.CSSProperties
}

const STATUS_SPIN_STYLES = `
@keyframes taskStatusSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes taskStatusPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
`

function StatusCheckbox({ status, accentColor, onClick, disabled }: {
  status: Task['status']
  accentColor: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-200 relative"
      style={{
        backgroundColor: status === 'completed' ? accentColor : 'transparent',
        borderWidth: status === 'in_progress' ? 0 : status === 'completed' ? 0 : 2,
        borderStyle: 'solid',
        borderColor: status === 'completed' ? accentColor : '#d6d3d1',
        color: status === 'completed' ? 'white' : 'transparent',
      }}
      onMouseEnter={e => {
        if (status === 'pending') (e.currentTarget as HTMLElement).style.borderColor = accentColor
      }}
      onMouseLeave={e => {
        if (status === 'pending') (e.currentTarget as HTMLElement).style.borderColor = '#d6d3d1'
      }}
    >
      {status === 'completed' && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'in_progress' && (
        <>
          <style>{STATUS_SPIN_STYLES}</style>
          <svg
            className="absolute inset-0 w-5 h-5"
            viewBox="0 0 20 20"
            fill="none"
            style={{ animation: 'taskStatusSpin 2s linear infinite' }}
          >
            <circle
              cx="10" cy="10" r="7.5"
              stroke={accentColor}
              strokeWidth="2"
              strokeDasharray="12 35"
              strokeLinecap="round"
              style={{ animation: 'taskStatusPulse 2s ease-in-out infinite' }}
            />
          </svg>
        </>
      )}
    </button>
  )
}

const PRIORITY_DOTS: Record<string, number> = { low: 1, medium: 2, high: 3 }

export const TaskRow = forwardRef<HTMLDivElement, TaskRowProps>(function TaskRow(
  { task, onToggle, onEdit, onDelete, busy, accentColor = '#5B5781', members = [], dragHandleProps, isDragging = false, style },
  ref
) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isOverdue = task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date()
  const dots = task.priority ? PRIORITY_DOTS[task.priority] || 0 : 0

  const assigneeMember = useMemo(
    () => task.assigneeId
      ? members.find(m => m.id === task.assigneeId)
      : task.assigneeName
        ? members.find(m => `${m.firstName} ${m.lastName}` === task.assigneeName || m.firstName === task.assigneeName)
        : null,
    [task.assigneeId, task.assigneeName, members]
  )

  const displayName = assigneeMember
    ? assigneeMember.firstName
    : task.assigneeName

  const avatarUrl = assigneeMember?.avatar || task.assigneeAvatar

  return (
    <div
      ref={ref}
      style={style}
      className={`group flex items-start gap-3 py-2.5 px-1 rounded-lg transition-all ${
        isDragging
          ? 'bg-white shadow-lg ring-1 ring-stone-200 scale-[1.01] z-50'
          : 'hover:bg-stone-50/80'
      } ${task.status === 'completed' ? 'opacity-50' : ''}`}
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
        status={task.status}
        accentColor={accentColor}
        onClick={() => onToggle(task.id)}
        disabled={busy}
      />

      <div className="flex-1 min-w-0">
        <button onClick={() => onEdit?.(task)} className="text-left w-full">
          <span className={`text-sm leading-snug ${
            task.status === 'completed'
              ? 'line-through text-stone-400'
              : task.status === 'in_progress'
                ? 'text-stone-900 font-medium'
                : 'text-stone-900'
          }`}>
            {task.name}
          </span>
        </button>

        {task.description && task.status !== 'completed' && (
          <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{task.description}</p>
        )}

        <div className="flex items-center gap-2.5 mt-1 flex-wrap">
          {displayName && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium"
                  style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                >
                  {displayName[0]?.toUpperCase()}
                </span>
              )}
              {displayName}
            </span>
          )}
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-stone-500'}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.timeMinutes != null && task.timeMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              <Clock className="w-3 h-3" />
              {task.timeMinutes}min
            </span>
          )}
          {dots > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
              {Array.from({ length: dots }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
              ))}
            </span>
          )}
          {task.tags?.map(tag => (
            <span key={tag} className="text-[11px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true) }}
            disabled={busy}
            className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDeleteConfirm && onDelete && (
        <ConfirmDeleteModal
          title="Supprimer cette tâche ?"
          message={`« ${task.name} » sera définitivement supprimée.`}
          onConfirm={() => { onDelete(task.id); setShowDeleteConfirm(false) }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
})
