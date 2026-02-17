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
        ? 'bg-[#AFBD00]/5 border-[#AFBD00]/30'
        : 'bg-stone-50 border-stone-200'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={() => onNurserySelect?.(stock.nurseryId)}
          className="font-medium text-stone-900 hover:text-[#5B5781] transition-colors text-left"
        >
          {stock.nurseryName}
        </button>
        {isAvailable ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-[#AFBD00]/20 text-[#7a8200] rounded-full">
            En stock
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-stone-200 text-stone-600 rounded-full">
            Rupture
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-stone-500">Quantité</div>
        <div className="text-stone-900 font-medium">
          {isAvailable ? `${stock.quantity} disponibles` : 'Indisponible'}
        </div>

        {stock.rootstock && (
          <>
            <div className="text-stone-500">Porte-greffe</div>
            <div className="text-stone-900">{stock.rootstock}</div>
          </>
        )}

        <div className="text-stone-500">Âge</div>
        <div className="text-stone-900">{stock.age}</div>

        <div className="text-stone-500">Prix</div>
        <div className="text-stone-900 font-medium">
          {stock.price.toFixed(2)} €
        </div>
      </div>
    </div>
  )
}
