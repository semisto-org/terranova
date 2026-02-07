import { useState, useMemo } from 'react'
import type { CatalogProps } from '../types'
import { CatalogItem } from './CatalogItem'

export function Catalog({
  nurseries,
  batches,
  containers,
  onSearch,
  onFilter,
  onSelectBatch
}: CatalogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNurseryId, setSelectedNurseryId] = useState<string | undefined>()
  const [availableOnly, setAvailableOnly] = useState(true)

  // Filtrer les lots disponibles uniquement
  const availableBatches = useMemo(() => {
    return batches.filter(batch => {
      if (availableOnly && batch.availableQuantity === 0) return false
      if (selectedNurseryId && batch.nurseryId !== selectedNurseryId) return false
      return true
    })
  }, [batches, availableOnly, selectedNurseryId])

  // Grouper par espèce/variété
  const groupedBySpecies = useMemo(() => {
    const groups: Record<string, {
      speciesName: string
      varietyName?: string
      batches: typeof batches
    }> = {}

    availableBatches.forEach(batch => {
      const key = batch.varietyId 
        ? `${batch.speciesId}-${batch.varietyId}`
        : batch.speciesId
      
      if (!groups[key]) {
        groups[key] = {
          speciesName: batch.speciesName,
          varietyName: batch.varietyName,
          batches: []
        }
      }
      groups[key].batches.push(batch)
    })

    // Filtrer par recherche
    const filtered = Object.values(groups).filter(group => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      const fullName = group.varietyName
        ? `${group.speciesName} ${group.varietyName}`
        : group.speciesName
      return fullName.toLowerCase().includes(query)
    })

    return filtered
  }, [availableBatches, searchQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleNurseryFilter = (nurseryId: string | undefined) => {
    setSelectedNurseryId(nurseryId)
    onFilter?.({
      nurseryId,
      availableOnly: availableOnly || undefined
    })
  }

  const handleAvailableFilter = (checked: boolean) => {
    setAvailableOnly(checked)
    onFilter?.({
      nurseryId: selectedNurseryId,
      availableOnly: checked || undefined
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* En-tête avec recherche et filtres */}
      <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Catalogue Multi-Pépinières
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              Consultez la disponibilité des espèces et variétés dans toutes les pépinières du réseau
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher une espèce ou variété..."
                className="block w-full pl-10 pr-3 py-3 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtre pépinière */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Pépinière
              </label>
              <select
                value={selectedNurseryId || ''}
                onChange={(e) => handleNurseryFilter(e.target.value || undefined)}
                className="block w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent transition-all"
              >
                <option value="">Toutes les pépinières</option>
                {nurseries.map(nursery => (
                  <option key={nursery.id} value={nursery.id}>
                    {nursery.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre disponibilité */}
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => handleAvailableFilter(e.target.checked)}
                  className="w-4 h-4 text-[#EF9B0D] border-stone-300 dark:border-stone-700 rounded focus:ring-[#EF9B0D] focus:ring-2"
                />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  En stock uniquement
                </span>
              </label>
            </div>
          </div>

          {/* Compteur de résultats */}
          <div className="mt-4 text-sm text-stone-600 dark:text-stone-400">
            {groupedBySpecies.length} espèce{groupedBySpecies.length > 1 ? 's' : ''} trouvée{groupedBySpecies.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Liste des espèces */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groupedBySpecies.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Aucune espèce trouvée
            </h3>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupedBySpecies.map((group, index) => (
              <CatalogItem
                key={`${group.speciesName}-${group.varietyName || ''}-${index}`}
                speciesName={group.speciesName}
                varietyName={group.varietyName}
                batches={group.batches}
                nurseries={nurseries}
                containers={containers}
                onSelectBatch={onSelectBatch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

