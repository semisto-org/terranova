import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, ChevronDown, Search, Check } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { Task, MemberOption } from './types'

interface TaskFormProps {
  task?: Task | null
  onSubmit: (values: {
    name: string
    description: string
    assignee_id: string | null
    assignee_name: string
    due_date: string
    priority: string
    tags: string[]
    time_minutes: number | null
  }) => void
  onClose: () => void
  busy?: boolean
  accentColor?: string
  members?: MemberOption[]
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white'
const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

function AssigneePicker({ members, value, onChange, accentColor }: {
  members: MemberOption[]
  value: string | null
  onChange: (id: string | null, name: string) => void
  accentColor: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) { setSearch(''); setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  const selected = useMemo(() => value ? members.find(m => m.id === value) : null, [members, value])

  const filtered = useMemo(() => {
    if (!search.trim()) return members
    const q = search.toLowerCase()
    return members.filter(m =>
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [members, search])

  const select = useCallback((m: MemberOption) => {
    onChange(m.id, `${m.firstName} ${m.lastName}`)
    setOpen(false)
  }, [onChange])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={inputClass + ' flex items-center gap-2 text-left'}
      >
        {selected ? (
          <>
            {selected.avatar ? (
              <img src={selected.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium flex-shrink-0"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                {selected.firstName[0]}{selected.lastName[0]}
              </span>
            )}
            <span className="flex-1 truncate">{selected.firstName} {selected.lastName}</span>
            <X className="w-3.5 h-3.5 text-stone-400 hover:text-stone-600" onClick={e => { e.stopPropagation(); onChange(null, ''); setOpen(false) }} />
          </>
        ) : (
          <>
            <span className="flex-1 text-stone-400">Qui s'en occupe ?</span>
            <ChevronDown className="w-4 h-4 text-stone-400" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-900/10 overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400/30 focus:border-stone-400"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-3">Aucun membre trouvé</p>
            ) : (
              filtered.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => select(m)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-stone-50 transition-colors ${value === m.id ? 'bg-stone-50' : ''}`}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                      {m.firstName[0]}{m.lastName[0]}
                    </span>
                  )}
                  <span className="flex-1 text-sm text-stone-900 truncate">{m.firstName} {m.lastName}</span>
                  {value === m.id && <Check className="w-3.5 h-3.5" style={{ color: accentColor }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function TaskForm({ task, onSubmit, onClose, busy, accentColor = '#5B5781', members: propMembers }: TaskFormProps) {
  const [name, setName] = useState(task?.name || '')
  const [description, setDescription] = useState(task?.description || '')
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assigneeId || null)
  const [assigneeName, setAssigneeName] = useState(task?.assigneeName || '')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  const [priority, setPriority] = useState(task?.priority || '')
  const [tagsStr, setTagsStr] = useState(task?.tags?.join(', ') || '')
  const [timeMinutes, setTimeMinutes] = useState<string>(task?.timeMinutes?.toString() || '')
  const [members, setMembers] = useState<MemberOption[]>(propMembers || [])

  useEffect(() => {
    if (!propMembers) {
      apiRequest('/api/v1/lab/members').then(res => {
        setMembers(res.items.map((m: any) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          avatar: m.avatar,
        })))
      }).catch(() => {})
    }
  }, [propMembers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      assignee_id: assigneeId,
      assignee_name: assigneeName,
      due_date: dueDate,
      priority,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      time_minutes: timeMinutes ? parseInt(timeMinutes, 10) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <label className="block space-y-1.5">
              <span className={labelClass}>Nom</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                placeholder="Qu'est-ce qu'il faut faire ?"
                required
                autoFocus
                data-1p-ignore
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>Description</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputClass + ' resize-none'}
                placeholder="Détails, notes..."
                rows={2}
              />
            </label>

            <div className="space-y-1.5">
              <span className={labelClass}>Responsable</span>
              {members.length > 0 ? (
                <AssigneePicker
                  members={members}
                  value={assigneeId}
                  onChange={(id, name) => { setAssigneeId(id); setAssigneeName(name) }}
                  accentColor={accentColor}
                />
              ) : (
                <input
                  type="text"
                  value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)}
                  className={inputClass}
                  placeholder="Nom du responsable"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className={labelClass}>Échéance</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Priorité</span>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Aucune</option>
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className={labelClass}>Tags</span>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={e => setTagsStr(e.target.value)}
                  className={inputClass}
                  placeholder="tag1, tag2..."
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Estimation (min)</span>
                <input
                  type="number"
                  value={timeMinutes}
                  onChange={e => setTimeMinutes(e.target.value)}
                  className={inputClass}
                  placeholder="60"
                  min="0"
                />
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ backgroundColor: accentColor }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.9)')}
              onMouseLeave={e => (e.currentTarget.style.filter = '')}
            >
              {busy ? 'En cours...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
