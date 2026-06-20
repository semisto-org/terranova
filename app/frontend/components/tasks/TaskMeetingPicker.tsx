import React, { useEffect, useRef, useState } from 'react'
import { CalendarClock, ChevronDown, X, Check } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { Task } from './types'

// « Amener en réunion » (#37) — sélecteur auto-suffisant qui rattache une tâche
// à une réunion (FK simple `event_id` : une tâche = une seule réunion). Charge
// les réunions à venir auxquelles le membre courant est convié, PATCH la tâche,
// puis notifie le parent via onChanged (pour rafraîchir la liste).

interface MeetingOption {
  id: string
  title: string
  type: string
  startDate: string
  location: string
}

interface TaskMeetingPickerProps {
  task: Task
  accentColor?: string
  onChanged?: (task: Task) => void
}

const fmtMeeting = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function TaskMeetingPicker({ task, accentColor = '#5B5781', onChanged }: TaskMeetingPickerProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<MeetingOption[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // État local optimiste : le sélecteur reflète le lien même si le parent ne
  // re-pousse pas les props après le PATCH.
  const [linkedId, setLinkedId] = useState<string | null>(task.eventId || null)
  const [linkedTitle, setLinkedTitle] = useState<string | null>(task.eventTitle || null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLinkedId(task.eventId || null)
    setLinkedTitle(task.eventTitle || null)
  }, [task.id, task.eventId, task.eventTitle])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    apiRequest('/api/v1/tasks/meeting-options')
      .then((res: any) => setOptions(res?.items || []))
      .catch(() => setError('Impossible de charger les réunions.'))
      .finally(() => setLoading(false))
  }, [open])

  const link = async (eventId: string | null) => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const updated: any = await apiRequest(`/api/v1/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ event_id: eventId ?? '' }),
      })
      setLinkedId(updated?.eventId || null)
      setLinkedTitle(updated?.eventTitle || null)
      onChanged?.(updated)
      setOpen(false)
    } catch {
      setError("Le rattachement a échoué.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Réunion</span>
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-left text-stone-700 hover:bg-white hover:border-stone-300 transition-colors"
          >
            <CalendarClock className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="flex-1 truncate">
              {linkedTitle ? linkedTitle : <span className="text-stone-400">Amener en réunion…</span>}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {linkedId && (
            <button
              type="button"
              onClick={() => link(null)}
              disabled={saving}
              title="Retirer de la réunion"
              className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-stone-200 bg-white shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto py-1.5">
              {loading ? (
                <p className="px-3.5 py-2 text-xs text-stone-400">Chargement…</p>
              ) : error ? (
                <p className="px-3.5 py-2 text-xs text-red-600">{error}</p>
              ) : options.length === 0 ? (
                <p className="px-3.5 py-2.5 text-xs text-stone-400">
                  Aucune réunion à venir où tu es convié·e.
                </p>
              ) : (
                options.map((opt) => {
                  const isLinked = opt.id === linkedId
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => link(opt.id)}
                      disabled={saving}
                      className={`w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                        isLinked ? 'bg-stone-50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <CalendarClock className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-stone-800 truncate">{opt.title}</span>
                        <span className="block text-xs text-stone-400">
                          {opt.type} · {fmtMeeting(opt.startDate)}
                        </span>
                      </span>
                      {isLinked && <Check className="w-4 h-4 shrink-0" style={{ color: accentColor }} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
