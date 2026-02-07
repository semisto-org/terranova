import { useState } from 'react'
import type {
  ContributeViewProps,
  Campaign,
  WishlistItem,
  Worksite,
} from '../types'
import { CampaignDetailCard } from './CampaignDetailCard'
import { WishlistGrid } from './WishlistGrid'
import { WorksiteSignupCard } from './WorksiteSignupCard'

type ViewMode = 'campaigns' | 'wishlist' | 'worksites'
type CampaignFilter = 'all' | 'high' | 'completed'

export function ContributeView({
  campaigns,
  wishlistItems,
  worksites,
  currentCitizen,
  onDonateToCampaign,
  onFundWishlistItem,
  onJoinWorksite,
  onLeaveWorksite,
}: ContributeViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('campaigns')
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all')

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (campaignFilter === 'high') return c.urgencyLevel === 'high' && c.status === 'active'
    if (campaignFilter === 'completed') return c.status === 'completed'
    return c.status === 'active'
  })

  // Calculate totals for hero stats
  const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0)
  const totalContributors = campaigns.reduce((sum, c) => sum + c.contributorsCount, 0)
  const totalWishlistFunded = wishlistItems.filter(w => w.status === 'funded').length
  const upcomingWorksites = worksites.filter(w => w.status === 'upcoming' || w.status === 'full')

  // Check if user has joined any worksites
  const joinedWorksiteIds = currentCitizen
    ? worksites.filter(w => w.participantIds.includes(currentCitizen.id)).map(w => w.id)
    : []

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden">
        {/* Dramatic gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 blur-3xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Diagonal accent line */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent transform skew-x-12" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-emerald-400/60 to-transparent" />
            <span className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase">
              Contribuer
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
            Chaque geste compte.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Chaque don transforme.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-300 max-w-2xl mb-10 leading-relaxed">
            Financez les projets qui font pousser l'avenir, équipez les bénévoles,
            et rejoignez les chantiers qui transforment nos villages.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
                {totalRaised.toLocaleString('fr-FR')}€
              </div>
              <div className="text-sm text-stone-400 group-hover:text-emerald-400 transition-colors">
                collectés cette année
              </div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
                {totalContributors}
              </div>
              <div className="text-sm text-stone-400 group-hover:text-emerald-400 transition-colors">
                contributeurs
              </div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
                {totalWishlistFunded}
              </div>
              <div className="text-sm text-stone-400 group-hover:text-emerald-400 transition-colors">
                besoins financés
              </div>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">
                {upcomingWorksites.length}
              </div>
              <div className="text-sm text-stone-400 group-hover:text-emerald-400 transition-colors">
                chantiers à venir
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z"
              className="fill-stone-50 dark:fill-stone-950"
            />
          </svg>
        </div>
      </section>

      {/* ========== NAVIGATION TABS ========== */}
      <section className="sticky top-[58px] z-30 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'campaigns', label: 'Campagnes', count: campaigns.filter(c => c.status === 'active').length, icon: '🎯' },
              { key: 'wishlist', label: 'Wishlist', count: wishlistItems.filter(w => w.status !== 'funded').length, icon: '🎁' },
              { key: 'worksites', label: 'Chantiers', count: upcomingWorksites.length, icon: '🌱' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as ViewMode)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap
                  transition-all duration-200
                  ${viewMode === tab.key
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`
                  ml-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${viewMode === tab.key
                    ? 'bg-white/20 dark:bg-stone-900/30 text-white dark:text-stone-900'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Campaigns View */}
        {viewMode === 'campaigns' && (
          <div className="space-y-8">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'Toutes les campagnes' },
                { key: 'high', label: 'Urgentes', dot: 'bg-red-500' },
                { key: 'completed', label: 'Terminées', dot: 'bg-emerald-500' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setCampaignFilter(filter.key as CampaignFilter)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 border
                    ${campaignFilter === filter.key
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    }
                  `}
                >
                  {filter.dot && (
                    <span className={`w-2 h-2 rounded-full ${filter.dot}`} />
                  )}
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Campaign cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCampaigns.map((campaign, index) => (
                <CampaignDetailCard
                  key={campaign.id}
                  campaign={campaign}
                  featured={index === 0 && campaignFilter !== 'completed'}
                  onDonate={(amount) => onDonateToCampaign?.(campaign.id, amount)}
                />
              ))}
            </div>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-stone-600 dark:text-stone-400">
                  {campaignFilter === 'completed'
                    ? 'Aucune campagne terminée pour l\'instant.'
                    : 'Aucune campagne urgente en ce moment. Bonne nouvelle !'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wishlist View */}
        {viewMode === 'wishlist' && (
          <WishlistGrid
            items={wishlistItems}
            onFundItem={onFundWishlistItem}
          />
        )}

        {/* Worksites View */}
        {viewMode === 'worksites' && (
          <div className="space-y-8">
            {/* Intro text */}
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-3">
                Rejoignez les Food Forest Heroes
              </h2>
              <p className="text-stone-600 dark:text-stone-400">
                Participez aux chantiers de plantation et contribuez concrètement
                à la transformation de nos villages. Outils et repas fournis !
              </p>
            </div>

            {/* Worksite cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worksites
                .filter(w => w.status === 'upcoming' || w.status === 'full')
                .map((worksite) => (
                  <WorksiteSignupCard
                    key={worksite.id}
                    worksite={worksite}
                    isJoined={joinedWorksiteIds.includes(worksite.id)}
                    onJoin={() => onJoinWorksite?.(worksite.id)}
                    onLeave={() => onLeaveWorksite?.(worksite.id)}
                  />
                ))}
            </div>

            {worksites.filter(w => w.status === 'upcoming' || w.status === 'full').length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-stone-600 dark:text-stone-400 mb-4">
                  Aucun chantier programmé pour l'instant.
                </p>
                <p className="text-sm text-stone-500">
                  Inscrivez-vous aux alertes pour être prévenu des prochains événements.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========== BOTTOM CTA SECTION ========== */}
      <section className="bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl mb-6 shadow-lg shadow-emerald-500/25">
            💚
          </div>

          <h2 className="text-3xl font-bold text-stone-900 dark:text-white mb-4">
            D'autres façons de contribuer
          </h2>

          <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto">
            Vous avez du matériel, des compétences ou du temps à offrir ?
            Explorez toutes les manières de soutenir le mouvement Villages Nourriciers.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="
              inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-stone-900 dark:bg-white text-white dark:text-stone-900
              font-semibold text-sm
              hover:bg-stone-800 dark:hover:bg-stone-100
              shadow-lg shadow-stone-900/20 dark:shadow-white/10
              transition-all duration-200 hover:scale-[1.02]
            ">
              <span>📦</span>
              Donner du matériel
            </button>
            <button className="
              inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-white dark:bg-stone-800 text-stone-900 dark:text-white
              font-semibold text-sm border border-stone-200 dark:border-stone-700
              hover:bg-stone-50 dark:hover:bg-stone-700
              transition-all duration-200
            ">
              <span>🧑‍🌾</span>
              Partager une compétence
            </button>
            <button className="
              inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-white dark:bg-stone-800 text-stone-900 dark:text-white
              font-semibold text-sm border border-stone-200 dark:border-stone-700
              hover:bg-stone-50 dark:hover:bg-stone-700
              transition-all duration-200
            ">
              <span>🏢</span>
              Mécénat d'entreprise
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
