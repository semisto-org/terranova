import type { StockBatch, Nursery, Container } from '../types'

interface CatalogItemProps {
  speciesName: string
  varietyName?: string
  batches: StockBatch[]
  nurseries: Nursery[]
  containers: Container[]
  onSelectBatch?: (batchId: string) => void
}

export function CatalogItem({
  speciesName,
  varietyName,
  batches,
  nurseries,
  containers,
  onSelectBatch
}: CatalogItemProps) {
  // Grouper les lots par pépinière
  const batchesByNursery = batches.reduce((acc, batch) => {
    const nursery = nurseries.find(n => n.id === batch.nurseryId)
    if (!nursery) return acc
    
    if (!acc[nursery.id]) {
      acc[nursery.id] = {
        nursery,
        batches: []
      }
    }
    acc[nursery.id].batches.push(batch)
    return acc
  }, {} as Record<string, { nursery: Nursery; batches: StockBatch[] }>)

  const fullName = varietyName 
    ? `${speciesName} '${varietyName}'`
    : speciesName

  return (
    <div className="group border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-[#EF9B0D]/30">
      {/* En-tête de l'espèce */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#fbe6c3]/50 to-transparent dark:from-[#fbe6c3]/10 border-b border-stone-200 dark:border-stone-700">
        <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
          {fullName}
        </h3>
        {varietyName && (
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            {speciesName}
          </p>
        )}
      </div>

      {/* Liste des pépinières */}
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Object.values(batchesByNursery).map(({ nursery, batches: nurseryBatches }) => {
          const hasPlatform = nursery.integration === 'platform'
          
          return (
            <div
              key={nursery.id}
              className="px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
            >
              {/* En-tête pépinière */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-stone-900 dark:text-stone-100">
                      {nursery.name}
                    </h4>
                    {hasPlatform ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Temps réel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Manuel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {nursery.city}
                  </p>
                </div>
              </div>

              {/* Lots disponibles */}
              <div className="space-y-2 mt-3">
                {nurseryBatches.map((batch) => {
                  const container = containers.find(c => c.id === batch.containerId)
                  const containerName = container?.name || batch.containerId
                  
                  return (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-2 rounded-md bg-stone-50 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-700 hover:border-[#EF9B0D]/50 hover:bg-[#fbe6c3]/20 dark:hover:bg-[#fbe6c3]/5 transition-all cursor-pointer group/item"
                      onClick={() => onSelectBatch?.(batch.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                            {containerName}
                          </span>
                          {hasPlatform ? (
                            <span className="text-xs text-stone-600 dark:text-stone-400">
                              {batch.availableQuantity} disponible{batch.availableQuantity > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              Disponible
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {batch.priceEuros.toFixed(2)} €
                          </span>
                          {batch.acceptsSemos && batch.priceSemos && (
                            <span className="text-xs text-stone-600 dark:text-stone-400">
                              ou {batch.priceSemos} Semos
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="ml-3 px-3 py-1.5 text-xs font-medium rounded-md bg-[#EF9B0D] text-white hover:bg-[#EF9B0D]/90 dark:bg-[#EF9B0D] dark:hover:bg-[#EF9B0D]/90 transition-colors opacity-0 group-hover/item:opacity-100 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectBatch?.(batch.id)
                        }}
                      >
                        Sélectionner
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

