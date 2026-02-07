import type { Product, ProductType } from '../types'

interface ProductCardProps {
  product: Product
  onView?: () => void
  onAddToCart?: (quantity: number) => void
}

const TYPE_CONFIG: Record<ProductType, { label: string; icon: React.ReactNode; gradient: string }> = {
  plant: {
    label: 'Plante',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-6.5-8-12a8 8 0 1116 0c0 5.5-4 8-8 12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 0c-2-2-4-3-6-3m6 3c2-2 4-3 6-3" />
      </svg>
    ),
    gradient: 'from-emerald-600 to-green-500'
  },
  book: {
    label: 'Livre',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    gradient: 'from-amber-700 to-orange-600'
  },
  tool: {
    label: 'Outil',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    gradient: 'from-stone-600 to-stone-500'
  },
  educational: {
    label: 'Pédagogie',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    gradient: 'from-violet-600 to-purple-500'
  }
}

export function ProductCard({ product, onView, onAddToCart }: ProductCardProps) {
  const config = TYPE_CONFIG[product.type]
  const isLowStock = product.stock <= 10
  const isOutOfStock = product.stock === 0

  // Format specs for display
  const displaySpecs = Object.entries(product.specs).slice(0, 2)

  return (
    <article
      className="group relative flex flex-col h-full"
    >
      {/* Nursery tag hole decoration */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
        <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 border-4 border-white dark:border-stone-900 shadow-inner" />
      </div>

      {/* Main card */}
      <div
        className="relative flex flex-col h-full bg-[#faf9f7] dark:bg-stone-800 rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2"
        style={{
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)'
        }}
      >
        {/* Image area with botanical illustration overlay */}
        <div className="relative aspect-square overflow-hidden">
          {/* Textured background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-90`}
          />

          {/* Botanical pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10c-15 25-35 35-35 60 0 15 15 25 35 25s35-10 35-25c0-25-20-35-35-60z' fill='white'/%3E%3Cpath d='M50 25c-8 15-20 20-20 40 0 10 8 15 20 15s20-5 20-15c0-20-12-25-20-40z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }}
          />

          {/* Decorative corner leaves */}
          <svg
            className="absolute -top-4 -right-4 w-24 h-24 text-white/10 transform rotate-45"
            viewBox="0 0 100 100"
          >
            <path d="M50 5c-20 30-45 45-45 70 0 15 20 20 45 20s45-5 45-20c0-25-25-40-45-70z" fill="currentColor"/>
          </svg>
          <svg
            className="absolute -bottom-6 -left-6 w-20 h-20 text-white/10 transform -rotate-45"
            viewBox="0 0 100 100"
          >
            <path d="M50 5c-20 30-45 45-45 70 0 15 20 20 45 20s45-5 45-20c0-25-25-40-45-70z" fill="currentColor"/>
          </svg>

          {/* Type badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-stone-800 shadow-lg backdrop-blur-sm">
              {config.icon}
              {config.label}
            </span>
          </div>

          {/* Stock indicator */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {product.stock} restants
              </span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute top-4 right-4 z-10">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-900/80 text-white">
                Épuisé
              </span>
            </div>
          )}

          {/* Centered icon placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110">
              <div className="text-white/90 transform scale-[2.5]">
                {config.icon}
              </div>
            </div>
          </div>

          {/* Price tag - diagonal ribbon style */}
          <div className="absolute bottom-0 right-0 overflow-hidden w-28 h-28">
            <div
              className="absolute bottom-6 -right-8 w-36 text-center py-1.5 transform rotate-[-45deg] origin-center bg-white dark:bg-stone-900 shadow-lg"
            >
              <span
                className="text-lg font-black tracking-tight"
                style={{ color: '#5B5781' }}
              >
                {product.price}€
              </span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-col flex-1 p-5">
          {/* Category breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 mb-2">
            <span className="capitalize">{product.category}</span>
            <span>›</span>
            <span className="capitalize">{product.subcategory}</span>
          </div>

          {/* Product name */}
          <h3
            className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug mb-2 line-clamp-2 group-hover:text-[#5B5781] transition-colors"
            style={{ fontFamily: '"Sole Serif Small", Georgia, serif' }}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2 mb-4">
            {product.description}
          </p>

          {/* Specs tags */}
          {displaySpecs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {displaySpecs.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                  <span className="text-stone-400 dark:text-stone-500 mr-1 capitalize">{key}:</span>
                  {value}
                </span>
              ))}
            </div>
          )}

          {/* Action area */}
          <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-700 flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(1)
              }}
              disabled={isOutOfStock}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                isOutOfStock
                  ? 'bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  : 'bg-[#5B5781] text-white hover:bg-[#4a4669] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {isOutOfStock ? 'Épuisé' : 'Ajouter'}
            </button>

            <button
              onClick={onView}
              className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-[#5B5781] hover:text-[#5B5781] transition-all hover:scale-105"
              title="Voir les détails"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
