'use client'

import { useState } from 'react'
import type { Member, Guild, Wallet } from '@terranova/types'
import { MemberCard } from './MemberCard'

interface MemberListProps {
  members: Member[]
  guilds: Guild[]
  wallets: Wallet[]
  currentMemberId: string
  onAddMember?: () => void
  onViewMember?: (memberId: string) => void
  onEditMember?: (memberId: string) => void
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [guildFilter, setGuildFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get current user to check if admin
  const currentMember = members.find((m) => m.id === currentMemberId)
  const isAdmin = currentMember?.isAdmin || false

  // Filter members
  const filteredMembers = members.filter((member) => {
    // Status filter
    if (statusFilter !== 'all' && member.status !== statusFilter) {
      return false
    }

    // Guild filter
    if (guildFilter !== 'all' && !member.guildIds.includes(guildFilter)) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase()
      const emailMatch = member.email.toLowerCase().includes(query)
      if (!fullName.includes(query) && !emailMatch) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredMembers.length} of {members.length} members
          </p>
        </div>

        {isAdmin && onAddMember && (
          <button
            onClick={onAddMember}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search members
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Guild Filter */}
        <div>
          <label htmlFor="guild" className="sr-only">
            Guild
          </label>
          <select
            id="guild"
            value={guildFilter}
            onChange={(e) => setGuildFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-auto"
          >
            <option value="all">All Guilds</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Grid */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">No members found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const wallet = wallets.find((w) => w.memberId === member.id)
            return (
              <MemberCard
                key={member.id}
                member={member}
                guilds={guilds}
                wallet={wallet}
                onViewMember={onViewMember}
                onEditMember={isAdmin ? onEditMember : undefined}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
