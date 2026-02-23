import { useState, useMemo, useRef, useEffect } from 'react'
import type { Member, Guild, Wallet, MemberRole, MemberStatus, MembershipType } from '../types'
import { formatRelativeTime } from '../utils/formatRelativeTime'
import slackIcon from '../../assets/slack-icon.svg'

export interface MemberListProps {
  members: Member[]
  guilds: Guild[]
  wallets: Wallet[]
  currentMemberId: string
  onAddMember?: () => void
  onViewMember?: (memberId: string) => void
  onEditMember?: (memberId: string) => void
}

const roleLabels: Record<string, string> = {
  designer: 'Designer',
  shaper: 'Shaper',
  formateur: 'Formateur·ice',
  comptable: 'Comptable',
  coordination: 'Coordination',
  communication: 'Communication',
  IT: 'IT',
}

const roleColors: Record<string, string> = {
  designer: 'bg-[#AFBD00]/20 text-[#7a8200]',
  shaper: 'bg-[#5B5781]/20 text-[#5B5781]',
  formateur: 'bg-rose-100 text-rose-700',
  comptable: 'bg-emerald-100 text-emerald-700',
  coordination: 'bg-amber-100 text-amber-700',
  communication: 'bg-sky-100 text-sky-700',
  IT: 'bg-slate-100 text-slate-700',
}

const allRoles: MemberRole[] = ['designer', 'shaper', 'formateur', 'comptable', 'coordination', 'communication', 'IT']

