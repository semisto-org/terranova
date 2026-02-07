import { useState } from 'react'
import type { WishlistItem, WishlistCategory } from '../types'
import { Gift, Check, Package, Sparkles } from 'lucide-react'

interface WishlistGridProps {
  items: WishlistItem[]
  onFundItem?: (itemId: string, quantity: number) => void
}

const categoryConfig: Record<WishlistCategory, { label: string; icon: string; color: string }> = {
  livre: { label: 'Livres', icon: '📚', color: 'bg-blue-500' },
  outil: { label: 'Outils', icon: '🔧', color: 'bg-amber-500' },
  materiel: { label: 'Matériel', icon: '📦', color: 'bg-emerald-500' },
  logistique: { label: 'Logistique', icon: '🚚', color: 'bg-purple-500' },
  communication: { label: 'Communication', icon: '📢', color: 'bg-pink-500' },
}

export function WishlistGrid({ items, onFundItem }: WishlistGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<WishlistCategory | 'all'>('all')
  const [fundingItemId, setFundingItemId] = useState<string | null>(null)
  const [fundQuantity, setFundQuantity] = useState(1)

  // Get unique categories from items
  const categories = [...new Set(items.map(item => item.category))]

  // Filter items
  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory)

  // Sort: available first, then partial, then funded
  const sortedItems = [...filteredItems].sort((a, b) => {
    const order = { available: 0, partial: 1, funded: 2 }
    return order[a.status] - order[b.status]
  })

  const handleFund = (itemId: string) => {
    onFundItem?.(itemId, fundQuantity)
    setFundingItemId(null)
    setFundQuantity(1)
  }

  // Stats
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const fundedItems = items.reduce((sum, i) => sum + i.quantityFunded, 0)
  const totalValue = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
  const fundedValue = items.reduce((sum, i) => sum + (i.price * i.quantityFunded), 0)

  return (
    <div className="space-y-8">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            La Wishlist
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Équipez les bénévoles et les ambassadeurs avec le matériel dont ils ont besoin.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200/50 dark:border-emerald-700/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {fundedItems}/{totalItems}
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">items</div>
          </div>
          <div className="w-px h-10 bg-emerald-200 dark:bg-emerald-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {fundedValue.toLocaleString('fr-FR')}€
            </div>
            <div className="text-xs text-stone-500 dark:text-stone-400">sur {totalValue.toLocaleString('fr-FR')}€</div>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
            ${selectedCategory === 'all'
              ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
            }
          `}
        >
          Tous
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${selectedCategory === category
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
              }
            `}
          >
            <span>{categoryConfig[category]?.icon || '📦'}</span>
            {categoryConfig[category]?.label || category}
          </button>
        ))}
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedItems.map((item) => {
          const config = categoryConfig[item.category]
          const isFunded = item.status === 'funded'
          const remaining = item.quantity - item.quantityFunded
          const progressPercent = (item.quantityFunded / item.quantity) * 100

          return (
            <article
              key={item.id}
              className={`
                group relative overflow-hidden rounded-2xl
                bg-white dark:bg-stone-900
                border border-stone-200 dark:border-stone-700
                transition-all duration-300
                ${isFunded
                  ? 'opacity-60'
                  : 'hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50 hover:border-stone-300 dark:hover:border-stone-600'
                }
              `}
            >
              {/* Image section */}
              <div className="relative h-40 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <div className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white
                    ${config?.color || 'bg-stone-500'}
                  `}>
                    <span>{config?.icon || '📦'}</span>
                    {config?.label || item.category}
                  </div>
                </div>

                {/* Funded overlay */}
                {isFunded && (
                  <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Check className="w-10 h-10 mx-auto mb-1" strokeWidth={3} />
                      <span className="font-bold text-sm">Financé !</span>
                    </div>
                  </div>
                )}

                {/* Price tag */}
                <div className="absolute bottom-3 right-3">
                  <div className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-stone-900 dark:text-white font-bold text-sm">
                    {item.price}€
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-stone-900 dark:text-white mb-1 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-xs text-stone-500 dark:text-stone-400 mb-1.5">
                    <span>{item.quantityFunded} / {item.quantity} financés</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {remaining > 0 ? `${remaining} restants` : 'Complet'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFunded
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action */}
                {!isFunded && (
                  fundingItemId === item.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-600 dark:text-stone-400">Quantité :</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setFundQuantity(Math.max(1, fundQuantity - 1))}
                            className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-stone-900 dark:text-white">
                            {fundQuantity}
                          </span>
                          <button
                            onClick={() => setFundQuantity(Math.min(remaining, fundQuantity + 1))}
                            className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 ml-auto">
                          = {item.price * fundQuantity}€
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFund(item.id)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => {
                            setFundingItemId(null)
                            setFundQuantity(1)
                          }}
                          className="py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFundingItemId(item.id)}
                      className="
                        w-full py-2.5 rounded-xl
                        bg-gradient-to-r from-amber-500 to-orange-500
                        text-white font-semibold text-sm
                        hover:from-amber-400 hover:to-orange-400
                        shadow-lg shadow-amber-500/20
                        transition-all duration-200 hover:scale-[1.02]
                        flex items-center justify-center gap-2
                      "
                    >
                      <Gift className="w-4 h-4" />
                      Financer cet item
                    </button>
                  )
                )}
              </div>
            </article>
          )
        })}
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-stone-600 dark:text-stone-400">
            Aucun item dans cette catégorie.
          </p>
        </div>
      )}

      {/* Suggestion CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-900 p-6 sm:p-8 border border-stone-200 dark:border-stone-700">
        {/* Decorative */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-2xl">
              💡
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-900 dark:text-white mb-1">
              Vous avez une idée de besoin ?
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Proposez un item à ajouter à la wishlist pour équiper nos bénévoles.
            </p>
          </div>
          <button className="
            px-5 py-2.5 rounded-xl
            bg-stone-900 dark:bg-white text-white dark:text-stone-900
            font-semibold text-sm
            hover:bg-stone-800 dark:hover:bg-stone-100
            transition-colors whitespace-nowrap
          ">
            Suggérer un item
          </button>
        </div>
      </div>
    </div>
  )
}
