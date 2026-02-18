export function CatalogItem({ speciesName, varietyName, batches, nurseries, containers, onSelectBatch }) {
  const batchesByNursery = batches.reduce((acc, batch) => {
    const nursery = nurseries.find((n) => n.id === batch.nurseryId)
    if (!nursery) return acc
    if (!acc[nursery.id]) acc[nursery.id] = { nursery, batches: [] }
    acc[nursery.id].batches.push(batch)
    return acc
  }, {})

  const fullName = varietyName ? `${speciesName} '${varietyName}'` : speciesName

  return (
    <div className="group border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-[#EF9B0D]/30">
      <div className="px-4 py-3 bg-gradient-to-r from-[#fbe6c3]/50 to-transparent border-b border-stone-200">
        <h3 className="font-serif text-lg font-semibold text-stone-900">{fullName}</h3>
        {varietyName && <p className="text-sm text-stone-600 mt-0.5">{speciesName}</p>}
      </div>
      <div className="divide-y divide-stone-100">
        {Object.values(batchesByNursery).map(({ nursery, batches: nurseryBatches }) => (
          <div key={nursery.id} className="px-4 py-3 hover:bg-stone-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-stone-900">{nursery.name}</h4>
                  {nursery.integration === 'platform' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Temps réel</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Manuel</span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{nursery.city}</p>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              {nurseryBatches.map((batch) => {
                const container = containers.find((c) => c.id === batch.containerId)
                return (
                  <div key={batch.id} className="flex items-center justify-between p-2 rounded-md bg-stone-50 border border-stone-200 hover:border-[#EF9B0D]/50 hover:bg-[#fbe6c3]/20 transition-all cursor-pointer group/item" onClick={() => onSelectBatch?.(batch.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900">{container?.name || batch.containerId}</span>
                        {nursery.integration === 'platform' ? (
                          <span className="text-xs text-stone-600">{batch.availableQuantity} disponible{batch.availableQuantity > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Disponible</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-stone-900">{batch.priceEuros.toFixed(2)} €</span>
                        {batch.acceptsSemos && batch.priceSemos && <span className="text-xs text-stone-600">ou {batch.priceSemos} Semos</span>}
                      </div>
                    </div>
                    <button className="ml-3 px-3 py-1.5 text-xs font-medium rounded-md bg-[#EF9B0D] text-white hover:bg-[#EF9B0D]/90 transition-colors opacity-0 group-hover/item:opacity-100" onClick={(e) => { e.stopPropagation(); onSelectBatch?.(batch.id) }}>
                      Sélectionner
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
