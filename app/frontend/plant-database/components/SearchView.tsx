import { useState, useRef, useEffect } from 'react'
import type { SearchViewProps, StrateKey } from '../types'
import { SearchResultItem } from './SearchResultItem'
import { FilterPanel } from './FilterPanel'

export function SearchView({
  filterOptions,
  results,
  filters,
  paletteItemIds = [],
  onSearchChange,
  onFiltersChange,
  onResultSelect,
  onAddToPalette,
}: SearchViewProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Determine if we're in "search mode" (has query or filters)
  const hasSearchCriteria = filters.query || [
    filters.types.length,
    filters.exposures.length,
    filters.hardinessZones.length,
    filters.edibleParts.length,
    filters.interests.length,
    filters.nativeCountries.length,
    filters.soilTypes.length,
    filters.soilMoisture.length,
    filters.wateringNeed.length,
  ].some(count => count > 0)

  // Count active filters (excluding query)
  const activeFilterCount = [
    filters.types.length,
    filters.exposures.length,
    filters.hardinessZones.length,
    filters.edibleParts.length,
    filters.interests.length,
    filters.nativeCountries.length,
    filters.soilTypes.length,
    filters.soilMoisture.length,
    filters.wateringNeed.length,
  ].reduce((sum, count) => sum + count, 0)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        const result = results[focusedIndex]
        onResultSelect?.(result.id, result.type)
      } else if (e.key === 'Escape') {
        inputRef.current?.blur()
        setShowFilters(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, results, onResultSelect])

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [results])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]')
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  const handleFilterChange = (key: keyof typeof filters, value: string[]) => {
    onFiltersChange?.({
      ...filters,
      [key]: value,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange?.({
      query: filters.query,
      types: [],
      exposures: [],
      hardinessZones: [],
      edibleParts: [],
      interests: [],
      nativeCountries: [],
      soilTypes: [],
      soilMoisture: [],
      wateringNeed: [],
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Sticky Header with Search */}
      <header className="sticky top-0 z-20 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-sm border-b border-stone-200/50 dark:border-stone-800/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Compact title - only shown when no search */}
          {!hasSearchCriteria && (
            <div className="text-center mb-3">
              <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                Base de données végétale
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Genres, espèces et variétés
              </p>
            </div>
          )}

          {/* Search Input - always prominent */}
          <div className="relative flex items-center bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
            <div className="pl-3 text-stone-400 dark:text-stone-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={filters.query}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Rechercher par nom..."
              className="flex-1 px-3 py-2.5 text-base bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none"
              aria-label="Rechercher des plantes"
            />
            {filters.query && (
              <button
                onClick={() => onSearchChange?.('')}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                aria-label="Effacer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {/* Filter toggle integrated in search bar */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`mr-1 p-2 rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'text-[#5B5781] dark:text-[#AFBD00] bg-[#5B5781]/10 dark:bg-[#AFBD00]/10'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
              }`}
              aria-label="Filtres"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-[#AFBD00] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel - collapsible */}
          {showFilters && (
            <div className="mt-3">
              <FilterPanel
                filterOptions={filterOptions}
                filters={filters}
                showAdvanced={showAdvanced}
                onShowAdvancedChange={setShowAdvanced}
                onFilterChange={handleFilterChange}
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Results Section - scrollable */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-2">
          {/* Results count */}
          {hasSearchCriteria && (
            <div className="flex items-center justify-between py-2 text-xs text-stone-500 dark:text-stone-400">
              <span>
                {results.length > 0 ? (
                  <>
                    <span className="font-medium text-stone-700 dark:text-stone-300">{results.length}</span>
                    {' '}résultat{results.length > 1 ? 's' : ''}
                  </>
                ) : (
                  'Aucun résultat'
                )}
              </span>
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded bg-[#5B5781] text-white">G</span>
                  Genre
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded bg-[#AFBD00] text-white">E</span>
                  Espèce
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded bg-amber-500 text-white">V</span>
                  Variété
                </span>
              </div>
            </div>
          )}

          {/* Results List */}
          <div ref={resultsRef} className="divide-y divide-stone-100 dark:divide-stone-800/50">
            {results.length > 0 ? (
              results.map((result, index) => (
                <div key={result.id} data-result-item>
                  <SearchResultItem
                    result={result}
                    isFocused={index === focusedIndex}
                    isInPalette={paletteItemIds.includes(result.id)}
                    onSelect={() => onResultSelect?.(result.id, result.type)}
                    onAddToPalette={
                      result.type !== 'genus'
                        ? (strate: StrateKey) => onAddToPalette?.(result.id, result.type as 'species' | 'variety', strate)
                        : undefined
                    }
                  />
                </div>
              ))
            ) : hasSearchCriteria ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Aucune plante ne correspond à vos critères
                </p>
                <button
                  onClick={() => {
                    onSearchChange?.('')
                    clearAllFilters()
                  }}
                  className="mt-2 text-sm text-[#5B5781] dark:text-[#AFBD00] font-medium"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-stone-100 dark:bg-stone-800">
                  <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Tapez un nom ou utilisez les filtres
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Keyboard shortcuts - only on desktop, minimal */}
      <div className="hidden lg:block fixed bottom-3 right-3 text-[10px] text-stone-400 dark:text-stone-600">
        <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">↑↓</kbd> naviguer
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">↵</kbd> ouvrir
      </div>
    </div>
  )
}
