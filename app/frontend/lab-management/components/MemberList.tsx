import { useState, useMemo } from 'react'
import type { Member, Guild, Wallet, MemberRole, MemberStatus } from '../types'
import { MemberCard } from './MemberCard'

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

const allRoles: MemberRole[] = ['designer', 'shaper', 'formateur', 'comptable', 'coordination', 'communication', 'IT']

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
  const [guildFilter, setGuildFilter] = useState<string>('all')

  const currentMember = members.find((m) => m.id === currentMemberId)
  const isAdmin = currentMember?.isAdmin ?? false

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        search === '' ||
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter

      // Role filter
      const matchesRole = roleFilter === 'all' || member.roles.includes(roleFilter)

      // Guild filter
      const matchesGuild = guildFilter === 'all' || member.guildIds.includes(guildFilter)

      return matchesSearch && matchesStatus && matchesRole && matchesGuild
    })
  }, [members, search, statusFilter, roleFilter, guildFilter])

  const activeCount = members.filter((m) => m.status === 'active').length
  const inactiveCount = members.filter((m) => m.status === 'inactive').length

  const getWallet = (member: Member) => wallets.find((w) => w.id === member.walletId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Membres du Lab
              </h1>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{activeCount}</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">actifs</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-stone-400" />
              <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{inactiveCount}</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">inactifs</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
              <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{guilds.length}</span>
              <span className="text-sm text-stone-500 dark:text-stone-400">guildes</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 shadow-sm">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-xl
                    bg-stone-50 dark:bg-stone-900/50
                    border border-stone-200 dark:border-stone-600
                    text-stone-900 dark:text-stone-100
                    placeholder:text-stone-400
                    focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                    transition-colors
                  "
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="sm:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'all')}
                className="
                  w-full px-4 py-2.5 rounded-xl appearance-none
                  bg-stone-50 dark:bg-stone-900/50
                  border border-stone-200 dark:border-stone-600
                  text-stone-900 dark:text-stone-100
                  focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                  transition-colors cursor-pointer
                "
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
                className="
                  w-full px-4 py-2.5 rounded-xl appearance-none
                  bg-stone-50 dark:bg-stone-900/50
                  border border-stone-200 dark:border-stone-600
                  text-stone-900 dark:text-stone-100
                  focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                  transition-colors cursor-pointer
                "
              >
                <option value="all">Tous les rôles</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>

            {/* Guild filter */}
            <div className="sm:w-48">
              <select
                value={guildFilter}
                onChange={(e) => setGuildFilter(e.target.value)}
                className="
                  w-full px-4 py-2.5 rounded-xl appearance-none
                  bg-stone-50 dark:bg-stone-900/50
                  border border-stone-200 dark:border-stone-600
                  text-stone-900 dark:text-stone-100
                  focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]
                  transition-colors cursor-pointer
                "
              >
                <option value="all">Toutes les guildes</option>
                {guilds.map((guild) => (
                  <option key={guild.id} value={guild.id}>
                    {guild.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters summary */}
          {(search || statusFilter !== 'all' || roleFilter !== 'all' || guildFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-stone-500 dark:text-stone-400">Filtres actifs:</span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] dark:bg-[#5B5781]/20 dark:text-[#a9a3c7] text-xs font-medium hover:bg-[#5B5781]/20 dark:hover:bg-[#5B5781]/30 transition-colors"
                >
                  "{search}"
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] dark:bg-[#5B5781]/20 dark:text-[#a9a3c7] text-xs font-medium hover:bg-[#5B5781]/20 dark:hover:bg-[#5B5781]/30 transition-colors"
                >
                  {statusFilter === 'active' ? 'Actifs' : 'Inactifs'}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {roleFilter !== 'all' && (
                <button
                  onClick={() => setRoleFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] dark:bg-[#5B5781]/20 dark:text-[#a9a3c7] text-xs font-medium hover:bg-[#5B5781]/20 dark:hover:bg-[#5B5781]/30 transition-colors"
                >
                  {roleLabels[roleFilter]}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {guildFilter !== 'all' && (
                <button
                  onClick={() => setGuildFilter('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B5781]/10 text-[#5B5781] dark:bg-[#5B5781]/20 dark:text-[#a9a3c7] text-xs font-medium hover:bg-[#5B5781]/20 dark:hover:bg-[#5B5781]/30 transition-colors"
                >
                  {guilds.find((g) => g.id === guildFilter)?.name}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setRoleFilter('all')
                  setGuildFilter('all')
                }}
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 underline underline-offset-2"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-stone-500 dark:text-stone-400">
          {filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''} trouvé{filteredMembers.length !== 1 ? 's' : ''}
        </div>

        {/* Members grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                guilds={guilds}
                wallet={getWallet(member)}
                onView={() => onViewMember?.(member.id)}
                onEdit={isAdmin ? () => onEditMember?.(member.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">
              Aucun membre trouvé
            </h3>
            <p className="text-stone-500 dark:text-stone-400 max-w-sm">
              Aucun membre ne correspond aux critères de recherche. Essayez de modifier vos filtres.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
