import { useState, useEffect, useMemo } from 'react'
import { Users, UserPlus, Trash2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { TeamMember, TeamRole } from '../../types'
import { EmptyState } from '../shared/EmptyState'

const roleLabels: Record<TeamRole, string> = {
  'project-manager': 'Project Manager',
  designer: 'Designer',
  butineur: 'Butineur',
}

const roleBadgeClass: Record<TeamRole, string> = {
  'project-manager':
    'bg-[#AFBD00]/20 text-[#6B7A00]',
  designer:
    'bg-[#5B5781]/20 text-[#5B5781]',
  butineur: 'bg-stone-100 text-stone-700',
}

interface SemistoMember {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface TeamTabProps {
  teamMembers: TeamMember[]
  projectPhase: string
  onAddTeamMember: (values: {
    member_id: string
    role: TeamRole
    is_paid: boolean
  }) => void
  onRemoveTeamMember: (memberId: string) => void
}

export function TeamTab({
  teamMembers,
  projectPhase,
  onAddTeamMember,
  onRemoveTeamMember,
}: TeamTabProps) {
  const [members, setMembers] = useState<SemistoMember[]>([])
  const [form, setForm] = useState({
    member_id: '',
    role: 'designer' as TeamRole,
    is_paid: true,
  })

  useEffect(() => {
    apiRequest('/api/v1/lab/members')
      .then((data: { items?: SemistoMember[] }) => setMembers(data?.items ?? []))
      .catch(() => setMembers([]))
  }, [])

  const assignedMemberIds = useMemo(
    () => new Set(teamMembers.map((m) => m.memberId)),
    [teamMembers]
  )

  const availableMembers = useMemo(() => {
    return members
      .filter((m) => !assignedMemberIds.has(m.id))
      .sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      })
  }, [members, assignedMemberIds])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.member_id) return
    onAddTeamMember(form)
    setForm({ member_id: '', role: 'designer', is_paid: true })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#AFBD00]" />
          Ajouter un membre
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <select
            value={form.member_id}
            onChange={(e) =>
              setForm((p) => ({ ...p, member_id: e.target.value }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent sm:col-span-2"
            required
          >
            <option value="">Choisir un membre Semisto</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {[m.firstName, m.lastName].filter(Boolean).join(' ') || m.email}
              </option>
            ))}
          </select>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((p) => ({ ...p, role: e.target.value as TeamRole }))
            }
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent"
          >
            <option value="project-manager">Project Manager</option>
            <option value="designer">Designer</option>
            <option value="butineur">Butineur</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.is_paid}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_paid: e.target.checked }))
              }
              className="rounded border-stone-300 text-[#AFBD00] focus:ring-[#AFBD00]"
            />
            Rémunéré
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#AFBD00] px-4 py-2 text-sm font-medium text-stone-900 hover:bg-[#9BAA00] transition-colors"
          >
            Ajouter
          </button>
        </form>
      </div>

      {teamMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 text-stone-400" />}
          title="Aucun membre assigné"
          description="Ajoutez des membres à l’équipe projet pour suivre les rôles et les contributions."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#e1e6d8] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-[#6B7A00]">
                    {(member.memberName || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {member.memberName}
                  </p>
                  {member.memberEmail && (
                    <p className="text-xs text-stone-500 truncate">
                      {member.memberEmail}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeClass[member.role]}`}
                    >
                      {roleLabels[member.role]}
                    </span>
                    {member.isPaid ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Payé
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                        Bénévole
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Assigné le {formatDate(member.assignedAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveTeamMember(member.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Retirer du projet"
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
