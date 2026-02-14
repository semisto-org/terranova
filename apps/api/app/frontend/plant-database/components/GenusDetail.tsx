import { useState, useRef, useEffect } from 'react'
import type { GenusDetailProps, FilterOptions, Genus, CommonName } from '../types'
import { PhotoGallery } from './PhotoGallery'
import { NoteCard } from './NoteCard'
import { CollapsibleSection } from './CollapsibleSection'
import { AISummaryCallout } from './AISummaryCallout'
import { ReferenceList } from './ReferenceList'
import { PropertyBadge } from './PropertyBadge'
import {
  TreeIcon,
  ShrubIcon,
  HerbaceousIcon,
  ClimberIcon,
  GroundCoverIcon,
} from './CharacteristicIcons'

interface GenusDetailWithFiltersProps extends GenusDetailProps {
  filterOptions: FilterOptions
  /** All available genera for search */
  allGenera?: Genus[]
  /** All common names for search and species display */
  allCommonNames?: CommonName[]
  /** Called when user selects another genus */
  onGenusSelect?: (genusId: string) => void
}

export function GenusDetail({
  genus,
  species,
  commonNames,
  references,
  photos,
  notes,
  contributors,
  filterOptions,
  aiSummary,
  onGenerateAISummary,
  onAddPhoto,
  onAddNote,
  onAddReference,
  onSpeciesSelect,
  onContributorSelect,
  allGenera = [],
  allCommonNames = [],
  onGenusSelect,
}: GenusDetailWithFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  const primaryCommonName = commonNames.find((cn) => cn.language === 'fr')?.name
  const otherCommonNames = commonNames.filter((cn) => cn.language !== 'fr')

  // Filter genera based on search query
  const searchResults = allGenera
    .filter((g) => {
      if (!searchQuery.trim()) return false
      if (g.id === genus.id) return false // Exclude current genus

      const query = searchQuery.toLowerCase()
      const latinMatch = g.latinName.toLowerCase().includes(query)
      
      // Check common names
      const genusCommonNames = allCommonNames.filter(
        (cn) => cn.targetId === g.id && cn.targetType === 'genus'
      )
      const commonNameMatch = genusCommonNames.some((cn) =>
        cn.name.toLowerCase().includes(query)
      )

      return latinMatch || commonNameMatch
    })
    .slice(0, 5) // Limit to 5 results

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSearchResults) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, searchResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        const result = searchResults[focusedIndex]
        onGenusSelect?.(result.id)
        setSearchQuery('')
        setShowSearchResults(false)
      } else if (e.key === 'Escape') {
        setShowSearchResults(false)
        searchInputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearchResults, focusedIndex, searchResults, onGenusSelect])

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && searchResultsRef.current) {
      const items = searchResultsRef.current.querySelectorAll('[data-result-item]')
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false)
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  // Show results when query changes
  useEffect(() => {
    setShowSearchResults(searchQuery.trim().length > 0 && searchResults.length > 0)
    setFocusedIndex(-1)
  }, [searchQuery, searchResults.length])

  // Group species by type
  const speciesByType = species.reduce(
    (acc, sp) => {
      if (!acc[sp.type]) acc[sp.type] = []
      acc[sp.type].push(sp)
      return acc
    },
    {} as Record<string, typeof species>
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tree':
        return <TreeIcon className="w-5 h-5" />
      case 'shrub':
      case 'small-shrub':
        return <ShrubIcon className="w-5 h-5" />
      case 'herbaceous':
        return <HerbaceousIcon className="w-5 h-5" />
      case 'climber':
        return <ClimberIcon className="w-5 h-5" />
      case 'ground-cover':
        return <GroundCoverIcon className="w-5 h-5" />
      default:
        return <TreeIcon className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    return filterOptions.types.find((t) => t.id === type)?.label || type
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="mb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 flex-1 min-w-0">
                <span className="italic">{genus.latinName}</span>
                {primaryCommonName && (
                  <span className="ml-3 font-normal text-stone-600 dark:text-stone-400">
                    {primaryCommonName}
                  </span>
                )}
              </h1>

              {/* Search field */}
              {allGenera.length > 0 && onGenusSelect && (
                <div className="relative flex-shrink-0 w-full lg:w-64">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher un genre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim().length > 0 && searchResults.length > 0) {
                          setShowSearchResults(true)
                        }
                      }}
                      className="w-full px-4 py-2 pl-10 pr-4 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AFBD00] focus:border-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>

                  {/* Search results dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div
                      ref={searchResultsRef}
                      className="absolute top-full mt-1 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                    >
                      {searchResults.map((result, index) => {
                        const resultCommonName = allCommonNames.find(
                          (cn) => cn.targetId === result.id && cn.targetType === 'genus' && cn.language === 'fr'
                        )?.name

                        return (
                          <button
                            key={result.id}
                            data-result-item
                            onClick={() => {
                              onGenusSelect(result.id)
                              setSearchQuery('')
                              setShowSearchResults(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${
                              index === focusedIndex
                                ? 'bg-stone-50 dark:bg-stone-700'
                                : ''
                            } ${index === 0 ? 'rounded-t-lg' : ''} ${
                              index === searchResults.length - 1 ? 'rounded-b-lg' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[#5B5781] dark:text-[#AFBD00] bg-[#5B5781]/10 dark:bg-[#AFBD00]/10 px-2 py-0.5 rounded">
                                G
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                  <span className="italic">{result.latinName}</span>
                                  {resultCommonName && (
                                    <span className="ml-2 font-normal text-stone-600 dark:text-stone-400">
                                      {resultCommonName}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other common names */}
            {otherCommonNames.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-stone-500 dark:text-stone-400">Aussi appelé :</span>
                {otherCommonNames.map((cn) => (
                  <span
                    key={cn.id}
                    className="text-sm text-stone-600 dark:text-stone-400 font-medium"
                  >
                    {cn.name}
                    <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
                      ({cn.language})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {genus.description && (
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {genus.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Species List */}
        {species.length > 0 && (
          <CollapsibleSection title="Espèces" icon="🌿" badge={species.length} defaultOpen={true}>
            <div className="space-y-4">
              {Object.entries(speciesByType).map(([type, typeSpecies]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)} ({typeSpecies.length})
                  </h3>
                  <div className="space-y-2">
                    {typeSpecies.map((sp) => {
                      const spCommonName = allCommonNames?.find(
                        (cn) => cn.targetId === sp.id && cn.targetType === 'species' && cn.language === 'fr'
                      )?.name

                      return (
                        <button
                          key={sp.id}
                          onClick={() => onSpeciesSelect?.(sp.id)}
                          className="w-full text-left p-4 bg-white dark:bg-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-900 dark:text-stone-100 group-hover:text-[#5B5781] dark:group-hover:text-[#AFBD00] transition-colors">
                                <span className="italic">{sp.latinName}</span>
                                {spCommonName && (
                                  <span className="ml-2 font-normal text-stone-600 dark:text-stone-400">
                                    {spCommonName}
                                  </span>
                                )}
                              </p>
                              {sp.origin && (
                                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                                  Origine : {sp.origin}
                                </p>
                              )}
                            </div>
                            <svg
                              className="w-5 h-5 text-stone-400 group-hover:text-[#AFBD00] transition-colors flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <CollapsibleSection title="Photos" icon="📷" badge={photos.length} defaultOpen={true}>
            <PhotoGallery
              photos={photos}
              contributors={contributors}
              onContributorSelect={onContributorSelect}
            />
          </CollapsibleSection>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <CollapsibleSection title="Notes des contributeurs" icon="💬" badge={notes.length} defaultOpen={true}>
            <div className="space-y-4">
              {notes.map((note) => {
                const contributor = contributors.find((c) => c.id === note.contributorId)
                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    contributor={contributor}
                    onContributorSelect={onContributorSelect}
                  />
                )
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* References */}
        {references.length > 0 && (
          <CollapsibleSection title="Références" icon="📚" badge={references.length} defaultOpen={false}>
            <ReferenceList references={references} />
          </CollapsibleSection>
        )}

        {/* Empty states */}
        {species.length === 0 && photos.length === 0 && notes.length === 0 && references.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-3xl mx-auto mb-4">
              🌿
            </div>
            <p className="text-stone-500 dark:text-stone-400">
              Aucune information supplémentaire disponible pour ce genre
            </p>
          </div>
        )}

        {/* AI Summary - Moved to bottom */}
        {aiSummary && (
          <AISummaryCallout
            aiSummary={aiSummary}
            onGenerate={onGenerateAISummary}
            targetName={genus.latinName}
          />
        )}
      </div>
    </div>
  )
}

