import React, { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Calendar,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
} from 'lucide-react'

const STATUS_LABELS = {
  idea: 'Idee',
  to_organize: 'A organiser',
  in_preparation: 'En preparation',
  to_publish: 'A publier',
  published: 'Publiee',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  post_training: 'Post-formation',
  completed: 'Terminee',
  cancelled: 'Annulee',
}

const STATUS_BADGE = {
  idea: 'bg-amber-50 text-amber-700 border-amber-200',
  to_organize: 'bg-orange-50 text-orange-700 border-orange-200',
  in_preparation: 'bg-blue-50 text-blue-700 border-blue-200',
  to_publish: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  registrations_open: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-[#B01A19]/10 text-[#8f1514] border-[#B01A19]/30',
  post_training: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-stone-200 text-stone-700 border-stone-300',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
}

const STATUS_LEFT_BORDER = {
  idea: 'border-l-amber-400',
  to_organize: 'border-l-orange-400',
  in_preparation: 'border-l-blue-400',
  to_publish: 'border-l-indigo-400',
  published: 'border-l-emerald-400',
  registrations_open: 'border-l-green-500',
  in_progress: 'border-l-[#B01A19]',
  post_training: 'border-l-teal-400',
  completed: 'border-l-stone-400',
  cancelled: 'border-l-rose-400',
}

function formatDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })
}

function ProgressRing({ done, total, size = 18, strokeWidth = 2.5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? done / total : 0
  const offset = circumference * (1 - ratio)
  const color = ratio >= 0.85 ? '#22c55e' : ratio >= 0.5 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} />
      {total > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      )}
    </svg>
  )
}

export default function KanbanTrainingCard({
  training,
  trainingType,
  nextSession,
  registrationsCount,
  maxParticipants,
  doneChecks,
  totalChecks,
  completionRatio,
  isUrgent,
  onView,
  onEdit,
  onDelete,
  isDragOverlay = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: training.id,
    data: { training },
    disabled: isDragOverlay,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const fillPercent = maxParticipants > 0 ? Math.round((registrationsCount / maxParticipants) * 100) : 0
  const fillColor = fillPercent >= 60 ? 'bg-emerald-500' : fillPercent >= 30 ? 'bg-amber-500' : 'bg-rose-500'
  const dateStr = formatDate(nextSession?.startDate)

  if (isDragging && !isDragOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-100/50 h-[120px]"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative rounded-xl border border-stone-200 bg-white border-l-[3px]
        ${STATUS_LEFT_BORDER[training.status] || 'border-l-stone-300'}
        ${isDragOverlay ? 'shadow-2xl ring-2 ring-[#B01A19]/20 rotate-[1.5deg] scale-[1.03]' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-stone-300'}
        transition-all duration-200 cursor-grab active:cursor-grabbing
      `}
      onClick={(e) => {
        if (isDragOverlay) return
        if (e.defaultPrevented) return
        onView?.(training.id)
      }}
    >
      <div className="p-3.5">
        {/* Title + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2">
            {training.title}
          </h3>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-stone-100 transition-all"
            >
              <MoreVertical className="w-3.5 h-3.5 text-stone-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-lg border border-stone-200 bg-white shadow-xl py-1 text-xs">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMenuOpen(false)
                    onView?.(training.id)
                  }}
                >
                  <Eye className="w-3.5 h-3.5" /> Ouvrir
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-50"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMenuOpen(false)
                    onEdit?.(training.id)
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Editer
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete?.(training.id)
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Type + Status badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {trainingType && (
            <span className="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 truncate max-w-[140px]">
              {trainingType.name}
            </span>
          )}
          <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[training.status] || 'bg-stone-100 text-stone-600 border-stone-200'}`}>
            {STATUS_LABELS[training.status] || training.status}
          </span>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center gap-2 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {dateStr ? (
              <span className="text-stone-700 font-medium">{dateStr}</span>
            ) : (
              <span className="text-stone-400 italic">Sans date</span>
            )}
            {isUrgent && (
              <span className="ml-auto flex items-center gap-1 text-amber-600 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Urgent
              </span>
            )}
          </div>

          {/* Participants fill bar */}
          <div className="flex items-center gap-2 text-[11px]">
            <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-700 font-medium tabular-nums">{registrationsCount}/{maxParticipants || '—'}</span>
            {maxParticipants > 0 && (
              <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
                  style={{ width: `${Math.min(fillPercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Checklist progress */}
          {totalChecks > 0 && (
            <div className="flex items-center gap-2 text-[11px]">
              <ProgressRing done={doneChecks} total={totalChecks} />
              <span className="text-stone-600 tabular-nums">{doneChecks}/{totalChecks} checks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
