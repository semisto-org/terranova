import { useState } from 'react'
import type { MarketplaceViewProps, Surplus, SurplusCategory, ExchangeMode } from '../types'
import { SurplusCard } from './SurplusCard'

const categoryLabels: Record<SurplusCategory, string> = {
  fruits: 'Fruits',
  greffons: 'Greffons',
  boutures: 'Boutures',
  semences: 'Semences',
  transforme: 'Transformé',
}

const categoryIcons: Record<SurplusCategory, React.ReactNode> = {
  fruits: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C12 2 8 6 8 10c0 2.21 1.79 4 4 4s4-1.79 4-4c0-4-4-8-4-8z" />
      <path d="M12 14v8" strokeLinecap="round" />
      <path d="M9 18c-2 0-3-1-3-3" strokeLinecap="round" />
    </svg>
  ),
  greffons: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 17L17 7" strokeLinecap="round" />
      <path d="M4 20l3-3" strokeLinecap="round" />
      <path d="M17 4c2 2 2 4 0 6" strokeLinecap="round" />
      <path d="M20 7l-3 3" strokeLinecap="round" />
    </svg>
  ),
  boutures: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V8" strokeLinecap="round" />
      <path d="M8 12c-2-2-2-4 0-6" strokeLinecap="round" />
      <path d="M16 12c2-2 2-4 0-6" strokeLinecap="round" />
      <path d="M12 8c0-4 0-6 0-6" strokeLinecap="round" />
    </svg>
  ),
  semences: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" strokeLinecap="round" />
      <path d="M12 18v4" strokeLinecap="round" />
      <path d="M4.93 4.93l2.83 2.83" strokeLinecap="round" />
      <path d="M16.24 16.24l2.83 2.83" strokeLinecap="round" />
    </svg>
  ),
  transforme: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2v4" strokeLinecap="round" />
      <path d="M16 2v4" strokeLinecap="round" />
      <rect x="4" y="6" width="16" height="16" rx="2" />
      <path d="M8 10h8" strokeLinecap="round" />
    </svg>
  ),
}

const exchangeModeLabels: Record<ExchangeMode, string> = {
  don: 'Don',
  troc: 'Troc',
  vente: 'Vente',
}