function Avatar({ member }: { member: Member }) {
  const initials = `${member.firstName[0] || ''}${member.lastName[0] || ''}`.toUpperCase()
  const [imgError, setImgError] = useState(false)

  if (member.avatar && !imgError) {
    return (
      <img
        src={member.avatar}
        alt={`${member.firstName} ${member.lastName}`}
        className="w-8 h-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#5B5781]/20 text-[#5B5781] flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  )
}

function ActionsMenu({ memberId, onEdit }: { memberId: string; onEdit?: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!onEdit) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-stone-200 shadow-lg z-10 py-1">
          <button
            onClick={() => { onEdit(memberId); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  )
}

function MemberTable({
  members,
  onEditMember,
  isAdmin,
}: {
  members: Member[]
  onEditMember?: (id: string) => void
  isAdmin: boolean
}) {
  // Sort: alphabetical by last name, inactive at the end
  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    })
  }, [members])

  if (sorted.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
            <th className="pl-4 pr-2 py-3">Membre</th>
            <th className="px-2 py-3 hidden md:table-cell">Email</th>
            <th className="px-2 py-3 hidden md:table-cell">Dernière activité</th>
            <th className="px-2 py-3 w-8" title="Slack"><img src={slackIcon} alt="Slack" className="w-4 h-4 opacity-50" /></th>
            <th className="px-2 pr-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sorted.map((member) => {
            const activity = formatRelativeTime(member.lastActivityAt)
            const inactive = member.status === 'inactive'
            return (
              <tr
                key={member.id}
                className={`hover:bg-stone-50 transition-colors ${inactive ? 'opacity-50' : ''}`}
              >
                {/* Avatar + Name */}
                <td className="pl-4 pr-2 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-stone-900 truncate">
                          {member.firstName} {member.lastName}
                        </span>
                        {member.isAdmin && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#5B5781] text-white">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-2 py-3 hidden md:table-cell">
                  <span className="text-sm text-stone-500 truncate">{member.email}</span>
                </td>

                {/* Last activity */}
                <td className="px-2 py-3 hidden md:table-cell">
                  <span className={`text-xs ${activity.isOnline ? 'text-emerald-600 font-medium' : activity.text === 'Jamais' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {activity.text}
                  </span>
                </td>

                {/* Slack */}
                <td className="px-2 py-3">
                  <img
                    src={slackIcon}
                    alt="Slack"
                    className={`w-4 h-4 ${(member as any).slackUserId ? '' : 'grayscale opacity-30'}`}
                    title={(member as any).slackUserId ? `Slack: ${(member as any).slackUserId}` : 'Slack non lié'}
                  />
                </td>

                {/* Actions */}
                <td className="px-2 pr-4 py-3">
                  {isAdmin && onEditMember && (
                    <ActionsMenu memberId={member.id} onEdit={onEditMember} />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MemberList({
  members,
  guilds,
  wallets,
  currentMemberId,
  onAddMember,
  onViewMember,
  onEditMember,
}: MemberListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<MembershipType | 'all'>('all')
  const [guildFilter, setGuildFilter] = useState<string>('all')

  const currentMember = members.find((m) => m.id === currentMemberId)
  const isAdmin = currentMember?.isAdmin ?? false

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        search === '' ||
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter)
      const matchesType = typeFilter === 'all' || member.membershipType === typeFilter
      const matchesGuild = guildFilter === 'all' || member.guildIds.includes(guildFilter)
      return matchesSearch && matchesStatus && matchesRole && matchesType && matchesGuild
    })
  }, [members, search, statusFilter, roleFilter, typeFilter, guildFilter])

  const effectiveMembers = filteredMembers.filter((m) => m.membershipType === 'effective')
  const adherentMembers = filteredMembers.filter((m) => m.membershipType === 'adherent')

  const activeCount = members.filter((m) => m.status === 'active').length
  const inactiveCount = members.filter((m) => m.status === 'inactive').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
                Membres du Lab
              </h1>
              <p className="mt-2 text-stone-600">
                Annuaire des membres et de leurs rôles
              </p>
            </div>

            {isAdmin && onAddMember && (
              <button
                onClick={onAddMember}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-[#5B5781] text-white font-medium
                  shadow-lg shadow-[#5B5781]/20
                  hover:bg-[#4a4669] hover:shadow-xl hover:shadow-[#5B5781]/30
                  active:scale-[0.98]
                  transition-all duration-200
                "
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un membre
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-stone-900">{activeCount}</span>
              <span className="text-sm text-stone-500">actifs</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-stone-400" />
              <span className="text-sm font-medium text-stone-900">{inactiveCount}</span>
              <span className="text-sm text-stone-500">inactifs</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm">
              <span className="text-sm font-medium text-stone-900">{guilds.length}</span>
              <span className="text-sm text-stone-500">guildes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-colors"
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'all')}
                className="w-full px-4 py-2.5 rounded-xl appearance-none bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-colors cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {/* Role filter */}
            <div className="sm:w-44">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as MemberRole | 'all')}
                className="w-full px-4 py-2.5 rounded-xl appearance-none bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-colors cursor-pointer"
              >
                <option value="all">Tous les rôles</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>{roleLabels[role]}</option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div className="sm:w-44">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as MembershipType | 'all')}
                className="w-full px-4 py-2.5 rounded-xl appearance-none bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-colors cursor-pointer"
              >
                <option value="all">Tous les types</option>
                <option value="effective">Effectifs</option>
                <option value="adherent">Adhérents</option>
              </select>
            </div>

            {/* Guild filter */}
            <div className="sm:w-48">
              <select
                value={guildFilter}
                onChange={(e) => setGuildFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl appearance-none bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-colors cursor-pointer"
              >
                <option value="all">Toutes les guildes</option>
                {guilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>{guild.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters summary */}
          {(search || statusFilter !== 'all' || roleFilter !== 'all' || typeFilter !== 'all' || guildFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-stone-500">Filtres actifs:</span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  "{search}"
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {statusFilter === 'active' ? 'Actifs' : 'Inactifs'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {roleFilter !== 'all' && (
                <button
                  onClick={() => setRoleFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {roleLabels[roleFilter]}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {typeFilter !== 'all' && (
                <button
                  onClick={() => setTypeFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {typeFilter === 'effective' ? 'Effectifs' : 'Adhérents'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {guildFilter !== 'all' && (
                <button
                  onClick={() => setGuildFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] text-xs font-medium hover:bg-[#5B5781]/20 transition-colors"
                >
                  {guilds.find((g) => g.id === guildFilter)?.name}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setRoleFilter('all'); setTypeFilter('all'); setGuildFilter('all') }}
                className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-stone-500">
          {filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''} trouvé{filteredMembers.length !== 1 ? 's' : ''}
        </div>

        {filteredMembers.length > 0 ? (
          <div className="space-y-8">
            {/* Effective members */}
            {effectiveMembers.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                  <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                    Membres effectifs ({effectiveMembers.length})
                  </h2>
                </div>
                <MemberTable members={effectiveMembers} onEditMember={onEditMember} isAdmin={isAdmin} />
              </div>
            )}

            {/* Adherent members */}
            {adherentMembers.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/50">
                  <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                    Membres adhérents ({adherentMembers.length})
                  </h2>
                </div>
                <MemberTable members={adherentMembers} onEditMember={onEditMember} isAdmin={isAdmin} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-900 mb-1">Aucun membre trouvé</h3>
            <p className="text-stone-500 max-w-sm">
              Aucun membre ne correspond aux critères de recherche. Essayez de modifier vos filtres.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
