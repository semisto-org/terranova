import type { Village, VillageBadge } from '../types'

interface VillageHeroProps {
  village: Village
  onJoinVillage?: () => void
  isCurrentUserVillage?: boolean
}

const badgeConfig: Record<VillageBadge, { label: string; emoji: string; gradient: string; description: string }> = {
  eveil: {
    label: 'Village en éveil',
    emoji: '🌱',
    gradient: 'from-amber-400 to-yellow-500',
    description: 'Premiers pas vers la transformation',
  },
  planteur: {
    label: 'Village planteur',
    emoji: '🌿',
    gradient: 'from-lime-400 to-green-500',
    description: 'Premières réalisations concrètes',
  },
  nourricier: {
    label: 'Village nourricier',
    emoji: '🌳',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Territoire comestible significatif',
  },
  resilient: {
    label: 'Village résilient',
    emoji: '🏆',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Écosystème mature et autonome',
  },
}

export function VillageHero({ village, onJoinVillage, isCurrentUserVillage }: VillageHeroProps) {
  const badge = badgeConfig[village.badge]
  const progressPercent = Math.round((village.hectaresPlanted / village.hectaresPotential) * 100)

  return (
    <section className="relative overflow-hidden">
      {/* Background with subtle texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orb */}
        <div
          className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br ${badge.gradient} opacity-20 blur-3xl`}
        />
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5 blur-3xl" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Diagonal accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent transform -skew-x-12" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <span className="hover:text-white transition-colors cursor-pointer">Villages Nourriciers</span>
          <span className="text-stone-600">/</span>
          <span className="text-white">{village.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Village info */}
          <div>
            {/* Badge chip */}
            <div className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r ${badge.gradient} text-white
              text-sm font-semibold mb-6 shadow-lg
            `}>
              <span className="text-lg">{badge.emoji}</span>
              {badge.label}
            </div>

            {/* Village name */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight leading-[0.95]">
              {village.name}
            </h1>

            {/* Location */}
            <p className="text-xl text-stone-300 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {village.region}, {village.country}
            </p>

            {/* Ambassador */}
            {village.ambassadorName && (
              <div className="flex items-center gap-3 mb-8 py-3 px-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {village.ambassadorName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Ambassadeur</p>
                  <p className="text-white font-medium">{village.ambassadorName}</p>
                </div>
              </div>
            )}

            {/* CTA */}
            {!isCurrentUserVillage && (
              <button
                onClick={onJoinVillage}
                className="
                  group inline-flex items-center gap-3 px-8 py-4 rounded-2xl
                  bg-white text-stone-900 font-semibold text-lg
                  shadow-xl shadow-black/20
                  hover:bg-stone-50 hover:scale-[1.02]
                  transition-all duration-300
                "
              >
                Rejoindre {village.name}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: Progress visualization */}
          <div className="relative">
            {/* Progress card */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${badge.gradient} opacity-10 blur-2xl`} />

              {/* Main progress circle */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-white/10"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercent * 5.53} ${553}`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{progressPercent}%</span>
                    <span className="text-sm text-stone-400">du potentiel</span>
                  </div>
                </div>
              </div>

              {/* Hectare details */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-3xl font-bold text-white mb-1 tabular-nums">
                    {village.hectaresPlanted.toFixed(1)}
                  </div>
                  <div className="text-sm text-stone-400">ha plantés</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl">
                  <div className="text-3xl font-bold text-emerald-400 mb-1 tabular-nums">
                    {village.hectaresPotential.toFixed(1)}
                  </div>
                  <div className="text-sm text-stone-400">ha potentiel</div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className={`
                px-6 py-3 rounded-full shadow-2xl
                bg-gradient-to-r ${badge.gradient} text-white
                font-semibold text-sm
              `}>
                {badge.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 80V40C360 70 720 20 1080 40C1260 50 1380 60 1440 60V80H0Z"
            className="fill-stone-50 dark:fill-stone-950"
          />
        </svg>
      </div>
    </section>
  )
}
