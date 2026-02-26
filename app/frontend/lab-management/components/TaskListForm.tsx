import React, { useState } from 'react'
import { X } from 'lucide-react'

interface TaskListFormProps {
  initialName?: string
  onSubmit: (name: string) => void
  onClose: () => void
  busy?: boolean
}

export function TaskListForm({ initialName = '', onSubmit, onClose, busy }: TaskListFormProps) {
  const [name, setName] = useState(initialName)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit(name.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              {initialName ? 'Renommer la liste' : 'Nouvelle liste de tâches'}
            </h2>
            <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-5">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom de la liste..."
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white"
              required
              autoFocus
            />
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
