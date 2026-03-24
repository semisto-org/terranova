import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Calendar,
  Users,
  MapPin,
  GraduationCap,
  Euro,
} from 'lucide-react'

const STATUS_LABELS = {
  idea: 'Idée',
  in_construction: 'En construction',
  in_preparation: 'En préparation',
  registrations_open: 'Inscriptions ouvertes',
  in_progress: 'En cours',
  post_production: 'En post-prod',
  completed: 'Clôturée',
  cancelled: 'Annulée',
}

const STATUS_BADGE = {
  idea: 'bg-amber-50 text-amber-700 border-amber-200',
  in_construction: 'bg-violet-50 text-violet-700 border-violet-200',
  in_preparation: 'bg-blue-50 text-blue-700 border-blue-200',
  registrations_open: 'bg-green-50 text-green-700 border-green-200',
  in_progress: 'bg-[#B01A19]/10 text-[#8f1514] border-[#B01A19]/30',
  post_production: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-stone-200 text-stone-700 border-stone-300',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
}

const STATUS_LEFT_BORDER = {
  idea: 'border-l-amber-400',
  in_construction: 'border-l-violet-400',
  in_preparation: 'border-l-blue-400',
  registrations_open: 'border-l-green-500',
  in_progress: 'border-l-[#B01A19]',
  post_production: 'border-l-teal-400',
  completed: 'border-l-stone-400',
  cancelled: 'border-l-rose-400',
}

const READINESS_ICON_MAP = {
  date: Calendar,
  location: MapPin,
  trainer: GraduationCap,
  price: Euro,
}

const PREPARATION_STATUSES = ['in_construction', 'in_preparation']

function formatDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })
}

export default function KanbanTrainingCard({
  training,
  trainingType,
  nextSession,
  registrationsCount,
  maxParticipants,
  readinessChecks = [],
  allReady,
  isUrgent,
  onView,
  isDragOverlay = false,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: training.id,
    data: { training },
    disabled: isDragOverlay,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const fillPercent = maxParticipants > 0 ? Math.round((registrationsCount / maxParticipants) * 100) : 0
  const fillColor = fillPercent >= 60 ? 'bg-emerald-500' : fillPercent >= 30 ? 'bg-amber-500' : 'bg-rose-500'
  const dateStr = formatDate(nextSession?.startDate)
  const showReadiness = PREPARATION_STATUSES.includes(training.status)
  const isEarlyStage = training.status === 'idea' || training.status === 'in_construction'

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
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2">
            {training.title}
          </h3>
        </div>

        {/* Type badge */}
        {trainingType && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 truncate max-w-[160px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: trainingType.color || '#6B7280' }}
              />
              {trainingType.name}
            </span>
          </div>
        )}

        {/* Metrics */}
        <div className="space-y-2">
          {/* Date — hidden for idea & in_construction */}
          {!isEarlyStage && (
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
          )}

          {/* Participants fill bar — hidden for idea & in_construction */}
          {!isEarlyStage && (
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
          )}

          {/* Readiness checks — only for preparation statuses */}
          {showReadiness && readinessChecks.length > 0 && (
            <div className="flex items-center gap-1 pt-0.5">
              {readinessChecks.map((check) => {
                const Icon = READINESS_ICON_MAP[check.id]
                if (!Icon) return null
                return (
                  <div
                    key={check.id}
                    className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                      check.done
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-rose-50 text-rose-400'
                    }`}
                    title={`${check.label} : ${check.done ? 'OK' : 'Manquant'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )
              })}
              {allReady && (
                <span className="ml-auto text-[10px] font-semibold text-emerald-600">Prêt</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
