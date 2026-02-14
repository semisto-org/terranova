import type { NurseryStock } from '../types'

interface NurseryStockCardProps {
  stock: NurseryStock
  onNurserySelect?: (nurseryId: string) => void
}

export function NurseryStockCard({ stock, onNurserySelect }: NurseryStockCardProps) {
  const isAvailable = stock.quantity > 0

  return (
    <div className={`rounded-xl p-4 border ${
      isAvailable
        ? 'bg-[#AFBD00]/5 border-[#AFBD00]/30 dark:bg-[#AFBD00]/10 dark:border-[#AFBD00]/40'
        : 'bg-stone-50 border-stone-200 dark:bg-stone-800/50 dark:border-stone-700'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={() => onNurserySelect?.(stock.nurseryId)}
          className="font-medium text-stone-900 dark:text-stone-100 hover:text-[#5B5781] dark:hover:text-[#a89ec4] transition-colors text-left"
        >
          {stock.nurseryName}
        </button>
        {isAvailable ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-[#AFBD00]/20 text-[#7a8200] dark:text-[#d4e34d] rounded-full">
            En stock
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-400 rounded-full">
            Rupture
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-stone-500 dark:text-stone-400">Quantité</div>
        <div className="text-stone-900 dark:text-stone-100 font-medium">
          {isAvailable ? `${stock.quantity} disponibles` : 'Indisponible'}
        </div>

        {stock.rootstock && (
          <>
            <div className="text-stone-500 dark:text-stone-400">Porte-greffe</div>
            <div className="text-stone-900 dark:text-stone-100">{stock.rootstock}</div>
          </>
        )}

        <div className="text-stone-500 dark:text-stone-400">Âge</div>
        <div className="text-stone-900 dark:text-stone-100">{stock.age}</div>

        <div className="text-stone-500 dark:text-stone-400">Prix</div>
        <div className="text-stone-900 dark:text-stone-100 font-medium">
          {stock.price.toFixed(2)} €
        </div>
      </div>
    </div>
  )
}
