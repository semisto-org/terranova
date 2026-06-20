import React from 'react'
import { X, MapPin, Calendar, Users, ListChecks } from 'lucide-react'
import type { Member } from '../types'

// Fiche d'une réunion (#37) — remplace le dump JSON générique pour les events.
// Affiche les infos clés + l'ordre du jour : les tâches qui y ont été amenées.

interface AgendaTask {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  assigneeName: string | null
  projectName: string | null
}

interface EventDetailData {
  id: string
  title: string
  type: string
  startDate: string
  endDate: string
  allDay?: boolean
  location?: string
  description?: string
  attendeeIds: string[]
  tasks?: AgendaTask[]
}

interface EventDetailModalProps {
  event: EventDetailData
  members: Member[]
  onClose: () => void
}

const STATUS_LABEL: Record<AgendaTask['status'], string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminée',
}

function formatRange(startISO: string, endISO: string, allDay?: boolean): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  const sameDay = start.toDateString() === end.toDateString()
  if (allDay) {
    return sameDay
      ? start.toLocaleDateString('fr-FR', dateOpts)
      : `${start.toLocaleDateString('fr-FR', dateOpts)} → ${end.toLocaleDateString('fr-FR', dateOpts)}`
  }
  if (sameDay) {
    return `${start.toLocaleDateString('fr-FR', dateOpts)} · ${start.toLocaleTimeString('fr-FR', timeOpts)} – ${end.toLocaleTimeString('fr-FR', timeOpts)}`
  }
  return `${start.toLocaleDateString('fr-FR', dateOpts)} ${start.toLocaleTimeString('fr-FR', timeOpts)} → ${end.toLocaleDateString('fr-FR', dateOpts)} ${end.toLocaleTimeString('fr-FR', timeOpts)}`
}

export function EventDetailModal({ event, members, onClose }: EventDetailModalProps) {
  const attendees = members.filter((m) => event.attendeeIds.includes(m.id))
  const tasks = event.tasks || []

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
              {event.type || 'Événement'}
            </span>
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight mt-1.5">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <span>{formatRange(event.startDate, event.endDate, event.allDay)}</span>
            </li>
            {event.location && (
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <span>{event.location}</span>
              </li>
            )}
            {attendees.length > 0 && (
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <span>{attendees.map((m) => `${m.firstName} ${m.lastName}`.trim()).join(', ')}</span>
              </li>
            )}
          </ul>

          {event.description && (
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{event.description}</p>
          )}

          {/* Ordre du jour (#37) */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />
              Ordre du jour{tasks.length > 0 ? ` (${tasks.length})` : ''}
            </span>
            {tasks.length === 0 ? (
              <p className="text-xs text-stone-400">
                Aucune tâche amenée à cette réunion. Depuis une tâche, utilise « Amener en réunion ».
              </p>
            ) : (
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-2.5 rounded-lg border border-stone-200 px-3 py-2">
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-stone-300'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${task.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-stone-400">
                        {STATUS_LABEL[task.status]}
                        {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                        {task.projectName ? ` · ${task.projectName}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg bg-white text-stone-700 font-medium hover:bg-stone-100 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
