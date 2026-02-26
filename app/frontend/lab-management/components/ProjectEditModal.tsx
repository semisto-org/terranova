import React, { useState, useEffect, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { MemberPicker, MultiMemberPicker, type MemberOption } from './MemberPicker'

interface ProjectEditModalProps {
  project: {
    id: string
    name: string
    status: string
    leadName: string
    teamNames: string[]
    totalActions: number
  }
  onSave: () => void
  onDelete?: () => void
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'Idée', label: 'Idée', dot: 'bg-sky-400' },
  { value: 'En attente', label: 'En attente', dot: 'bg-amber-400' },
  { value: 'En cours', label: 'En cours', dot: 'bg-emerald-500' },
  { value: 'Standby', label: 'Standby', dot: 'bg-stone-400' },
  { value: 'Terminé', label: 'Terminé', dot: 'bg-emerald-500' },
  { value: 'Annulé', label: 'Annulé', dot: 'bg-red-400' },
  { value: 'No go', label: 'No go', dot: 'bg-red-400' },
]

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white'
const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

export function ProjectEditModal({ project, onSave, onDelete, onClose }: ProjectEditModalProps) {
  const [name, setName] = useState(project.name)
  const [status, setStatus] = useState(project.status)
  const [leadName, setLeadName] = useState(project.leadName || '')
  const [teamNames, setTeamNames] = useState<string[]>(project.teamNames || [])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    apiRequest('/api/v1/lab/members').then(res => {
      setMembers(res.items.map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        avatar: m.avatar,
      })))
    }).catch(() => {})
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/lab/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          status,
          lead_name: leadName,
          team_names: teamNames,
        }),
      })
      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [name, status, leadName, teamNames, project.id, onSave])

  const handleDelete = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/lab/projects/${project.id}`, { method: 'DELETE' })
      onDelete?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [project.id, onDelete])

  const canDelete = project.totalActions === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
              Modifier le projet
            </h2>
            <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block space-y-1.5">
              <span className={labelClass}>Nom du projet</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                placeholder="Nom du projet"
                required
                autoFocus
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>Statut</span>
              <div className="grid grid-cols-4 gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      status === opt.value
                        ? 'bg-[#5B5781]/10 text-[#5B5781] ring-1 ring-[#5B5781]/20'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </label>

            <div className="space-y-1.5">
              <span className={labelClass}>Responsable</span>
              <MemberPicker
                members={members}
                value={leadName}
                onChange={setLeadName}
                placeholder="Qui dirige ce projet ?"
              />
            </div>

            <div className="space-y-1.5">
              <span className={labelClass}>Équipe</span>
              <MultiMemberPicker
                members={members}
                value={teamNames}
                onChange={setTeamNames}
                placeholder="Ajouter des membres à l'équipe..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <div>
              {canDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Confirmer ?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-stone-500 hover:text-stone-700"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer le projet
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
