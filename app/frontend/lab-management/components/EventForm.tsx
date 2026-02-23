import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { apiRequest } from '@/lib/api'
import type { EventType, EventTypeConfig } from '../types'

function toDateInput(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeInput(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function combineDateAndTime(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}`
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'

export interface EventFormProps {
  event?: {
    id: string
    title: string
    type: EventType
    eventTypeId: string
    startDate: string
    endDate: string
    allDay?: boolean
    location: string
    description: string
  } | null
  onSubmit: (values: {
    title: string
    event_type_id: string
    start_date: string
    end_date: string
    all_day: boolean
    location: string
    description: string
  }) => Promise<void>
  onCancel: () => void
  busy?: boolean
}

export function EventForm({
  event,
  onSubmit,
  onCancel,
  busy = false,
}: EventFormProps) {
  const isEdit = Boolean(event)

  const now = new Date()
  const defaultEnd = addMinutes(now, 60)
  const eventStart = event ? new Date(event.startDate) : now
  const eventEnd = event ? new Date(event.endDate) : defaultEnd

  const [title, setTitle] = useState(event?.title ?? '')
  const [eventTypeId, setEventTypeId] = useState<string>(event?.eventTypeId ?? '')
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [startDateStr, setStartDateStr] = useState(() => toDateInput(eventStart))
  const [endDateStr, setEndDateStr] = useState(() => toDateInput(eventEnd))
  const [startTimeStr, setStartTimeStr] = useState(() => toTimeInput(eventStart))
  const [endTimeStr, setEndTimeStr] = useState(() => toTimeInput(eventEnd))
  const [location, setLocation] = useState(event?.location ?? 'Lab')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  // Load event types from API
  useEffect(() => {
    const loadEventTypes = async () => {
      try {
        const response = await apiRequest('/api/v1/lab/event-types')
        const types = response.items || []
        setEventTypes(types)
        // Set default event type if not set
        if (!eventTypeId && types.length > 0) {
          setEventTypeId(types[0].id)
        }
      } catch (err) {
        console.error('Failed to load event types:', err)
      } finally {
        setLoadingTypes(false)
      }
    }
    loadEventTypes()
  }, [])

  // Set event type ID when event changes (for edit mode)
  useEffect(() => {
    if (event?.eventTypeId) {
      setEventTypeId(event.eventTypeId)
    }
  }, [event?.eventTypeId])

  // TipTap editor for description
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: event?.description || '',
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone prose-sm max-w-none px-4 py-3 focus:outline-none min-h-[120px]',
        'data-placeholder': 'Ajoutez des détails, un ordre du jour, ou des notes importantes...',
      },
    },
  })

  // Update editor content when event changes (for edit mode)
  useEffect(() => {
    if (editor && isEdit && event?.description !== undefined) {
      const currentContent = editor.getHTML()
      if (currentContent !== event.description) {
        editor.commands.setContent(event.description || '')
      }
    }
  }, [editor, isEdit, event?.description])

  // Auto-focus title on mount
  useEffect(() => {
    const el = document.getElementById('event-title')
    el?.focus()
  }, [])

  const handleStartDateChange = (newDate: string) => {
    const oldStart = new Date(`${startDateStr}T${startTimeStr}`)
    const oldEnd = new Date(`${endDateStr}T${endTimeStr}`)
    const duration = oldEnd.getTime() - oldStart.getTime()
    setStartDateStr(newDate)
    const newEnd = new Date(new Date(`${newDate}T${startTimeStr}`).getTime() + duration)
    setEndDateStr(toDateInput(newEnd))
    setEndTimeStr(toTimeInput(newEnd))
  }

  const handleStartTimeChange = (newTime: string) => {
    const oldStart = new Date(`${startDateStr}T${startTimeStr}`)
    const oldEnd = new Date(`${endDateStr}T${endTimeStr}`)
    const duration = oldEnd.getTime() - oldStart.getTime()
    setStartTimeStr(newTime)
    const newEnd = new Date(new Date(`${startDateStr}T${newTime}`).getTime() + duration)
    setEndDateStr(toDateInput(newEnd))
    setEndTimeStr(toTimeInput(newEnd))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startISO = allDay
      ? new Date(`${startDateStr}T00:00:00`).toISOString()
      : new Date(combineDateAndTime(startDateStr, startTimeStr)).toISOString()
    const endISO = allDay
      ? new Date(`${endDateStr}T23:59:59`).toISOString()
      : new Date(combineDateAndTime(endDateStr, endTimeStr)).toISOString()
    onSubmit({
      title,
      event_type_id: eventTypeId,
      start_date: startISO,
      end_date: endISO,
      all_day: allDay,
      location,
      description: editor?.getHTML() || '',
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/20 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
          {/* Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-stone-100">
            <h2
              className="text-xl font-bold text-stone-900 tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isEdit ? 'Modifier l\'événement' : 'Créer un événement'}
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {isEdit
                ? 'Mettez à jour les détails de l\'événement'
                : 'Planifiez un nouvel événement pour le calendrier'}
            </p>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="event-title"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2"
              >
                Titre <span className="text-rose-500">*</span>
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputBase}
                placeholder="Ex: Réunion de coordination projet Dupont"
                autoFocus
              />
            </div>

            {/* Event Type — Dropdown selector */}
            <div>
              <label
                htmlFor="event-type"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2"
              >
                Type d'événement <span className="text-rose-500">*</span>
              </label>
              {loadingTypes ? (
                <div className="px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-sm">
                  Chargement des types...
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="event-type"
                    value={eventTypeId}
                    onChange={(e) => setEventTypeId(e.target.value)}
                    required
                    className={`${inputBase} appearance-none pr-10 cursor-pointer ${eventTypeId ? 'text-transparent' : ''}`}
                  >
                    <option value="">Sélectionnez un type</option>
                    {eventTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {/* Selected type preview */}
                  {eventTypeId ? (() => {
                    const selectedType = eventTypes.find(t => t.id === eventTypeId)
                    if (selectedType) {
                      return (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                          <span className="text-lg">{selectedType.icon}</span>
                          <span className={`text-sm font-medium text-stone-900 ${selectedType.color}`}>
                            {selectedType.label}
                          </span>
                        </div>
                      )
                    }
                    return null
                  })() : (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-sm">
                      Sélectionnez un type
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date & Time Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Dates <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAllDay(!allDay)}
                  className="group flex items-center gap-2 select-none"
                >
                  <span className="text-xs font-medium text-stone-500 group-hover:text-stone-700 transition-colors">
                    Toute la journée
                  </span>
                  <div
                    className={`
                      relative w-9 h-5 rounded-full transition-colors duration-200 ease-in-out
                      ${allDay ? 'bg-[#5B5781]' : 'bg-stone-300'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                        transition-transform duration-200 ease-in-out
                        ${allDay ? 'translate-x-4' : 'translate-x-0'}
                      `}
                    />
                  </div>
                </button>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 overflow-hidden">
                {/* Date row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-[#5B5781]/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#5B5781]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                      id="event-start-date"
                      type="date"
                      value={startDateStr}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-sm text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
                    />
                    <svg className="shrink-0 w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <input
                      id="event-end-date"
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      required
                      min={startDateStr}
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-sm text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
                    />
                  </div>
                </div>

                {/* Time row — collapses when allDay */}
                <div
                  className={`
                    grid transition-all duration-200 ease-in-out
                    ${allDay ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}
                  `}
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-stone-200/60">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-[#5B5781]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#5B5781]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <input
                          id="event-start-time"
                          type="time"
                          value={startTimeStr}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-sm text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
                        />
                        <svg className="shrink-0 w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <input
                          id="event-end-time"
                          type="time"
                          value={endTimeStr}
                          onChange={(e) => setEndTimeStr(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-sm text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="event-location"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2"
              >
                Lieu
              </label>
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputBase}
                placeholder="Ex: Lab, En ligne, Terrain..."
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="event-description"
                className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2"
              >
                Description
              </label>
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50 transition-all focus-within:border-[#5B5781] focus-within:ring-2 focus-within:ring-[#5B5781]/30">
                {editor && (
                  <>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 px-3 py-2 bg-white">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          editor.isActive('bold')
                            ? 'bg-[#5B5781] text-white'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="Gras"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          editor.isActive('italic')
                            ? 'bg-[#5B5781] text-white'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="Italique"
                      >
                        <em>I</em>
                      </button>
                      <div className="mx-1 h-5 w-px bg-stone-200" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          editor.isActive('bulletList')
                            ? 'bg-[#5B5781] text-white'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="Liste à puces"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`rounded px-2 py-1 text-sm transition-colors ${
                          editor.isActive('orderedList')
                            ? 'bg-[#5B5781] text-white'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="Liste numérotée"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                    </div>
                    {/* Editor Content */}
                    <div className="relative">
                      <EditorContent editor={editor} />
                      {editor?.isEmpty && (
                        <div className="absolute top-3 left-4 pointer-events-none text-stone-400 text-sm">
                          Ajoutez des détails, un ordre du jour, ou des notes importantes...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim() || !eventTypeId}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4669] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#5B5781]/20 transition-all duration-200 hover:shadow-[#5B5781]/30 active:scale-[0.99]"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
