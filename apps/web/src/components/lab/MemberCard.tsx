import type { Member, Guild, Wallet } from '@terranova/types'

interface MemberCardProps {
  member: Member
  guilds: Guild[]
  wallet: Wallet | undefined
  onViewMember?: (memberId: string) => void
  onEditMember?: (memberId: string) => void
}

export function MemberCard({
  member,
  guilds,
  wallet,
  onViewMember,
  onEditMember,
}: MemberCardProps) {
  const memberGuilds = guilds.filter((g) => member.guildIds.includes(g.id))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header with Avatar */}
      <div className="flex items-start gap-4">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={`${member.firstName} ${member.lastName}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-600">
            {member.firstName[0]}
            {member.lastName[0]}
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-sm text-gray-500">{member.email}</p>

          {/* Status Badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                member.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {member.status}
            </span>
            {member.isAdmin && (
              <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Roles */}
      {member.roles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Roles
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {member.roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guilds */}
      {memberGuilds.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Guilds
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {memberGuilds.map((guild) => (
              <span
                key={guild.id}
                className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
              >
                {guild.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      {wallet && (
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Semos Balance
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {wallet.balance.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {onViewMember && (
          <button
            onClick={() => onViewMember(member.id)}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Profile
          </button>
        )}
        {onEditMember && member.isAdmin && (
          <button
            onClick={() => onEditMember(member.id)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500">
        Joined {new Date(member.joinedAt).toLocaleDateString()}
      </div>
    </div>
  )
}
