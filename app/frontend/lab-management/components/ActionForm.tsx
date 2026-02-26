import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { MemberPicker, type MemberOption } from './MemberPicker'
import type { ActionItem } from './ActionRow'

interface ActionFormProps {
  action?: ActionItem | null
  onSubmit: (values: { name: string; assignee_name: string; due_date: string; priority: string }) => void
  onClose: () => void
  busy?: boolean
  members?: MemberOption[]
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white'
const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

export function ActionForm({ action, onSubmit, onClose, busy, members: propMembers }: ActionFormProps) {
  const [name, setName] = useState(action?.name || '')
  const [assigneeName, setAssigneeName] = useState(action?.assigneeName || '')
  const [dueDate, setDueDate] = useState(action?.dueDate || '')
  const [priority, setPriority] = useState(action?.priority || '')
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
    onSubmit({ name: name.trim(), assignee_name: assigneeName, due_date: dueDate, priority })
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
              {action ? 'Modifier la tâche' : 'Nouvelle tâche'}
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
              />
            </label>
            <div className="space-y-1.5">
              <span className={labelClass}>Responsable</span>
              <MemberPicker
                members={members}
                value={assigneeName}
                onChange={setAssigneeName}
                placeholder="Qui s'en occupe ?"
              />
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
                  <option value="Ⓞ">Basse</option>
                  <option value="ⓄⓄ">Moyenne</option>
                  <option value="ⓄⓄⓄ">Haute</option>
                </select>
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
              className="px-5 py-2.5 rounded-lg bg-[#5B5781] text-white text-sm font-semibold hover:bg-[#4a4670] disabled:opacity-50 transition-colors"
            >
              {busy ? 'En cours...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
