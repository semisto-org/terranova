import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Trash2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { MultiMemberPicker, type MemberOption } from '@/lab-management/components/MemberPicker'

export interface ProjectEditModalProject {
  id: string
  typeKey: string
  name: string
  description: string | null
  pole?: string | null
  status: string | null
  totalTasks?: number
  expensesCount?: number
  revenuesCount?: number
  timesheetsCount?: number
}

interface ProjectEditModalProps {
  project: ProjectEditModalProject
  onSave: () => void
  onDelete?: () => void
  onClose: () => void
}

interface ServerMembership {
  id: string
  memberId: string
}

const POLE_OPTIONS = [
  { value: '', label: 'Aucun', accent: '#a8a29e' },
  { value: 'academy', label: 'Academy', accent: '#B01A19' },
  { value: 'design', label: 'Design Studio', accent: '#AFBD00' },
  { value: 'nursery', label: 'Nursery', accent: '#EF9B0D' },
]

const STATUS_OPTIONS_BY_TYPE: Record<string, { value: string; label: string; dot: string }[]> = {
  'lab-project': [
    { value: 'Idée', label: 'Idée', dot: 'bg-sky-400' },
    { value: 'En attente', label: 'En attente', dot: 'bg-amber-400' },
    { value: 'En cours', label: 'En cours', dot: 'bg-emerald-500' },
    { value: 'Standby', label: 'Standby', dot: 'bg-stone-400' },
    { value: 'Terminé', label: 'Terminé', dot: 'bg-emerald-500' },
    { value: 'Annulé', label: 'Annulé', dot: 'bg-red-400' },
    { value: 'No go', label: 'No go', dot: 'bg-red-400' },
  ],
  'design-project': [
    { value: 'idea', label: 'Idée', dot: 'bg-sky-400' },
    { value: 'active', label: 'Actif', dot: 'bg-emerald-500' },
    { value: 'completed', label: 'Terminé', dot: 'bg-emerald-600' },
    { value: 'cancelled', label: 'Annulé', dot: 'bg-red-400' },
  ],
  'training': [
    { value: 'in_preparation', label: 'En préparation', dot: 'bg-amber-400' },
    { value: 'registrations_open', label: 'Inscriptions ouvertes', dot: 'bg-emerald-500' },
    { value: 'in_progress', label: 'En cours', dot: 'bg-sky-500' },
    { value: 'post_production', label: 'Post-production', dot: 'bg-purple-400' },
    { value: 'completed', label: 'Terminé', dot: 'bg-emerald-600' },
    { value: 'cancelled', label: 'Annulé', dot: 'bg-red-400' },
  ],
}

const ACCENT_BY_TYPE: Record<string, string> = {
  'lab-project': '#5B5781',
  'design-project': '#AFBD00',
  'training': '#B01A19',
  'guild': '#234766',
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400/30 focus:border-stone-400 focus:bg-white'
const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

export function ProjectEditModal({ project, onSave, onDelete, onClose }: ProjectEditModalProps) {
  const typeKey = project.typeKey
  const accent = ACCENT_BY_TYPE[typeKey] || '#234766'
  const statusOptions = STATUS_OPTIONS_BY_TYPE[typeKey] || []
  const showPole = typeKey === 'lab-project'
  const showDescription = typeKey !== 'design-project'
  const descriptionLabel = typeKey === 'guild' ? 'Mission' : 'Description'

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [pole, setPole] = useState(project.pole || '')
  const [status, setStatus] = useState(project.status || '')
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [serverMemberships, setServerMemberships] = useState<ServerMembership[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    apiRequest('/api/v1/lab/members').then(res => {
      setMembers((res.items || []).map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        avatar: m.avatar,
      })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    apiRequest(`/api/v1/projects/${typeKey}/${project.id}/members`).then(res => {
      const items = (res.items || []).map((pm: any) => ({ id: pm.id, memberId: pm.memberId }))
      setServerMemberships(items)
      const names = (res.items || []).map((pm: any) => pm.memberName).filter(Boolean)
      setTeamNames(names)
    }).catch(() => {})
  }, [typeKey, project.id])

  const nameToIdMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of members) map.set(`${m.firstName} ${m.lastName}`, m.id)
    return map
  }, [members])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, any> = { name: name.trim() }
      if (showDescription) body.description = description.trim() || null
      if (showPole) body.pole = pole || null
      if (status) body.status = status

      await apiRequest(`/api/v1/projects/${typeKey}/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      const desiredMemberIds = new Set(
        teamNames.map(n => nameToIdMap.get(n)).filter((id): id is string => Boolean(id))
      )
      const currentByMemberId = new Map(serverMemberships.map(pm => [pm.memberId, pm.id]))

      const toRemove = serverMemberships.filter(pm => !desiredMemberIds.has(pm.memberId))
      const toAdd = [...desiredMemberIds].filter(id => !currentByMemberId.has(id))

      await Promise.all([
        ...toRemove.map(pm =>
          apiRequest(`/api/v1/project-memberships/${pm.id}`, { method: 'DELETE' })
        ),
        ...toAdd.map(memberId =>
          apiRequest(`/api/v1/projects/${typeKey}/${project.id}/members`, {
            method: 'POST',
            body: JSON.stringify({ member_id: memberId, role: 'member' }),
          })
        ),
      ])

      onSave()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [name, description, pole, status, teamNames, nameToIdMap, serverMemberships, project.id, typeKey, showPole, showDescription, onSave])

  const handleDelete = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/v1/projects/${typeKey}/${project.id}`, { method: 'DELETE' })
      onDelete?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [project.id, typeKey, onDelete])

  const canDelete =
    typeKey === 'lab-project' &&
    (project.totalTasks ?? 0) === 0 &&
    (project.expensesCount ?? 0) === 0 &&
    (project.revenuesCount ?? 0) === 0 &&
    (project.timesheetsCount ?? 0) === 0

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

            <div className="space-y-1.5">
              <span className={labelClass}>Équipe</span>
              <MultiMemberPicker
                members={members}
                value={teamNames}
                onChange={setTeamNames}
                placeholder="Ajouter des membres à l'équipe..."
              />
            </div>

            {showDescription && (
              <label className="block space-y-1.5">
                <span className={labelClass}>{descriptionLabel}</span>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Objectif ou résumé du projet..."
                  rows={2}
                />
              </label>
            )}

            {showPole && (
              <div className="space-y-1.5">
                <span className={labelClass}>Pôle</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {POLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPole(opt.value)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: pole === opt.value ? `${opt.accent}18` : undefined,
                        color: pole === opt.value ? opt.accent : undefined,
                        boxShadow: pole === opt.value ? `inset 0 0 0 1px ${opt.accent}33` : undefined,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: opt.accent }}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {statusOptions.length > 0 && (
              <div className="space-y-1.5">
                <span className={labelClass}>Statut</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: status === opt.value ? `${accent}18` : undefined,
                        color: status === opt.value ? accent : undefined,
                        boxShadow: status === opt.value ? `inset 0 0 0 1px ${accent}33` : undefined,
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ backgroundColor: accent }}
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
