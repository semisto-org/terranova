import { useState } from 'react'
import type { Genus, Species, Variety } from '../types'

interface VarietyBreadcrumbProps {
  genus: Genus | null
  species: Species
  currentVariety: Variety
  siblingVarieties: Variety[]
  onGenusSelect?: (genusId: string) => void
  onSpeciesSelect?: (speciesId: string) => void
  onVarietySelect?: (varietyId: string) => void
}

export function VarietyBreadcrumb({
  genus,
  species,
  currentVariety,
  siblingVarieties,
  onGenusSelect,
  onSpeciesSelect,
  onVarietySelect,
}: VarietyBreadcrumbProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!genus) return null

  const speciesEpithet = species.latinName.split(' ').slice(1).join(' ')
  // Extract variety name (the part after the species name, usually in quotes)
  const varietyName = currentVariety.latinName
    .replace(species.latinName, '')
    .trim()
    .replace(/^['"]|['"]$/g, '') || currentVariety.latinName.split("'")[1]?.replace("'", '') || currentVariety.latinName

  const otherVarieties = siblingVarieties.filter((v) => v.id !== currentVariety.id)

  return (
    <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
      {/* Genus link */}
      <button
        onClick={() => onGenusSelect?.(genus.id)}
        className="text-stone-500 hover:text-[#5B5781] transition-colors"
      >
        {genus.latinName}
      </button>

      <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Species epithet - clickable link */}
      <button
        onClick={() => onSpeciesSelect?.(species.id)}
        className="italic text-stone-900 hover:text-[#5B5781] transition-colors font-medium"
      >
        {speciesEpithet}
      </button>

      <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Variety name with dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onMouseEnter={() => otherVarieties.length > 0 && setIsDropdownOpen(true)}
          className={`flex items-center gap-1 font-medium transition-colors ${
            otherVarieties.length > 0
              ? 'text-stone-900 hover:text-[#5B5781] cursor-pointer'
              : 'text-stone-900 cursor-default'
          }`}
        >
          <span className="italic">{varietyName}</span>
          {otherVarieties.length > 0 && (
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
        {isDropdownOpen && otherVarieties.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Autres variétés
                </p>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {otherVarieties.map((variety) => {
                  const vName = variety.latinName
                    .replace(species.latinName, '')
                    .trim()
                    .replace(/^['"]|['"]$/g, '') || variety.latinName.split("'")[1]?.replace("'", '') || variety.latinName
                  return (
                    <button
                      key={variety.id}
                      onClick={() => {
                        onVarietySelect?.(variety.id)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 transition-colors"
                    >
                      <span className="text-sm italic text-stone-700">
                        {vName}
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

