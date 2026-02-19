import { Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'

const growthStageLabels = {
  seed: 'Graine',
  seedling: 'Semis',
  young: 'Jeune',
  established: 'Établi',
  mature: 'Mature',
}

export function StockBatchRow({ batch, containerName, nurseryName, onView, onEdit, onDelete }) {
  const isLowStock = batch.availableQuantity <= 10
  const stockPercentage = batch.quantity > 0 ? (batch.availableQuantity / batch.quantity) * 100 : 0

  return (
    <div className="group relative">
      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center py-4 px-4 border-b border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        <div className="col-span-3">
          <div className="font-medium text-stone-900 dark:text-stone-100">{batch.speciesName}</div>
          {batch.varietyName && <div className="text-sm text-stone-600 dark:text-stone-400">{batch.varietyName}</div>}
        </div>
        <div className="col-span-2 text-sm text-stone-600 dark:text-stone-400">{nurseryName}</div>
        <div className="col-span-1 text-sm text-stone-600 dark:text-stone-400">{containerName}</div>
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{batch.availableQuantity}</div>
              <div className="text-xs text-stone-500">{batch.reservedQuantity > 0 ? `${batch.reservedQuantity} réservé` : `sur ${batch.quantity}`}</div>
            </div>
            {isLowStock && <AlertTriangle className="w-4 h-4 text-[#EF9B0D] flex-shrink-0" />}
          </div>
          <div className="mt-1 h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${stockPercentage > 50 ? 'bg-green-500' : stockPercentage > 25 ? 'bg-[#EF9B0D]' : 'bg-red-500'}`} style={{ width: `${Math.min(stockPercentage, 100)}%` }} />
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{batch.priceEuros.toFixed(2)} €</div>
          {batch.acceptsSemos && batch.priceSemos && <div className="text-xs text-stone-500">{batch.priceSemos} Semos</div>}
        </div>
        <div className="col-span-1">
          {batch.growthStage && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#fbe6c3] dark:bg-[#fbe6c3]/20 text-[#EF9B0D] border border-[#EF9B0D]/20">
              {growthStageLabels[batch.growthStage] || batch.growthStage}
            </span>
          )}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="p-1.5 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"><Eye className="w-4 h-4" /></button>
          <button onClick={onEdit} className="p-1.5 rounded-md text-stone-500 hover:text-[#EF9B0D] hover:bg-[#fbe6c3]/50 transition-colors"><Edit className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="font-medium text-stone-900 dark:text-stone-100 mb-1">{batch.speciesName}</div>
            {batch.varietyName && <div className="text-sm text-stone-600 dark:text-stone-400 mb-2">{batch.varietyName}</div>}
            <div className="text-xs text-stone-500">{nurseryName} • {containerName}</div>
          </div>
          {isLowStock && <AlertTriangle className="w-5 h-5 text-[#EF9B0D] flex-shrink-0" />}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-stone-500 mb-1">Stock</div>
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{batch.availableQuantity} disponible</div>
            {batch.reservedQuantity > 0 && <div className="text-xs text-stone-500">{batch.reservedQuantity} réservé</div>}
            <div className="mt-1 h-1 bg-stone-200 rounded-full overflow-hidden">
              <div className={`h-full ${stockPercentage > 50 ? 'bg-green-500' : stockPercentage > 25 ? 'bg-[#EF9B0D]' : 'bg-red-500'}`} style={{ width: `${Math.min(stockPercentage, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 mb-1">Prix</div>
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{batch.priceEuros.toFixed(2)} €</div>
            {batch.acceptsSemos && batch.priceSemos && <div className="text-xs text-stone-500">{batch.priceSemos} Semos</div>}
          </div>
        </div>
        {batch.growthStage && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#fbe6c3] text-[#EF9B0D] border border-[#EF9B0D]/20">
              {growthStageLabels[batch.growthStage] || batch.growthStage}
            </span>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
          <button onClick={onView} className="px-3 py-1.5 text-sm rounded-md text-stone-600 hover:bg-stone-100 transition-colors">Voir</button>
          <button onClick={onEdit} className="px-3 py-1.5 text-sm rounded-md text-[#EF9B0D] hover:bg-[#fbe6c3]/50 transition-colors">Modifier</button>
          <button onClick={onDelete} className="px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors">Supprimer</button>
        </div>
      </div>
    </div>
  )
}
