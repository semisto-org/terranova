import type { AcademyProps } from '../types'
import { TrainingLocationCard } from './TrainingLocationCard'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'

export function TrainingLocationList({
  trainingLocations,
  trainingTypes,
  onCreateLocation,
  onViewLocation,
  onEditLocation,
  onDeleteLocation,
}: AcademyProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter locations by search query
  const filteredLocations = trainingLocations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
              Lieux de formation
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              Gérez les lieux de formation avec leurs descriptifs, galeries photos et types compatibles
            </p>
          </div>
          <button
            onClick={() => onCreateLocation?.()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B01A19] hover:bg-[#B01A19]/90 rounded-lg transition-colors w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau lieu</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher un lieu de formation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/20 focus:border-[#B01A19]"
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-stone-600 dark:text-stone-400">
          {filteredLocations.length} lieu{filteredLocations.length !== 1 ? 'x' : ''} trouvé{filteredLocations.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Locations grid */}
      {filteredLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <TrainingLocationCard
              key={location.id}
              location={location}
              trainingTypes={trainingTypes}
              onView={onViewLocation}
              onEdit={onEditLocation}
              onDelete={onDeleteLocation}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-1">
            {searchQuery ? 'Aucun lieu trouvé' : 'Aucun lieu de formation'}
          </h3>
          <p className="text-stone-500 dark:text-stone-400 max-w-sm mb-4">
            {searchQuery
              ? 'Aucun lieu de formation ne correspond à votre recherche. Essayez d\'autres mots-clés.'
              : 'Commencez par créer votre premier lieu de formation avec son descriptif, sa galerie photos et les types compatibles.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => onCreateLocation?.()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#B01A19] hover:bg-[#B01A19]/90 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un lieu de formation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

