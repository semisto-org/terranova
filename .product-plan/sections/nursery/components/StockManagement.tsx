import { useState, useMemo } from 'react'
import type { StockManagementProps, StockBatch, GrowthStage } from '../types'
import { StockBatchRow } from './StockBatchRow'
import { StockBatchForm } from './StockBatchForm'
import { Plus, Filter, X, Search } from 'lucide-react'

export function StockManagement({
  batches,
  nurseries,
  containers,
  onView,
  onCreate,
  onEdit,
  onDelete,
  onFilter,
}: StockManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState<StockBatch | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    nurseryId?: string
    speciesId?: string
    containerId?: string
    stage?: GrowthStage
  }>({})

  // Get unique species and varieties from batches
  const speciesList = useMemo(() => {
    const species = new Set<string>()
    batches.forEach((batch) => {
      species.add(batch.speciesId)
    })
    return Array.from(species)
  }, [batches])

  // Filter batches based on search and filters
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          batch.speciesName.toLowerCase().includes(query) ||
          batch.varietyName?.toLowerCase().includes(query) ||
          containers.find((c) => c.id === batch.containerId)?.name.toLowerCase().includes(query) ||
          nurseries.find((n) => n.id === batch.nurseryId)?.name.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Nursery filter
      if (filters.nurseryId && batch.nurseryId !== filters.nurseryId) return false

      // Container filter
      if (filters.containerId && batch.containerId !== filters.containerId) return false

      // Growth stage filter
      if (filters.stage && batch.growthStage !== filters.stage) return false

      return true
    })
  }, [batches, searchQuery, filters, containers, nurseries])

  const handleFilterChange = (key: keyof typeof filters, value: string | GrowthStage | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  const handleCreate = () => {
    setEditingBatch(null)
    setShowForm(true)
  }

  const handleEdit = (batch: StockBatch) => {
    setEditingBatch(batch)
    setShowForm(true)
  }

  const handleSave = (data: Omit<StockBatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBatch) {
      onEdit?.(editingBatch.id)
    } else {
      onCreate?.()
    }
    setShowForm(false)
    setEditingBatch(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBatch(null)
  }

  const clearFilters = () => {
    setFilters({})
    onFilter?.({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  const growthStageLabels: Record<GrowthStage, string> = {
    seed: 'Graine',
    seedling: 'Semis',
    young: 'Jeune',
    established: 'Établi',
    mature: 'Mature',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            Gestion du stock
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {filteredBatches.length} lot{filteredBatches.length !== 1 ? 's' : ''} trouvé{filteredBatches.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-[#EF9B0D] hover:bg-[#d88a0b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Créer un lot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par espèce, variété, contenant ou pépinière..."
              className="w-full pl-10 pr-4 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Nursery filter */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Pépinière
              </label>
              <select
                value={filters.nurseryId || ''}
                onChange={(e) => handleFilterChange('nurseryId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Toutes les pépinières</option>
                {nurseries.map((nursery) => (
                  <option key={nursery.id} value={nursery.id}>
                    {nursery.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Container filter */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Contenant
              </label>
              <select
                value={filters.containerId || ''}
                onChange={(e) => handleFilterChange('containerId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Tous les contenants</option>
                {containers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Growth stage filter */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Stade de développement
              </label>
              <select
                value={filters.stage || ''}
                onChange={(e) => handleFilterChange('stage', e.target.value as GrowthStage | undefined)}
                className="w-full px-3 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Tous les stades</option>
                {Object.entries(growthStageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table/List */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-12 text-center">
          <p className="text-stone-500 dark:text-stone-400">
            {hasActiveFilters
              ? 'Aucun lot ne correspond aux filtres sélectionnés.'
              : 'Aucun lot en stock pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-[#fbe6c3] dark:bg-[#fbe6c3]/10 border-b border-stone-200 dark:border-stone-800">
            <div className="col-span-3 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Espèce / Variété
            </div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Pépinière
            </div>
            <div className="col-span-1 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Contenant
            </div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Quantités
            </div>
            <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Prix
            </div>
            <div className="col-span-1 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
              Stade
            </div>
            <div className="col-span-1" />
          </div>

          {/* Batches list */}
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {filteredBatches.map((batch) => {
              const container = containers.find((c) => c.id === batch.containerId)
              const nursery = nurseries.find((n) => n.id === batch.nurseryId)
              return (
                <StockBatchRow
                  key={batch.id}
                  batch={batch}
                  containerName={container?.name || batch.containerId}
                  nurseryName={nursery?.name || batch.nurseryId}
                  onView={() => onView?.(batch.id)}
                  onEdit={() => handleEdit(batch)}
                  onDelete={() => onDelete?.(batch.id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <StockBatchForm
          batch={editingBatch}
          nurseries={nurseries}
          containers={containers}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

