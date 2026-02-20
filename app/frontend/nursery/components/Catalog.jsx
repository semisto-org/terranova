import { useState, useMemo } from 'react'
import { CatalogItem } from './CatalogItem'

export function Catalog({ nurseries, batches, containers, onSelectBatch }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNurseryId, setSelectedNurseryId] = useState('')
  const [availableOnly, setAvailableOnly] = useState(true)

  const availableBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (availableOnly && batch.availableQuantity === 0) return false
      if (selectedNurseryId && batch.nurseryId !== selectedNurseryId) return false
      return true
    })
  }, [batches, availableOnly, selectedNurseryId])

  const groupedBySpecies = useMemo(() => {
    const groups = {}
    availableBatches.forEach((batch) => {
      const key = batch.varietyId ? `${batch.speciesId}-${batch.varietyId}` : batch.speciesId
      if (!groups[key]) groups[key] = { speciesName: batch.speciesName, varietyName: batch.varietyName, batches: [] }
      groups[key].batches.push(batch)
    })
    return Object.values(groups).filter((group) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const fullName = group.varietyName ? `${group.speciesName} ${group.varietyName}` : group.speciesName
      return fullName.toLowerCase().includes(q)
    })
  }, [availableBatches, searchQuery])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Catalogue Multi-Pépinières</h1>
            <p className="text-stone-600">Consultez la disponibilité des espèces dans toutes les pépinières du réseau</p>
          </div>
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher une espèce ou variété..." className="block w-full pl-10 pr-3 py-3 border border-stone-300 rounded-lg bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Pépinière</label>
              <select value={selectedNurseryId} onChange={(e) => setSelectedNurseryId(e.target.value)} className="block w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent">
                <option value="">Toutes les pépinières</option>
                {nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="w-4 h-4 text-[#EF9B0D] border-stone-300 rounded focus:ring-[#EF9B0D]" />
                <span className="text-sm font-medium text-stone-700">En stock uniquement</span>
              </label>
            </div>
          </div>
          <div className="mt-4 text-sm text-stone-600">{groupedBySpecies.length} espèce{groupedBySpecies.length > 1 ? 's' : ''} trouvée{groupedBySpecies.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groupedBySpecies.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="mt-4 font-serif text-lg font-semibold text-stone-900">Aucune espèce trouvée</h3>
            <p className="mt-2 text-sm text-stone-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupedBySpecies.map((group, index) => (
              <CatalogItem key={`${group.speciesName}-${group.varietyName || ''}-${index}`} speciesName={group.speciesName} varietyName={group.varietyName} batches={group.batches} nurseries={nurseries} containers={containers} onSelectBatch={onSelectBatch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
