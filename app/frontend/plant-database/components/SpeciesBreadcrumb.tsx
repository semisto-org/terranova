import { useState } from 'react'
import type { Genus, Species } from '../types'

interface SpeciesBreadcrumbProps {
  genus: Genus | null
  currentSpecies: Species
  siblingSpecies: Species[]
  onGenusSelect?: (genusId: string) => void
  onSpeciesSelect?: (speciesId: string) => void
}

export function SpeciesBreadcrumb({
  genus,
  currentSpecies,
  siblingSpecies,
  onGenusSelect,
  onSpeciesSelect
}: SpeciesBreadcrumbProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!genus) return null

  const speciesEpithet = currentSpecies.latinName.split(' ').slice(1).join(' ')
  const otherSpecies = siblingSpecies.filter(s => s.id !== currentSpecies.id)

  return (
    <div className="flex items-center gap-2 text-sm mb-4">
      {/* Genus link */}
      <button
        onClick={() => onGenusSelect?.(genus.id)}
        className="text-stone-500 dark:text-stone-400 hover:text-[#5B5781] dark:hover:text-[#a89ec4] transition-colors"
      >
        {genus.latinName}
      </button>

      <svg className="w-4 h-4 text-stone-400 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Species epithet with dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onMouseEnter={() => otherSpecies.length > 0 && setIsDropdownOpen(true)}
          className={`flex items-center gap-1 font-medium transition-colors ${
            otherSpecies.length > 0
              ? 'text-stone-900 dark:text-stone-100 hover:text-[#5B5781] dark:hover:text-[#a89ec4] cursor-pointer'
              : 'text-stone-900 dark:text-stone-100 cursor-default'
          }`}
        >
          <span className="italic">{speciesEpithet}</span>
          {otherSpecies.length > 0 && (
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Dropdown */}
        {isDropdownOpen && otherSpecies.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-700">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Autres {genus.latinName}
                </p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {otherSpecies.map(species => {
                  const epithet = species.latinName.split(' ').slice(1).join(' ')
                  return (
                    <button
                      key={species.id}
                      onClick={() => {
                        onSpeciesSelect?.(species.id)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <span className="text-sm italic text-stone-700 dark:text-stone-300">
                        {epithet}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
