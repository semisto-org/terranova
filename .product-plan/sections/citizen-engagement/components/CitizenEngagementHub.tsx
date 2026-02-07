import type { CitizenEngagementHubProps } from '../types'
import { ImpactCounter } from './ImpactCounter'
import { CampaignCard } from './CampaignCard'
import { ActivityFeed } from './ActivityFeed'
import { WorksiteCard } from './WorksiteCard'
import { QuickActionCard } from './QuickActionCard'

export function CitizenEngagementHub({
  impactStats,
  recentActivity,
  campaigns,
  worksites,
  events,
  currentCitizen,
  onNavigateToMap,
  onNavigateToContribute,
  onViewCampaign,
  onJoinWorksite,
  onViewEvent,
}: CitizenEngagementHubProps) {
  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 3)
  const upcomingWorksites = worksites.filter(w => w.status === 'upcoming' || w.status === 'full').slice(0, 3)
  const urgentCampaign = campaigns.find(c => c.urgencyLevel === 'high' && c.status === 'active')

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-stone-50 dark:from-stone-950 dark:via-stone-950 dark:to-stone-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-200/40 to-emerald-300/30 dark:from-green-900/20 dark:to-emerald-900/10 blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-lime-200/30 to-green-200/20 dark:from-lime-900/10 dark:to-green-900/5 blur-3xl" />

          {/* Floating leaves decoration */}
          <svg className="absolute top-10 right-10 w-8 h-8 text-green-300/50 dark:text-green-700/30 animate-float-slow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
          <svg className="absolute top-32 left-1/4 w-6 h-6 text-lime-300/40 dark:text-lime-700/20 animate-float-medium" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Welcome message */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {impactStats.activeCitizens.toLocaleString('fr-BE')} citoyens actifs
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
              Villages{' '}
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                Nourriciers
              </span>
            </h1>

            <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
              Ensemble, transformons l'Europe en forêt comestible.
              Cartographiez, plantez, parrainez.
            </p>
          </div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <ImpactCounter
              value={impactStats.treesPlanted}
              label="Arbres plantés"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              color="green"
              delay={0}
            />
            <ImpactCounter
              value={impactStats.hectaresPlanted}
              label="Hectares plantés"
              unit="ha"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              color="emerald"
              delay={100}
            />
            <ImpactCounter
              value={impactStats.activeVillages}
              label="Villages actifs"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              color="lime"
              delay={200}
            />
            <ImpactCounter
              value={impactStats.co2Captured}
              label="Tonnes CO₂ captées"
              unit="t"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="teal"
              delay={300}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Explorer la carte"
              description="Découvrez les villages et spots"
              color="green"
              onClick={onNavigateToMap}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <QuickActionCard
              title="Contribuer"
              description="Donnez, plantez, parrainez"
              color="amber"
              onClick={onNavigateToContribute}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
            />
            <QuickActionCard
              title="Rejoindre un chantier"
              description="Plantez avec nous"
              color="violet"
              onClick={() => onJoinWorksite?.(upcomingWorksites[0]?.id)}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <QuickActionCard
              title="Classement"
              description="Villages & défis"
              color="rose"
              onClick={() => {}}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaigns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Urgent Campaign Highlight */}
            {urgentCampaign && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold animate-pulse">
                      Besoin urgent
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-2">{urgentCampaign.title}</h2>
                  <p className="text-white/80 mb-4 line-clamp-2">{urgentCampaign.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">
                      {urgentCampaign.currentAmount.toLocaleString('fr-BE')} €
                    </span>
                    <span className="text-white/70">
                      sur {urgentCampaign.goalAmount.toLocaleString('fr-BE')} €
                    </span>
                  </div>

                  <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round((urgentCampaign.currentAmount / urgentCampaign.goalAmount) * 100)}%` }}
                    />
                  </div>

                  <button
                    onClick={() => onViewCampaign?.(urgentCampaign.id)}
                    className="
                      px-6 py-3 rounded-xl font-semibold
                      bg-white text-orange-600
                      hover:bg-orange-50
                      shadow-lg shadow-black/20
                      transition-all duration-200
                      hover:scale-[1.02] active:scale-[0.98]
                    "
                  >
                    Je contribue maintenant
                  </button>
                </div>
              </div>
            )}

            {/* Campaigns Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                  Campagnes en cours
                </h2>
                <button
                  onClick={onNavigateToContribute}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1"
                >
                  Voir toutes
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeCampaigns.filter(c => c.id !== urgentCampaign?.id).map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onView={() => onViewCampaign?.(campaign.id)}
                    onDonate={() => onViewCampaign?.(campaign.id)}
                  />
                ))}
              </div>
            </div>

            {/* Worksites Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                  Prochains chantiers
                </h2>
                <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center gap-1">
                  Calendrier complet
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingWorksites.map(worksite => (
                  <WorksiteCard
                    key={worksite.id}
                    worksite={worksite}
                    onJoin={() => onJoinWorksite?.(worksite.id)}
                    onView={() => onJoinWorksite?.(worksite.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Events */}
          <div className="space-y-6">
            {/* User Welcome Card (if logged in) */}
            {currentCitizen && (
              <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={currentCitizen.avatarUrl}
                    alt={`${currentCitizen.firstName} ${currentCitizen.lastName}`}
                    className="w-14 h-14 rounded-full border-2 border-white/30 object-cover"
                  />
                  <div>
                    <p className="text-white/70 text-sm">Bienvenue,</p>
                    <p className="font-semibold text-lg">{currentCitizen.firstName} !</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 rounded-xl py-2">
                    <p className="text-2xl font-bold">{currentCitizen.badges.length}</p>
                    <p className="text-xs text-white/70">badges</p>
                  </div>
                  <div className="bg-white/10 rounded-xl py-2">
                    <p className="text-2xl font-bold">{currentCitizen.spotsReported}</p>
                    <p className="text-xs text-white/70">spots</p>
                  </div>
                  <div className="bg-white/10 rounded-xl py-2">
                    <p className="text-2xl font-bold">{currentCitizen.hoursContributed}h</p>
                    <p className="text-xs text-white/70">bénévolat</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <ActivityFeed activities={recentActivity} maxItems={6} />

            {/* Upcoming Events */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700">
                <h3 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Événements à venir
                </h3>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {events.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    onClick={() => onViewEvent?.(event.id)}
                    className="w-full px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex-shrink-0">
                        <span className="text-xs font-medium uppercase">
                          {new Date(event.date).toLocaleDateString('fr-BE', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 dark:text-white text-sm truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {event.location}
                        </p>
                      </div>

                      <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA for visitors */}
            {!currentCitizen && (
              <div className="rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-800 dark:to-stone-900 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">Rejoignez le mouvement</h3>
                </div>

                <p className="text-stone-300 text-sm mb-5">
                  Créez votre compte gratuit pour cartographier des spots, rejoindre des chantiers et gagner des badges !
                </p>

                <button className="
                  w-full py-3 px-4 rounded-xl font-semibold
                  bg-gradient-to-r from-green-500 to-emerald-600
                  hover:from-green-600 hover:to-emerald-700
                  text-white shadow-lg shadow-green-500/25
                  transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                ">
                  Créer mon compte
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating animation styles */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4s ease-in-out infinite 1s; }
      `}</style>
    </div>
  )
}
