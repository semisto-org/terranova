import type { Citizen, CitizenRole, BadgeName } from '../types'

interface CitizenAvatarRowProps {
  citizen: Citizen
  showBadges?: boolean
  onView?: () => void
}

const roleConfig: Record<CitizenRole, { label: string; color: string }> = {
  membre: { label: 'Membre', color: 'text-stone-500' },
  parrain: { label: 'Parrain', color: 'text-pink-500' },
  ambassadeur: { label: 'Ambassadeur', color: 'text-amber-500' },
  admin: { label: 'Admin', color: 'text-purple-500' },
}

const badgeEmojis: Record<BadgeName, string> = {
  explorateur: '🧭',
  cartographe: '🗺️',
  planteur: '🌱',
  parrain: '💝',
  mentor: '👨‍🏫',
  transmetteur: '📚',
}

export function CitizenAvatarRow({ citizen, showBadges = true, onView }: CitizenAvatarRowProps) {
  const role = roleConfig[citizen.role]
  const isAmbassador = citizen.role === 'ambassadeur'

  return (
    <button
      onClick={onView}
      className="
        group w-full flex items-center gap-4 p-4
        bg-white dark:bg-stone-900
        rounded-2xl border border-stone-200 dark:border-stone-700
        hover:border-stone-300 dark:hover:border-stone-600
        hover:shadow-md hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
        transition-all duration-300
        text-left
      "
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`
          w-14 h-14 rounded-full overflow-hidden
          ${isAmbassador ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-stone-900' : ''}
        `}>
          {citizen.avatarUrl ? (
            <img
              src={citizen.avatarUrl}
              alt={`${citizen.firstName} ${citizen.lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
              {citizen.firstName[0]}{citizen.lastName[0]}
            </div>
          )}
        </div>

        {/* Ambassador crown */}
        {isAmbassador && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-lg">
            👑
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-stone-900 dark:text-white truncate">
            {citizen.firstName} {citizen.lastName}
          </span>
          <span className={`text-xs font-medium ${role.color}`}>
            {role.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {citizen.hoursContributed}h
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {citizen.spotsReported}
          </span>
          {citizen.worksitesAttended > 0 && (
            <span className="flex items-center gap-1">
              🌱 {citizen.worksitesAttended}
            </span>
          )}
        </div>

        {/* Badges */}
        {showBadges && citizen.badges.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {citizen.badges.slice(0, 5).map((badge) => (
              <span
                key={badge}
                className="text-sm"
                title={badge}
              >
                {badgeEmojis[badge]}
              </span>
            ))}
            {citizen.badges.length > 5 && (
              <span className="text-xs text-stone-400 ml-1">
                +{citizen.badges.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="
        w-8 h-8 rounded-full
        bg-stone-100 dark:bg-stone-800
        flex items-center justify-center flex-shrink-0
        group-hover:bg-emerald-500 group-hover:text-white
        transition-all duration-300
      ">
        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
