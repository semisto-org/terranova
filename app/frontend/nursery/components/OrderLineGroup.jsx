export function OrderLineGroup({ nurseryId, nurseryName, lines }) {
  const totalEuros = lines.reduce((sum, line) => sum + line.totalEuros, 0)
  const totalSemos = lines.reduce((sum, line) => sum + line.totalSemos, 0)

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 bg-[#fbe6c3] border-b border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <h3 className="font-semibold text-sm text-stone-900">{nurseryName}</h3>
          </div>
          <div className="text-xs text-stone-600">{lines.length} article{lines.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className="divide-y divide-stone-200">
        {lines.map((line) => (
          <div key={line.id} className="px-4 py-3 hover:bg-stone-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-stone-900">{line.speciesName}</span>
                  {line.varietyName && <span className="text-xs text-stone-500">{line.varietyName}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                  <span>{line.containerName}</span><span>•</span><span>Quantité: {line.quantity}</span>
                  {line.payInSemos && <><span>•</span><span className="text-[#EF9B0D] font-medium">Paiement en Semos</span></>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-medium text-stone-900">
                  {line.unitPriceEuros > 0 && `${line.unitPriceEuros.toFixed(2)}€`}
                  {line.unitPriceEuros > 0 && line.unitPriceSemos ? ' / ' : ''}
                  {line.unitPriceSemos ? `${line.unitPriceSemos}S` : ''}
                </div>
                <div className="text-xs text-stone-500 mt-1">× {line.quantity}</div>
                <div className="text-sm font-bold text-stone-900 mt-1">
                  {line.totalEuros > 0 && `${line.totalEuros.toFixed(2)}€`}
                  {line.totalEuros > 0 && line.totalSemos > 0 && ' + '}
                  {line.totalSemos > 0 && `${line.totalSemos}S`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Sous-total {nurseryName}:</span>
          <div className="text-sm font-bold text-stone-900">
            {totalEuros > 0 && `${totalEuros.toFixed(2)}€`}
            {totalEuros > 0 && totalSemos > 0 && ' + '}
            {totalSemos > 0 && `${totalSemos}S`}
          </div>
        </div>
      </div>
    </div>
  )
}
