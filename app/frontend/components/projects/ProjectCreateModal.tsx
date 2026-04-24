import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Sparkles } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { MultiMemberPicker, type MemberOption } from '@/lab-management/components/MemberPicker'

interface ProjectCreateModalProps {
  onCreated: (project: { id: string; typeKey: string }) => void
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'Idée', label: 'Idée', dot: 'bg-sky-400' },
  { value: 'En attente', label: 'En attente', dot: 'bg-amber-400' },
  { value: 'En cours', label: 'En cours', dot: 'bg-emerald-500' },
  { value: 'Standby', label: 'Standby', dot: 'bg-stone-400' },
]

const POLE_OPTIONS = [
  { value: '', label: 'Aucun', accent: '#a8a29e' },
  { value: 'academy', label: 'Academy', accent: '#B01A19' },
  { value: 'design', label: 'Design Studio', accent: '#AFBD00' },
  { value: 'nursery', label: 'Nursery', accent: '#EF9B0D' },
]

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] focus:bg-white'
const labelClass = 'text-xs font-medium text-stone-500 uppercase tracking-wider'

export function ProjectCreateModal({ onCreated, onClose }: ProjectCreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pole, setPole] = useState('')
  const [status, setStatus] = useState('Idée')
  const [teamNames, setTeamNames] = useState<string[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const created = await apiRequest('/api/v1/projects/lab-project', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          pole: pole || null,
          status,
        }),
      })

      const memberIds = teamNames
        .map(n => nameToIdMap.get(n))
        .filter((id): id is string => Boolean(id))

      await Promise.all(
        memberIds.map(memberId =>
          apiRequest(`/api/v1/projects/lab-project/${created.id}/members`, {
            method: 'POST',
            body: JSON.stringify({ member_id: memberId, role: 'member' }),
          })
        )
      )

      onCreated({ id: created.id, typeKey: 'lab-project' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [name, description, pole, status, teamNames, nameToIdMap, onCreated])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.42)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="shrink-0 px-6 py-5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5B5781]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#5B5781]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                  Nouveau projet
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">Projet interne Semisto</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4">
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
                placeholder="Ex. Jardin-forêt communautaire de Namur"
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

            <label className="block space-y-1.5">
              <span className={labelClass}>Description</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
                placeholder="Objectif ou résumé du projet..."
                rows={2}
              />
            </label>

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

            <div className="space-y-1.5">
              <span className={labelClass}>Statut initial</span>
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
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
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
              {busy ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