export function MarketplaceView({
  surpluses,
  citizens,
  currentVillageIds,
  onContactSeller,
  onReserveSurplus,
  onAddSurplus,
}: MarketplaceViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<SurplusCategory | 'all'>('all')
  const [selectedMode, setSelectedMode] = useState<ExchangeMode | 'all'>('all')
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Get citizen by ID helper
  const getCitizen = (citizenId: string) => citizens.find(c => c.id === citizenId)

  // Filter surpluses
  const filteredSurpluses = surpluses.filter(surplus => {
    if (selectedCategory !== 'all' && surplus.category !== selectedCategory) return false
    if (selectedMode !== 'all' && surplus.exchangeMode !== selectedMode) return false
    if (showNearbyOnly && currentVillageIds.length > 0 && !currentVillageIds.includes(surplus.villageId)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        surplus.title.toLowerCase().includes(query) ||
        surplus.description.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Group by exchange mode for the featured section
  const donations = surpluses.filter(s => s.exchangeMode === 'don').slice(0, 2)

  // Categories with counts
  const categoryCounts = Object.keys(categoryLabels).reduce((acc, cat) => {
    acc[cat as SurplusCategory] = surpluses.filter(s => s.category === cat).length
    return acc
  }, {} as Record<SurplusCategory, number>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 dark:from-stone-950 dark:via-stone-950 dark:to-stone-900">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/30 to-amber-200/20 dark:from-orange-900/10 dark:to-amber-900/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-green-200/20 to-lime-200/10 dark:from-green-900/10 dark:to-lime-900/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium mb-3 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {surpluses.filter(s => s.status === 'available').length} surplus disponibles
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight mb-2">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Marché Local
                </span>
              </h1>

              <p className="text-stone-600 dark:text-stone-400 max-w-xl">
                Partagez vos surplus de récolte, greffons et boutures avec la communauté.
                Don, troc ou vente entre voisins.
              </p>
            </div>

            {/* Add surplus button */}
            <button
              onClick={onAddSurplus}
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-2xl
                bg-gradient-to-r from-amber-500 to-orange-500
                hover:from-amber-600 hover:to-orange-600
                text-white font-semibold shadow-lg shadow-amber-500/25
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                sm:self-auto self-start
              "
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Proposer un surplus
            </button>
          </div>

          {/* Featured donations banner */}
          {donations.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 p-6 mb-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23fff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M20%2020c0-5.5%204.5-10%2010-10v20H20v-10z%22%2F%3E%3Cpath%20d%3D%22M0%2020c0%205.5%204.5%2010%2010%2010V10H0v10z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Dons disponibles
                  </h2>
                  <p className="text-green-100 text-sm">
                    {donations.length} membre{donations.length > 1 ? 's' : ''} offre{donations.length > 1 ? 'nt' : ''} généreusement leurs surplus
                  </p>
                </div>

                <div className="flex gap-3">
                  {donations.map(surplus => {
                    const citizen = getCitizen(surplus.citizenId)
                    return (
                      <button
                        key={surplus.id}
                        onClick={() => onContactSeller?.(surplus.id)}
                        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
                      >
                        <img
                          src={citizen?.avatarUrl}
                          alt={citizen?.firstName}
                          className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                        />
                        <div className="text-left hidden sm:block">
                          <p className="text-white font-medium text-sm truncate max-w-[120px]">
                            {surplus.title}
                          </p>
                          <p className="text-green-100 text-xs">
                            par {citizen?.firstName}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Search and filters */}
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un surplus..."
                className="
                  w-full pl-12 pr-4 py-3.5 rounded-2xl
                  bg-white dark:bg-stone-900
                  border border-stone-200 dark:border-stone-700
                  text-stone-900 dark:text-white
                  placeholder:text-stone-400 dark:placeholder:text-stone-500
                  focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                  transition-all duration-200
                "
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${selectedCategory === 'all'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-600'
                    }
                  `}
                >
                  Tout
                </button>
                {(Object.keys(categoryLabels) as SurplusCategory[]).map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${selectedCategory === category
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-600'
                      }
                    `}
                  >
                    {categoryIcons[category]}
                    {categoryLabels[category]}
                    <span className={`
                      px-1.5 py-0.5 rounded-md text-xs
                      ${selectedCategory === category
                        ? 'bg-white/20'
                        : 'bg-stone-100 dark:bg-stone-700'
                      }
                    `}>
                      {categoryCounts[category]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-700" />

              {/* Exchange mode filter */}
              <div className="flex gap-2">
                {(['all', 'don', 'troc', 'vente'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`
                      px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${selectedMode === mode
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }
                    `}
                  >
                    {mode === 'all' ? 'Tous types' : exchangeModeLabels[mode]}
                  </button>
                ))}
              </div>

              {/* Nearby toggle */}
              {currentVillageIds.length > 0 && (
                <>
                  <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <button
                    onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${showNearbyOnly
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-green-300 dark:hover:border-green-600'
                      }
                    `}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Près de chez moi
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-900 dark:text-white">{filteredSurpluses.length}</span>
            {' '}surplus trouvé{filteredSurpluses.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Surplus grid */}
        {filteredSurpluses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredSurpluses.map((surplus, index) => {
              const citizen = getCitizen(surplus.citizenId)
              return (
                <SurplusCard
                  key={surplus.id}
                  surplus={surplus}
                  citizen={citizen}
                  onContact={() => onContactSeller?.(surplus.id)}
                  onReserve={() => onReserveSurplus?.(surplus.id)}
                  delay={index * 50}
                />
              )
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
              Aucun surplus trouvé
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-sm mx-auto">
              Modifiez vos filtres ou soyez le premier à proposer un surplus dans cette catégorie !
            </p>

            <button
              onClick={onAddSurplus}
              className="
                inline-flex items-center gap-2 px-5 py-3 rounded-2xl
                bg-gradient-to-r from-amber-500 to-orange-500
                hover:from-amber-600 hover:to-orange-600
                text-white font-semibold shadow-lg shadow-amber-500/25
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
              "
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Proposer un surplus
            </button>
          </div>
        )}

        {/* How it works section */}
        <section className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-800">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white text-center mb-8">
            Comment{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              ça marche ?
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Publiez votre surplus',
                description: 'Photo, description, quantité et mode d\'échange souhaité. C\'est rapide et gratuit !',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: 'amber',
              },
              {
                step: '02',
                title: 'Recevez des demandes',
                description: 'Les membres intéressés vous contactent directement via la messagerie.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                color: 'orange',
              },
              {
                step: '03',
                title: 'Échangez localement',
                description: 'Organisez la remise en main propre et contribuez à l\'économie circulaire locale.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                color: 'green',
              },
            ].map(({ step, title, description, icon, color }) => (
              <div key={step} className="relative group">
                <div className={`
                  absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  bg-gradient-to-r ${color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : color === 'orange' ? 'from-orange-500/20 to-red-500/20' : 'from-green-500/20 to-emerald-500/20'}
                `} />

                <div className="relative p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 h-full">
                  <div className="flex items-start gap-4">
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                      ${color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'}
                    `}>
                      {icon}
                    </div>

                    <div className="flex-1">
                      <span className={`
                        text-xs font-bold uppercase tracking-wider
                        ${color === 'amber' ? 'text-amber-500' : color === 'orange' ? 'text-orange-500' : 'text-green-500'}
                      `}>
                        Étape {step}
                      </span>
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white mt-1 mb-2">
                        {title}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
