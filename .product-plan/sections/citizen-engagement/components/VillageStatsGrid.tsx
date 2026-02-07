import type { Village, Spot, Citizen, Worksite, Event as VillageEvent } from '../types'

interface VillageStatsGridProps {
  village: Village
  spots: Spot[]
  citizens: Citizen[]
  worksites: Worksite[]
  events: VillageEvent[]
}

export function VillageStatsGrid({ village, spots, citizens, worksites, events }: VillageStatsGridProps) {
  const spotsPlanted = spots.filter(s => s.status === 'plante').length
  const spotsValidated = spots.filter(s => s.status === 'valide').length
  const spotsPending = spots.filter(s => s.status === 'identifie').length
  const upcomingWorksites = worksites.filter(w => w.status === 'upcoming' || w.status === 'full').length
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length

  // Calculate total length of hedges
  const hedgeLength = spots
    .filter(s => s.type === 'haie' && s.lengthMeters)
    .reduce((sum, s) => sum + (s.lengthMeters || 0), 0)

  // Calculate total area of surfaces
  const surfaceArea = spots
    .filter(s => s.type === 'surface' && s.areaSquareMeters)
    .reduce((sum, s) => sum + (s.areaSquareMeters || 0), 0)

  const stats = [
    {
      label: 'Citoyens actifs',
      value: village.activeCitizens,
      icon: '👥',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Sites plantés',
      value: spotsPlanted,
      suffix: `/${village.spotsIdentified}`,
      icon: '🌳',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'En attente',
      value: spotsPending + spotsValidated,
      icon: '📋',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Événements à venir',
      value: upcomingWorksites + upcomingEvents,
      icon: '📅',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`
              relative overflow-hidden rounded-2xl p-6
              ${stat.bgColor}
              border border-stone-200/50 dark:border-stone-700/50
              group hover:scale-[1.02] transition-transform duration-300
            `}
          >
            {/* Background gradient on hover */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0
              group-hover:opacity-5 transition-opacity duration-300
            `} />

            {/* Icon */}
            <div className="text-2xl mb-3">{stat.icon}</div>

            {/* Value */}
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${stat.textColor} tabular-nums`}>
                {stat.value}
              </span>
              {stat.suffix && (
                <span className="text-lg text-stone-400 dark:text-stone-500 tabular-nums">
                  {stat.suffix}
                </span>
              )}
            </div>

            {/* Label */}
            <div className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spot types breakdown */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
            Types de sites
          </h3>

          <div className="space-y-4">
            {[
              { type: 'Haies', icon: '🌿', count: spots.filter(s => s.type === 'haie').length, metric: `${(hedgeLength / 1000).toFixed(1)} km` },
              { type: 'Surfaces', icon: '🌳', count: spots.filter(s => s.type === 'surface').length, metric: `${(surfaceArea / 10000).toFixed(2)} ha` },
              { type: 'Arbres isolés', icon: '🌲', count: spots.filter(s => s.type === 'arbre_isole').length, metric: null },
            ].map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-stone-700 dark:text-stone-300">{item.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-stone-900 dark:text-white">{item.count}</span>
                  {item.metric && (
                    <span className="text-sm text-stone-500 ml-2">({item.metric})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress pipeline */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
            Pipeline
          </h3>

          <div className="space-y-3">
            {[
              { status: 'Identifiés', count: spotsPending, color: 'bg-stone-300 dark:bg-stone-600' },
              { status: 'Validés', count: spotsValidated, color: 'bg-amber-400' },
              { status: 'Assignés', count: spots.filter(s => s.status === 'assigne').length, color: 'bg-blue-500' },
              { status: 'Plantés', count: spotsPlanted, color: 'bg-emerald-500' },
            ].map((item) => {
              const percent = spots.length > 0 ? (item.count / spots.length) * 100 : 0
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-stone-600 dark:text-stone-400">{item.status}</div>
                  <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm font-medium text-stone-900 dark:text-white tabular-nums">
                    {item.count}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
            Historique
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Rejoint le</p>
                <p className="font-medium text-stone-900 dark:text-white">
                  {new Date(village.joinedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="text-lg">⏱️</span>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Depuis</p>
                <p className="font-medium text-stone-900 dark:text-white">
                  {Math.floor((Date.now() - new Date(village.joinedAt).getTime()) / (1000 * 60 * 60 * 24))} jours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Progression</p>
                <p className="font-medium text-stone-900 dark:text-white">
                  {village.badgeProgress}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
