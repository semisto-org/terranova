import type { Member, Guild, Wallet } from '../types'

interface MemberCardProps {
  member: Member
  guilds: Guild[]
  wallet?: Wallet
  onView?: () => void
  onEdit?: () => void
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

export function MemberCard({ member, guilds, wallet, onView, onEdit }: MemberCardProps) {
  const memberGuilds = guilds.filter((g) => member.guildIds.includes(g.id))
  const isInactive = member.status === 'inactive'

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border border-stone-200
        bg-white backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:border-[#5B5781]/40 hover:shadow-lg hover:shadow-[#5B5781]/5
        ${isInactive ? 'opacity-60' : ''}
      `}
    >
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B5781] via-[#5B5781]/60 to-[#AFBD00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5">
        {/* Header with avatar and status */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-stone-100 group-hover:ring-[#5B5781]/30 transition-all duration-300">
              <img
                src={member.avatar}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Status indicator */}
            <div
              className={`
                absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                ${member.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400'}
              `}
              title={member.status === 'active' ? 'Actif' : 'Inactif'}
            />
          </div>

          {/* Name and email */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-stone-900 truncate">
                {member.firstName} {member.lastName}
              </h3>
              {member.membershipType === 'adherent' ? (
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0D9488] text-white">
                  Adhérent
                </span>
              ) : (
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5B5781] text-white">
                  Effectif
                </span>
              )}
              {member.isAdmin && (
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#5B5781] text-white">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                member.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {member.status === 'active' ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-sm text-stone-500 truncate mt-0.5">
              {member.email}
            </p>
          </div>

          {/* Slack indicator */}
          <div className="flex-shrink-0" title={member.slackUserId ? 'Slack lié' : 'Slack non lié'}>
            <div className={`w-3 h-3 rounded-full ${member.slackUserId ? 'bg-green-500' : 'bg-stone-300'}`} />
          </div>
        </div>

        {/* Roles */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.roles.map((role) => (
            <span
              key={role}
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${roleColors[role] || 'bg-stone-100 text-stone-600'}`}
            >
              {roleLabels[role] || role}
            </span>
          ))}
        </div>

        {/* Guilds */}
        {memberGuilds.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="truncate">
              {memberGuilds.map((g) => g.name).join(', ')}
            </span>
          </div>
        )}

        {/* Wallet balance (if available) */}
        {wallet && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#AFBD00]/10">
              <span className="font-medium text-[#7a8200]">
                {wallet.balance.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}
              </span>
              <span className="text-[#7a8200]/70">Semos</span>
            </div>
          </div>
        )}

        {/* Member since */}
        <div className="mt-3 text-xs text-stone-400">
          Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
          >
            Voir le profil
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm font-medium text-[#5B5781] bg-[#5B5781]/10 rounded-lg hover:bg-[#5B5781]/20 transition-colors"
            >
              Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
