import React, { useMemo } from 'react'
import { Calendar, Clock, Star } from 'lucide-react'
import type { MemberOption } from './MemberPicker'

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
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
}

export function ActionRow({ action, onToggle, onEdit, busy, accentColor = '#5B5781', members = [] }: ActionRowProps) {
  const isOverdue = action.dueDate && !action.completed && new Date(action.dueDate) < new Date()
  const priorityStars = action.priority === 'ⓄⓄⓄ' ? 3 : action.priority === 'ⓄⓄ' ? 2 : action.priority === 'Ⓞ' ? 1 : 0

  const assigneeMember = useMemo(
    () => action.assigneeName ? members.find(m => `${m.firstName} ${m.lastName}` === action.assigneeName || m.firstName === action.assigneeName) : null,
    [action.assigneeName, members]
  )

  return (
    <div
      className={`group flex items-start gap-3 py-2.5 px-1 rounded-lg hover:bg-stone-50/80 transition-colors ${action.completed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggle(action.id)}
        disabled={busy}
        className="mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: action.completed ? accentColor : 'transparent',
          borderColor: action.completed ? accentColor : '#d6d3d1',
          color: action.completed ? 'white' : 'transparent',
        }}
        onMouseEnter={e => {
          if (!action.completed) (e.currentTarget as HTMLElement).style.borderColor = accentColor
        }}
        onMouseLeave={e => {
          if (!action.completed) (e.currentTarget as HTMLElement).style.borderColor = '#d6d3d1'
        }}
      >
        {action.completed && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit?.(action)}
          className="text-left w-full"
        >
          <span className={`text-sm leading-snug ${action.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
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
    </div>
  )
}
