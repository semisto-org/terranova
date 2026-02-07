import { useState } from 'react'
import type { LeaderboardViewProps, VillageBadge } from '../types'
import { VillagePodium } from './VillagePodium'
import { VillageRankingRow } from './VillageRankingRow'
import { SeasonalChallengeCard } from './SeasonalChallengeCard'
import { TopContributorCard } from './TopContributorCard'

type SortMetric = 'hectares' | 'citizens' | 'spots' | 'progress'
type ContributorMetric = 'hours' | 'spots' | 'donations'

const badgeOrder: VillageBadge[] = ['resilient', 'nourricier', 'planteur', 'eveil']

export function LeaderboardView({
  villages,
  badges,
  challenges,
  topCitizens,
  onViewVillage,
  onViewChallenge,
}: LeaderboardViewProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>('hectares')
  const [contributorMetric, setContributorMetric] = useState<ContributorMetric>('hours')

  // Sort villages by selected metric
  const sortedVillages = [...villages].sort((a, b) => {
    switch (sortMetric) {
      case 'hectares':
        return b.hectaresPlanted - a.hectaresPlanted
      case 'citizens':
        return b.activeCitizens - a.activeCitizens
      case 'spots':
        return b.spotsPlanted - a.spotsPlanted
      case 'progress':
        const progressA = a.hectaresPlanted / a.hectaresPotential
        const progressB = b.hectaresPlanted / b.hectaresPotential
        return progressB - progressA
      default:
        return 0
    }
  })

  // Sort contributors by selected metric
  const sortedContributors = [...topCitizens].sort((a, b) => {
    switch (contributorMetric) {
      case 'hours':
        return b.hoursContributed - a.hoursContributed
      case 'spots':
        return b.spotsReported - a.spotsReported
      case 'donations':
        return b.totalDonations - a.totalDonations
      default:
        return 0
    }
  })

  const [first, second, third, ...rest] = sortedVillages
  const villageBadges = badges.filter(b => b.type === 'village')

  // Separate challenges by status
  const activeChallenges = challenges.filter(c => c.status === 'active')
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming')
  const completedChallenges = challenges.filter(c => c.status === 'completed')

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-green-50/30 dark:from-stone-950 dark:via-stone-950 dark:to-stone-900">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-amber-200/40 to-yellow-100/30 dark:from-amber-900/20 dark:to-yellow-900/10 blur-3xl" />
          <div className="absolute top-40 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-100/20 dark:from-green-900/10 dark:to-emerald-900/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4">
              <span className="text-lg">🏆</span>
              Classement des Villages Nourriciers
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight">
              Hall of{' '}
              <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Fame
              </span>
            </h1>

            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
              Découvrez les villages champions et les héros qui transforment l'Europe
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="text-sm text-stone-500 dark:text-stone-400 mr-2">Trier par :</span>
            {[
              { key: 'hectares', label: 'Hectares plantés', icon: '🌳' },
              { key: 'progress', label: 'Progression', icon: '📈' },
              { key: 'citizens', label: 'Citoyens actifs', icon: '👥' },
              { key: 'spots', label: 'Sites plantés', icon: '📍' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setSortMetric(option.key as SortMetric)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${sortMetric === option.key
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                  }
                `}
              >
                <span>{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Podium */}
          {first && second && third && (
            <VillagePodium
              first={first}
              second={second}
              third={third}
              onViewVillage={onViewVillage}
            />
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Full Rankings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Village Rankings */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>🏅</span>
                  Classement complet
                </h2>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {villages.length} villages
                </span>
              </div>

              <div className="space-y-3">
                {rest.map((village, index) => (
                  <VillageRankingRow
                    key={village.id}
                    village={village}
                    rank={index + 4}
                    onView={() => onViewVillage?.(village.id)}
                  />
                ))}
              </div>
            </div>

            {/* Seasonal Challenges */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>⚔️</span>
                  Défis saisonniers
                </h2>
              </div>

              {/* Active Challenges */}
              {activeChallenges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">
                    En cours
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeChallenges.map(challenge => (
                      <SeasonalChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onView={() => onViewChallenge?.(challenge.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Challenges */}
              {upcomingChallenges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3">
                    À venir
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingChallenges.map(challenge => (
                      <SeasonalChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onView={() => onViewChallenge?.(challenge.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Challenges */}
              {completedChallenges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                    Terminés
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completedChallenges.map(challenge => (
                      <SeasonalChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onView={() => onViewChallenge?.(challenge.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Badges & Top Contributors */}
          <div className="space-y-8">
            {/* Village Badge Progression */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>🎖️</span>
                  Badges de village
                </h3>
              </div>

              <div className="p-5 space-y-4">
                {villageBadges.sort((a, b) => {
                  const orderA = badgeOrder.indexOf(a.name.toLowerCase().replace(' ', '-') as VillageBadge)
                  const orderB = badgeOrder.indexOf(b.name.toLowerCase().replace(' ', '-') as VillageBadge)
                  return orderA - orderB
                }).map((badge, index) => (
                  <div key={badge.id} className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${badge.color}20` }}
                    >
                      {index === 0 ? '🏆' : index === 1 ? '🌳' : index === 2 ? '🌿' : '🌱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 dark:text-white text-sm">
                        {badge.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {badge.description}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                        {badge.criteria}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700">
                <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <span>⭐</span>
                  Top contributeurs
                </h3>
              </div>

              {/* Metric selector */}
              <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex gap-2">
                {[
                  { key: 'hours', label: 'Heures' },
                  { key: 'spots', label: 'Spots' },
                  { key: 'donations', label: 'Dons' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setContributorMetric(option.key as ContributorMetric)}
                    className={`
                      flex-1 px-2 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${contributorMetric === option.key
                        ? 'bg-green-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-2">
                {sortedContributors.slice(0, 5).map((citizen, index) => (
                  <TopContributorCard
                    key={citizen.id}
                    citizen={citizen}
                    rank={index + 1}
                    metric={contributorMetric}
                    onView={() => {}}
                  />
                ))}
              </div>
            </div>

            {/* Join CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -left-5 -bottom-5 w-24 h-24 rounded-full bg-white/5" />

              <div className="relative">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-bold text-xl mb-2">Faites grimper votre village !</h3>
                <p className="text-green-100 text-sm mb-4">
                  Cartographiez des spots, participez aux chantiers et contribuez pour faire monter votre village dans le classement.
                </p>
                <button className="
                  w-full py-2.5 px-4 rounded-xl font-semibold text-sm
                  bg-white text-green-600
                  hover:bg-green-50
                  shadow-lg shadow-black/20
                  transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                ">
                  Rejoindre un village
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
