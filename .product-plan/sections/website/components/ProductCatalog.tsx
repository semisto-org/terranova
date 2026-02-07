import { useState, useMemo } from 'react'
import type { ProductCatalogProps, ProductType } from '../types'
import { ProductCard } from './ProductCard'

type FilterState = {
  type: ProductType | 'all'
  category: string | 'all'
}

const PRODUCT_TYPES: { value: ProductType | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Tout', emoji: '✨' },
  { value: 'plant', label: 'Plantes', emoji: '🌱' },
  { value: 'book', label: 'Livres', emoji: '📚' },
  { value: 'tool', label: 'Outillage', emoji: '🔧' },
  { value: 'educational', label: 'Pédagogie', emoji: '🎓' },
]

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  BE: { name: 'Belgique', flag: '🇧🇪' },
  FR: { name: 'France', flag: '🇫🇷' },
  DE: { name: 'Allemagne', flag: '🇩🇪' },
  ES: { name: 'Espagne', flag: '🇪🇸' },
}

export function ProductCatalog({
  products,
  currentCountry,
  availableCountries,
  cartItemCount,
  onProductView,
  onAddToCart,
  onCartOpen,
  onCountryChange,
  onFilter
}: ProductCatalogProps) {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    category: 'all'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach(p => cats.add(p.category))
    return Array.from(cats).sort()
  }, [products])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Country filter
      if (!product.countries.includes(currentCountry)) {
        return false
      }
      // Type filter
      if (filters.type !== 'all' && product.type !== filters.type) {
        return false
      }
      // Category filter
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [products, currentCountry, filters, searchQuery])

  const handleTypeFilter = (type: ProductType | 'all') => {
    const newFilters = { ...filters, type }
    setFilters(newFilters)
    onFilter?.({
      type: newFilters.type === 'all' ? undefined : newFilters.type,
      category: newFilters.category === 'all' ? undefined : newFilters.category
    })
  }

  const handleCategoryFilter = (category: string | 'all') => {
    const newFilters = { ...filters, category }
    setFilters(newFilters)
    onFilter?.({
      type: newFilters.type === 'all' ? undefined : newFilters.type,
      category: newFilters.category === 'all' ? undefined : newFilters.category
    })
  }

  const totalProducts = filteredProducts.length

  return (
    <div className="min-h-screen bg-[#f5f3ef] dark:bg-stone-950">
      {/* Hero Section with rich botanical texture */}
      <section className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(165deg, #3d5a3d 0%, #2d4a2d 40%, #1d3a1d 100%)'
            }}
          />

          {/* Paper texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Large botanical silhouettes */}
          <svg
            className="absolute -left-20 top-1/2 -translate-y-1/2 w-[500px] h-[500px] text-white/[0.04]"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M100 10c-40 60-90 90-90 140 0 30 40 40 90 40s90-10 90-40c0-50-50-80-90-140z" />
            <path d="M100 30c-30 45-70 70-70 110 0 20 30 30 70 30s70-10 70-30c0-40-40-65-70-110z" opacity="0.5" />
          </svg>
          <svg
            className="absolute -right-10 -top-10 w-[400px] h-[400px] text-white/[0.03] rotate-45"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M100 10c-40 60-90 90-90 140 0 30 40 40 90 40s90-10 90-40c0-50-50-80-90-140z" />
          </svg>
          <svg
            className="absolute right-1/4 bottom-0 w-[300px] h-[300px] text-white/[0.02] -rotate-12"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path d="M100 10c-40 60-90 90-90 140 0 30 40 40 90 40s90-10 90-40c0-50-50-80-90-140z" />
          </svg>

          {/* Decorative circles */}
          <div className="absolute top-20 right-[15%] w-64 h-64 rounded-full bg-[#AFBD00]/10 blur-3xl" />
          <div className="absolute bottom-0 left-[20%] w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              {/* Nursery badge */}
              <div className="inline-flex items-center gap-3 mb-8">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: '#AFBD00' }}
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-6.5-8-12a8 8 0 1116 0c0 5.5-4 8-8 12z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 0c-2-2-4-3-6-3m6 3c2-2 4-3 6-3" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#AFBD00] font-bold text-sm uppercase tracking-wider">Pépinière Semisto</p>
                  <p className="text-white/60 text-sm">Retrait en {COUNTRIES[currentCountry]?.name || currentCountry}</p>
                </div>
              </div>

              {/* Title with decorative elements */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                La boutique des
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10" style={{ color: '#AFBD00' }}>jardins-forêts</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-4"
                    viewBox="0 0 200 16"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 12 Q40 2, 100 12 T200 12"
                      fill="none"
                      stroke="#AFBD00"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-lg">
                Arbres fruitiers, petits fruits, plantes compagnes, livres de référence
                et outils de qualité — tout pour créer votre écosystème comestible.
              </p>

              {/* Country selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-white/50 text-sm">Retrait :</span>
                {availableCountries.map(code => (
                  <button
                    key={code}
                    onClick={() => onCountryChange?.(code)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      currentCountry === code
                        ? 'bg-white text-stone-900 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg">{COUNTRIES[code]?.flag}</span>
                    {COUNTRIES[code]?.name || code}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side - Stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { value: '380+', label: 'espèces', icon: '🌿' },
                { value: '12', label: 'produits', suffix: ' disponibles', icon: '📦' },
                { value: '4', label: 'pépinières', suffix: ' partenaires', icon: '🏡' },
                { value: '100%', label: 'local', suffix: ' & bio', icon: '🌍' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="relative p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden group hover:bg-white/15 transition-colors"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-3xl mb-3 block">{stat.icon}</span>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-white/60 text-sm">
                    {stat.label}
                    {stat.suffix && <span className="text-white/40">{stat.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organic curved divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z"
              className="fill-[#f5f3ef] dark:fill-stone-950"
            />
          </svg>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-0 z-40 bg-[#f5f3ef]/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Type filter pills */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {PRODUCT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleTypeFilter(type.value)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    filters.type === type.value
                      ? 'bg-[#5B5781] text-white shadow-lg shadow-[#5B5781]/20'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span>{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>

            {/* Cart button */}
            <button
              onClick={onCartOpen}
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#AFBD00] text-stone-900 hover:bg-[#9eac00] transition-all shadow-lg shadow-[#AFBD00]/20 ml-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Panier
              {cartItemCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 text-white text-xs font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Search and category */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] transition-all"
              />
            </div>

            {/* Category dropdown */}
            <select
              value={filters.category}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] cursor-pointer transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378716c'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '40px'
              }}
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="capitalize">{cat}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#5B5781] text-white'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#5B5781] text-white'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </button>
            </div>

            {/* Results count */}
            <span className="text-sm text-stone-500 dark:text-stone-400 whitespace-nowrap">
              {totalProducts} produit{totalProducts > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <div className={`grid gap-8 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1 max-w-3xl mx-auto'
            }`}>
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard
                    product={product}
                    onView={() => onProductView?.(product.id)}
                    onAddToCart={(qty) => onAddToCart?.(product.id, qty)}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-24">
              <div className="relative inline-block mb-8">
                <div
                  className="w-32 h-32 rounded-full mx-auto flex items-center justify-center"
                  style={{ backgroundColor: '#e1e6d8' }}
                >
                  <svg className="w-16 h-16" fill="none" stroke="#AFBD00" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-6.5-8-12a8 8 0 1116 0c0 5.5-4 8-8 12z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 0c-2-2-4-3-6-3m6 3c2-2 4-3 6-3" />
                  </svg>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#AFBD00]/20" />
                <div className="absolute -bottom-1 -left-4 w-6 h-6 rounded-full bg-[#5B5781]/20" />
              </div>

              <h3
                className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3"
                style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
              >
                Aucun produit trouvé
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-md mx-auto">
                Essayez de modifier vos filtres ou de sélectionner un autre pays de retrait
                pour voir plus de produits disponibles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setFilters({ type: 'all', category: 'all' })
                    setSearchQuery('')
                    onFilter?.({})
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: '#5B5781' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info banner */}
      <section className="py-16 px-6 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                title: 'Retrait local',
                description: 'Récupérez vos commandes dans la pépinière Semisto la plus proche'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                ),
                title: 'Qualité garantie',
                description: 'Plants sains, livres neufs et outils professionnels sélectionnés'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: 'Conseils experts',
                description: 'Notre équipe vous guide dans le choix des plantes adaptées'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                  </svg>
                ),
                title: 'Impact positif',
                description: 'Chaque achat soutient le développement des jardins-forêts'
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: '#e1e6d8', color: '#5B5781' }}
                >
                  {item.icon}
                </div>
                <h3
                  className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2"
                  style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
                >
                  {item.title}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile cart button */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button
          onClick={onCartOpen}
          className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: '#AFBD00' }}
        >
          <svg className="w-7 h-7 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[#5B5781] text-white text-xs font-bold ring-2 ring-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
