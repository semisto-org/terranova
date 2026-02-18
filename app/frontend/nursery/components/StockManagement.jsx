import { useState, useMemo } from 'react'
import { StockBatchRow } from './StockBatchRow'
import { StockBatchForm } from './StockBatchForm'
import { Plus, Search, X } from 'lucide-react'

const growthStageLabels = {
  seed: 'Graine', seedling: 'Semis', young: 'Jeune', established: 'Établi', mature: 'Mature',
}

export function StockManagement({ batches, nurseries, containers, onSaveBatch, onDeleteBatch }) {
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = batch.speciesName.toLowerCase().includes(q) ||
          batch.varietyName?.toLowerCase().includes(q) ||
          containers.find((c) => c.id === batch.containerId)?.name.toLowerCase().includes(q) ||
          nurseries.find((n) => n.id === batch.nurseryId)?.name.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.nurseryId && batch.nurseryId !== filters.nurseryId) return false
      if (filters.containerId && batch.containerId !== filters.containerId) return false
      if (filters.stage && batch.growthStage !== filters.stage) return false
      return true
    })
  }, [batches, searchQuery, filters, containers, nurseries])

  const handleCreate = () => { setEditingBatch(null); setShowForm(true) }
  const handleEdit = (batch) => { setEditingBatch(batch); setShowForm(true) }
  const handleSave = (data) => {
    onSaveBatch(data, editingBatch?.id)
    setShowForm(false)
    setEditingBatch(null)
  }
  const handleCancel = () => { setShowForm(false); setEditingBatch(null) }
  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  const clearFilters = () => { setFilters({}); setSearchQuery('') }
  const hasActiveFilters = Object.values(filters).some(Boolean) || searchQuery.length > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Sole Serif Small, serif' }}>Gestion du stock</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{filteredBatches.length} lot{filteredBatches.length !== 1 ? 's' : ''} trouvé{filteredBatches.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2">
          <Plus className="w-4 h-4" />Créer un lot
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher par espèce, variété, contenant ou pépinière..." className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">Pépinière</label>
              <select value={filters.nurseryId || ''} onChange={(e) => handleFilterChange('nurseryId', e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent">
                <option value="">Toutes les pépinières</option>
                {nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">Contenant</label>
              <select value={filters.containerId || ''} onChange={(e) => handleFilterChange('containerId', e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent">
                <option value="">Tous les contenants</option>
                {containers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">Stade</label>
              <select value={filters.stage || ''} onChange={(e) => handleFilterChange('stage', e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent">
                <option value="">Tous les stades</option>
                {Object.entries(growthStageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-stone-50 transition-colors">
                  <X className="w-4 h-4" />Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-12 text-center">
          <p className="text-stone-500 dark:text-stone-400">{hasActiveFilters ? 'Aucun lot ne correspond aux filtres.' : 'Aucun lot en stock.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[#fbe6c3] dark:bg-[#fbe6c3]/10 border-b border-stone-200 dark:border-stone-800">
            <div className="col-span-3 text-xs font-semibold text-stone-700 uppercase tracking-wide">Espèce / Variété</div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">Pépinière</div>
            <div className="col-span-1 text-xs font-semibold text-stone-700 uppercase tracking-wide">Contenant</div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">Quantités</div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wide">Prix</div>
            <div className="col-span-1 text-xs font-semibold text-stone-700 uppercase tracking-wide">Stade</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {filteredBatches.map((batch) => (
              <StockBatchRow
                key={batch.id}
                batch={batch}
                containerName={containers.find((c) => c.id === batch.containerId)?.name || batch.containerId}
                nurseryName={nurseries.find((n) => n.id === batch.nurseryId)?.name || batch.nurseryId}
                onView={() => {}}
                onEdit={() => handleEdit(batch)}
                onDelete={() => onDeleteBatch(batch.id)}
              />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <StockBatchForm batch={editingBatch} nurseries={nurseries} containers={containers} onSave={handleSave} onCancel={handleCancel} />
      )}
    </div>
  )
}
