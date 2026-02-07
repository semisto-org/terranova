import { useState } from 'react'
import type {
  VillageDetailProps,
  Spot,
  Citizen,
} from '../types'
import { VillageHero } from './VillageHero'
import { VillageStatsGrid } from './VillageStatsGrid'
import { SpotListCard } from './SpotListCard'
import { CitizenAvatarRow } from './CitizenAvatarRow'
import { VillageEventCard } from './VillageEventCard'

type TabView = 'overview' | 'spots' | 'citizens' | 'events'
type SpotFilter = 'all' | 'identifie' | 'valide' | 'plante'

export function VillageDetail({
  village,
  spots,
  citizens,
  worksites,
  events,
  currentCitizen,
  onJoinVillage,
  onViewSpot,
  onViewCitizen,
}: VillageDetailProps) {
  const [activeTab, setActiveTab] = useState<TabView>('overview')
  const [spotFilter, setSpotFilter] = useState<SpotFilter>('all')

  // Filter spots
  const filteredSpots = spots.filter(spot => {
    if (spotFilter === 'all') return true
    return spot.status === spotFilter
  })

  // Sort citizens by contribution
  const sortedCitizens = [...citizens].sort((a, b) => {
    const scoreA = a.hoursContributed + a.spotsReported * 2 + a.worksitesAttended * 5
    const scoreB = b.hoursContributed + b.spotsReported * 2 + b.worksitesAttended * 5
    return scoreB - scoreA
  })

  // Combine and sort upcoming events
  const allEvents = [
    ...worksites.map(w => ({ type: 'worksite' as const, data: w })),
    ...events.map(e => ({ type: 'event' as const, data: e })),
  ]
    .filter(item => new Date(item.data.date) > new Date())
    .sort((a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime())

  // Check if current user is in this village
  const isCurrentUserVillage = currentCitizen?.villageIds.includes(village.id) ?? false

  // Ambassador
  const ambassador = citizens.find(c => c.role === 'ambassadeur')

  // Stats for tab badges
  const spotCounts = {
    all: spots.length,
    identifie: spots.filter(s => s.status === 'identifie').length,
    valide: spots.filter(s => s.status === 'valide').length,
    plante: spots.filter(s => s.status === 'plante').length,
  }

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
    { key: 'spots', label: 'Sites', icon: '🗺️', count: spots.length },
    { key: 'citizens', label: 'Citoyens', icon: '👥', count: citizens.length },
    { key: 'events', label: 'Événements', icon: '📅', count: allEvents.length },
  ]

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero Section */}
      <VillageHero
        village={village}
        onJoinVillage={onJoinVillage}
        isCurrentUserVillage={isCurrentUserVillage}
      />

      {/* Tab Navigation */}
      <div className="sticky top-[58px] z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabView)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap
                  transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                    ${activeTab === tab.key
                      ? 'bg-white/20 dark:bg-stone-900/30 text-white dark:text-stone-900'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <VillageStatsGrid
              village={village}
              spots={spots}
              citizens={citizens}
              worksites={worksites}
              events={events}
            />

            {/* Two-column layout for featured content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent spots */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>🌳</span>
                    Sites récents
                  </h2>
                  <button
                    onClick={() => setActiveTab('spots')}
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Voir tout →
                  </button>
                </div>

                <div className="space-y-3">
                  {spots.slice(0, 3).map(spot => (
                    <SpotListCard
                      key={spot.id}
                      spot={spot}
                      onView={() => onViewSpot?.(spot.id)}
                    />
                  ))}

                  {spots.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                      <div className="text-4xl mb-3">🗺️</div>
                      <p className="text-stone-600 dark:text-stone-400">
                        Aucun site cartographié pour l'instant.
                      </p>
                      <button className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors">
                        Identifier un premier site
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Community highlights */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>⭐</span>
                    Communauté
                  </h2>
                  <button
                    onClick={() => setActiveTab('citizens')}
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Voir tout →
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Ambassador first */}
                  {ambassador && (
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 z-10 px-2 py-1 bg-amber-400 text-white text-xs font-semibold rounded-full shadow-lg">
                        Ambassadeur
                      </div>
                      <CitizenAvatarRow
                        citizen={ambassador}
                        onView={() => onViewCitizen?.(ambassador.id)}
                      />
                    </div>
                  )}

                  {/* Other top contributors */}
                  {sortedCitizens
                    .filter(c => c.id !== ambassador?.id)
                    .slice(0, ambassador ? 2 : 3)
                    .map(citizen => (
                      <CitizenAvatarRow
                        key={citizen.id}
                        citizen={citizen}
                        onView={() => onViewCitizen?.(citizen.id)}
                      />
                    ))}

                  {citizens.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                      <div className="text-4xl mb-3">👥</div>
                      <p className="text-stone-600 dark:text-stone-400">
                        Soyez le premier à rejoindre !
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Upcoming Events */}
            {allEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>📅</span>
                    Prochains événements
                  </h2>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Voir tout →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allEvents.slice(0, 3).map((item) => (
                    <VillageEventCard
                      key={item.data.id}
                      item={item}
                      onView={() => {}}
                      onJoin={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Spots Tab */}
        {activeTab === 'spots' && (
          <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'Tous les sites', count: spotCounts.all },
                { key: 'identifie', label: 'Identifiés', count: spotCounts.identifie, color: 'bg-stone-400' },
                { key: 'valide', label: 'Validés', count: spotCounts.valide, color: 'bg-amber-400' },
                { key: 'plante', label: 'Plantés', count: spotCounts.plante, color: 'bg-emerald-500' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSpotFilter(filter.key as SpotFilter)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 border
                    ${spotFilter === filter.key
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    }
                  `}
                >
                  {filter.color && (
                    <span className={`w-2 h-2 rounded-full ${filter.color}`} />
                  )}
                  {filter.label}
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs
                    ${spotFilter === filter.key
                      ? 'bg-white/20 dark:bg-stone-900/30'
                      : 'bg-stone-100 dark:bg-stone-800'
                    }
                  `}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Spots grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSpots.map(spot => (
                <SpotListCard
                  key={spot.id}
                  spot={spot}
                  onView={() => onViewSpot?.(spot.id)}
                />
              ))}
            </div>

            {filteredSpots.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-stone-600 dark:text-stone-400 mb-4">
                  Aucun site trouvé avec ce filtre.
                </p>
                <button
                  onClick={() => setSpotFilter('all')}
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Voir tous les sites
                </button>
              </div>
            )}
          </div>
        )}

        {/* Citizens Tab */}
        {activeTab === 'citizens' && (
          <div className="space-y-8">
            {/* Header stats */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
              <div>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">
                  {citizens.length} citoyens actifs
                </h2>
                <p className="text-stone-600 dark:text-stone-400">
                  {citizens.reduce((sum, c) => sum + c.hoursContributed, 0)} heures de bénévolat cumulées
                </p>
              </div>

              {!isCurrentUserVillage && (
                <button
                  onClick={onJoinVillage}
                  className="
                    px-6 py-3 rounded-xl
                    bg-emerald-500 text-white font-semibold
                    hover:bg-emerald-600
                    shadow-lg shadow-emerald-500/25
                    transition-all duration-200
                    hover:scale-[1.02]
                  "
                >
                  Rejoindre la communauté
                </button>
              )}
            </div>

            {/* Citizens list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedCitizens.map(citizen => (
                <CitizenAvatarRow
                  key={citizen.id}
                  citizen={citizen}
                  onView={() => onViewCitizen?.(citizen.id)}
                />
              ))}
            </div>

            {citizens.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                  Ce village cherche ses premiers héros !
                </h3>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                  Soyez le pionnier et lancez la dynamique.
                </p>
                <button
                  onClick={onJoinVillage}
                  className="
                    px-6 py-3 rounded-xl
                    bg-emerald-500 text-white font-semibold
                    hover:bg-emerald-600
                    shadow-lg shadow-emerald-500/25
                    transition-all
                  "
                >
                  Devenir le premier membre
                </button>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            {allEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEvents.map((item) => (
                  <VillageEventCard
                    key={item.data.id}
                    item={item}
                    onView={() => {}}
                    onJoin={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                  Pas d'événement prévu pour l'instant
                </h3>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                  Inscrivez-vous aux alertes pour être prévenu des prochains chantiers et événements.
                </p>
                <button className="
                  px-6 py-3 rounded-xl
                  bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold
                  hover:bg-stone-800 dark:hover:bg-stone-100
                  transition-colors
                ">
                  Recevoir les alertes
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating CTA for non-members */}
      {!isCurrentUserVillage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 lg:hidden">
          <button
            onClick={onJoinVillage}
            className="
              flex items-center gap-2 px-6 py-3 rounded-full
              bg-emerald-500 text-white font-semibold
              shadow-2xl shadow-emerald-500/30
              hover:bg-emerald-600
              transition-all
              animate-pulse
            "
          >
            <span>🌱</span>
            Rejoindre {village.name}
          </button>
        </div>
      )}
    </div>
  )
}
