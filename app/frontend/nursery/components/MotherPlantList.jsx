import { useState, useMemo } from 'react'
import { MotherPlantRow } from './MotherPlantRow'
import { Filter, X, AlertCircle } from 'lucide-react'

export function MotherPlantList({ motherPlants, onView, onValidate, onReject }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})

  const speciesList = useMemo(() => {
    const seen = new Map()
    motherPlants.forEach((mp) => {
      const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
      if (!seen.has(key)) seen.set(key, mp.varietyName ? `${mp.speciesName} ${mp.varietyName}` : mp.speciesName)
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [motherPlants])

  const filteredPlants = useMemo(() => {
    return motherPlants.filter((mp) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!mp.speciesName.toLowerCase().includes(q) && !mp.varietyName?.toLowerCase().includes(q) && !mp.placeName.toLowerCase().includes(q)) return false
      }
      if (filters.speciesId) {
        const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
        if (key !== filters.speciesId) return false
      }
      if (filters.status && mp.status !== filters.status) return false
      if (filters.source && mp.source !== filters.source) return false
      return true
    })
  }, [motherPlants, searchQuery, filters])

  const groupedPlants = useMemo(() => {
    const groups = {}
    filteredPlants.forEach((mp) => {
      const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
      if (!groups[key]) groups[key] = { speciesName: mp.speciesName, varietyName: mp.varietyName, plants: [] }
      groups[key].plants.push(mp)
    })
    return Object.values(groups).sort((a, b) => a.speciesName.localeCompare(b.speciesName, 'fr'))
  }, [filteredPlants])

  const pendingCount = motherPlants.filter((mp) => mp.status === 'pending').length
  const hasActiveFilters = Object.values(filters).some(Boolean) || searchQuery.length > 0
  const clearFilters = () => { setFilters({}); setSearchQuery('') }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Plants-Mères</h1>
            <p className="text-stone-600">Gestion des plants-mères disponibles pour multiplication</p>
          </div>

          {pendingCount > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-[#fbe6c3] border border-[#EF9B0D]/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#EF9B0D]" />
                <div className="flex-1">
                  <div className="font-medium text-stone-900">{pendingCount} plant{pendingCount > 1 ? 's' : ''}-mère{pendingCount > 1 ? 's' : ''} en attente de validation</div>
                </div>
                <button onClick={() => setFilters({ status: 'pending' })} className="px-4 py-2 text-sm font-medium text-[#EF9B0D] hover:bg-[#EF9B0D]/10 rounded-lg transition-colors">Voir</button>
              </div>
            </div>
          )}

          <div className="mb-4 relative">
            <input type="text" placeholder="Rechercher par espèce, variété, lieu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent" />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={filters.speciesId || ''} onChange={(e) => setFilters((f) => ({ ...f, speciesId: e.target.value || undefined }))} className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]">
              <option value="">Toutes les espèces</option>
              {speciesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))} className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]">
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="validated">Validé</option>
              <option value="rejected">Rejeté</option>
            </select>
            <select value={filters.source || ''} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value || undefined }))} className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]">
              <option value="">Toutes les sources</option>
              <option value="design-studio">Design Studio</option>
              <option value="member-proposal">Proposition membre</option>
            </select>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-2">
                <X className="w-4 h-4" />Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {groupedPlants.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 mx-auto text-stone-400 mb-4" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">Aucun plant-mère trouvé</h3>
            <p className="text-stone-600">{hasActiveFilters ? 'Essayez de modifier vos filtres' : 'Aucun plant-mère disponible'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-stone-50 border-b border-stone-200">
              <div className="col-span-3 text-xs font-semibold text-stone-700 uppercase tracking-wider">Lieu</div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">Date plantation</div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">Source</div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 uppercase tracking-wider">Statut</div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 uppercase tracking-wider">Quantité</div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 uppercase tracking-wider">Récolte</div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 uppercase tracking-wider text-right">Actions</div>
            </div>
            {groupedPlants.map((group) => (
              <div key={`${group.speciesName}-${group.varietyName || ''}`} className="border-b border-stone-200 last:border-b-0">
                <div className="px-4 py-3 bg-[#fbe6c3]/30 border-b border-stone-200">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {group.varietyName ? <><span className="font-medium">{group.speciesName}</span> <span className="text-stone-600">{group.varietyName}</span></> : group.speciesName}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">{group.plants.length} plant{group.plants.length > 1 ? 's' : ''}-mère{group.plants.length > 1 ? 's' : ''}</p>
                </div>
                {group.plants.map((plant) => (
                  <MotherPlantRow key={plant.id} motherPlant={plant} onView={() => onView?.(plant.id)} onValidate={() => onValidate?.(plant.id)} onReject={() => onReject?.(plant.id)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
