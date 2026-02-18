import { useState } from 'react'
import { Calendar, Plus, MapPin, Clock, Trash2 } from 'lucide-react'
import type { Meeting } from '../../types'
import { EmptyState } from '../shared/EmptyState'

interface MeetingsTabProps {
  meetings: Meeting[]
  onAddMeeting: (values: {
    title: string
    date: string
    time: string
    duration: number
    location?: string
  }) => void
  onDeleteMeeting: (id: string) => void
}

export function MeetingsTab({
  meetings,
  onAddMeeting,
  onDeleteMeeting,
}: MeetingsTabProps) {
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    duration: 60,
    location: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddMeeting(form)
    setForm((p) => ({ ...p, title: '', location: '' }))
  }

  const sortedMeetings = [...meetings].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() -
      new Date(`${b.date}T${b.time}`).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#AFBD00]" />
          Planifier une réunion
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            type="text"
            placeholder="Titre"
            value={form.title}
            onChange={(e) =>
              setForm((p) => ({ ...p, title: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm((p) => ({ ...p, date: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) =>
              setForm((p) => ({ ...p, time: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="number"
            min={15}
            step={15}
            placeholder="Durée (min)"
            value={form.duration}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                duration: Number(e.target.value || 60),
              }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Lieu"
            value={form.location}
            onChange={(e) =>
              setForm((p) => ({ ...p, location: e.target.value }))
            }
            className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent lg:col-span-1"
          />
          <div className="sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
            >
              Planifier
            </button>
          </div>
        </form>
      </div>

      {sortedMeetings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10 text-stone-400" />}
          title="Aucune réunion planifiée"
          description="Planifiez des réunions client ou d’équipe."
        />
      ) : (
        <div className="space-y-3">
          {sortedMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-5 flex items-start justify-between gap-4 group"
            >
              <div className="flex gap-4 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-[#e1e6d8] dark:bg-[#AFBD00]/20 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-[#6B7A00] dark:text-[#AFBD00]">
                    {new Date(meeting.date).getDate()}
                  </span>
                  <span className="text-[10px] uppercase text-stone-500 dark:text-stone-400">
                    {new Date(meeting.date).toLocaleDateString('fr-BE', {
                      month: 'short',
                    })}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-stone-900 dark:text-stone-100">
                    {meeting.title}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {meeting.time} · {meeting.duration} min
                    </span>
                    {meeting.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteMeeting(meeting.id)}
                className="p-2 text-stone-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
