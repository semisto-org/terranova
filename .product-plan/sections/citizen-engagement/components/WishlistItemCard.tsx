import type { WishlistItem } from '../types'

interface WishlistItemCardProps {
  item: WishlistItem
  onFund?: () => void
}

export function WishlistItemCard({ item, onFund }: WishlistItemCardProps) {
  const isFunded = item.status === 'funded'
  const progress = Math.round((item.quantityFunded / item.quantity) * 100)

  const categoryEmojis: Record<string, string> = {
    livre: '📚',
    outil: '🔧',
    materiel: '📦',
    logistique: '🚐',
    communication: '📣',
  }

  return (
    <div
      className={`
        group relative flex items-center gap-4 p-4 rounded-xl
        bg-white dark:bg-stone-900
        border border-stone-200 dark:border-stone-700
        hover:shadow-md hover:border-green-300 dark:hover:border-green-700
        transition-all duration-200
        ${isFunded ? 'opacity-60' : ''}
      `}
    >
      {/* Image */}
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {isFunded && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{categoryEmojis[item.category] || '📦'}</span>
          <h4 className="font-medium text-stone-900 dark:text-white text-sm truncate">
            {item.title}
          </h4>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1 mb-2">
          {item.description}
        </p>

        {/* Progress mini bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFunded ? 'bg-green-500' : 'bg-lime-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            {item.quantityFunded}/{item.quantity}
          </span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-lg font-bold text-stone-900 dark:text-white">
          {item.price}€
        </span>

        {!isFunded && (
          <button
            onClick={onFund}
            className="
              px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-green-500 hover:bg-green-600 text-white
              shadow-sm shadow-green-500/25
              transition-all duration-200
              hover:shadow-md hover:shadow-green-500/30
              active:scale-95
            "
          >
            Offrir
          </button>
        )}

        {isFunded && (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
            Financé
          </span>
        )}
      </div>
    </div>
  )
}
