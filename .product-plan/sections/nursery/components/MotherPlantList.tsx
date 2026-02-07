import { useState, useMemo } from 'react'
import type { MotherPlantListProps, MotherPlant, MotherPlantStatus, MotherPlantSource } from '../types'
import { MotherPlantRow } from './MotherPlantRow'
import { Filter, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

export function MotherPlantList({
  motherPlants,
  onView,
  onValidate,
  onReject,
  onFilter,
}: MotherPlantListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    speciesId?: string
    status?: MotherPlantStatus
    source?: MotherPlantSource
  }>({})

  // Extraire la liste unique des espèces
  const speciesList = useMemo(() => {
    const species = new Set<string>()
    motherPlants.forEach((mp) => {
      const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
      species.add(key)
    })
    return Array.from(species).map((key) => {
      const mp = motherPlants.find((m) => {
        const k = m.varietyId ? `${m.speciesId}-${m.varietyId}` : m.speciesId
        return k === key
      })
      return {
        id: key,
        name: mp?.varietyName ? `${mp.speciesName} ${mp.varietyName}` : mp?.speciesName || '',
        speciesId: mp?.speciesId || '',
        varietyId: mp?.varietyId,
      }
    })
  }, [motherPlants])

  // Filtrer les plants-mères
  const filteredPlants = useMemo(() => {
    return motherPlants.filter((mp) => {
      // Recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          mp.speciesName.toLowerCase().includes(query) ||
          mp.varietyName?.toLowerCase().includes(query) ||
          mp.placeName.toLowerCase().includes(query) ||
          mp.placeAddress.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Filtre espèce
      if (filters.speciesId) {
        const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
        if (key !== filters.speciesId) return false
      }

      // Filtre statut
      if (filters.status && mp.status !== filters.status) return false

      // Filtre source
      if (filters.source && mp.source !== filters.source) return false

      return true
    })
  }, [motherPlants, searchQuery, filters])

  // Grouper par espèce/variété
  const groupedPlants = useMemo(() => {
    const groups: Record<string, {
      speciesName: string
      varietyName?: string
      plants: MotherPlant[]
    }> = {}

    filteredPlants.forEach((mp) => {
      const key = mp.varietyId ? `${mp.speciesId}-${mp.varietyId}` : mp.speciesId
      if (!groups[key]) {
        groups[key] = {
          speciesName: mp.speciesName,
          varietyName: mp.varietyName,
          plants: [],
        }
      }
      groups[key].plants.push(mp)
    })

    // Trier les groupes par nom
    return Object.values(groups).sort((a, b) => {
      const nameA = a.varietyName ? `${a.speciesName} ${a.varietyName}` : a.speciesName
      const nameB = b.varietyName ? `${b.speciesName} ${b.varietyName}` : b.speciesName
      return nameA.localeCompare(nameB, 'fr')
    })
  }, [filteredPlants])

  // Compter les plants en attente
  const pendingCount = useMemo(() => {
    return motherPlants.filter((mp) => mp.status === 'pending').length
  }, [motherPlants])

  const handleFilterChange = (key: keyof typeof filters, value: string | MotherPlantStatus | MotherPlantSource | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
    onFilter?.({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  const statusConfig: Record<MotherPlantStatus, { label: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', icon: <Clock className="w-4 h-4" /> },
    validated: { label: 'Validé', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'Rejeté', icon: <X className="w-4 h-4" /> },
  }

  const sourceConfig: Record<MotherPlantSource, { label: string }> = {
    'design-studio': { label: 'Design Studio' },
    'member-proposal': { label: 'Proposition membre' },
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* En-tête */}
      <div className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Plants-Mères
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              Gestion des plants-mères disponibles pour multiplication
            </p>
          </div>

          {/* Alerte plants en attente */}
          {pendingCount > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-[#fbe6c3] dark:bg-[#fbe6c3]/20 border border-[#EF9B0D]/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#EF9B0D]" />
                <div className="flex-1">
                  <div className="font-medium text-stone-900 dark:text-stone-100">
                    {pendingCount} plant{pendingCount > 1 ? 's' : ''}-mère{pendingCount > 1 ? 's' : ''} en attente de validation
                  </div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                    Des propositions de membres nécessitent votre attention
                  </div>
                </div>
                <button
                  onClick={() => handleFilterChange('status', 'pending')}
                  className="px-4 py-2 text-sm font-medium text-[#EF9B0D] hover:bg-[#EF9B0D]/10 rounded-lg transition-colors"
                >
                  Voir les en attente
                </button>
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher par espèce, variété, lieu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre espèce */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={filters.speciesId || ''}
                onChange={(e) => handleFilterChange('speciesId', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Toutes les espèces</option>
                {speciesList.map((species) => (
                  <option key={species.id} value={species.id}>
                    {species.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre statut */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value as MotherPlantStatus || undefined)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre source */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value as MotherPlantSource || undefined)}
                className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#EF9B0D] focus:border-transparent"
              >
                <option value="">Toutes les sources</option>
                {Object.entries(sourceConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton effacer filtres */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {groupedPlants.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-stone-400 dark:text-stone-600 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              Aucun plant-mère trouvé
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Aucun plant-mère disponible pour le moment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-[#EF9B0D] hover:bg-[#fbe6c3] dark:hover:bg-[#fbe6c3]/20 rounded-lg transition-colors"
              >
                Effacer tous les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* En-tête du tableau (desktop) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
              <div className="col-span-3 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Lieu
              </div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Date de plantation
              </div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Source
              </div>
              <div className="col-span-2 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Statut
              </div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Quantité
              </div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Dernière récolte
              </div>
              <div className="col-span-1 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-right">
                Actions
              </div>
            </div>

            {/* Groupes par espèce/variété */}
            {groupedPlants.map((group) => (
              <div key={group.varietyId ? `${group.speciesName}-${group.varietyName}` : group.speciesName} className="border-b border-stone-200 dark:border-stone-800 last:border-b-0">
                {/* En-tête du groupe */}
                <div className="px-4 py-3 bg-[#fbe6c3]/30 dark:bg-[#fbe6c3]/10 border-b border-stone-200 dark:border-stone-800">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
                    {group.varietyName ? (
                      <>
                        <span className="font-medium">{group.speciesName}</span>
                        <span className="text-stone-600 dark:text-stone-400"> {group.varietyName}</span>
                      </>
                    ) : (
                      group.speciesName
                    )}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    {group.plants.length} plant{group.plants.length > 1 ? 's' : ''}-mère{group.plants.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Liste des plants-mères */}
                {group.plants.map((plant) => (
                  <MotherPlantRow
                    key={plant.id}
                    motherPlant={plant}
                    onView={() => onView?.(plant.id)}
                    onValidate={() => onValidate?.(plant.id)}
                    onReject={() => onReject?.(plant.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

