import { useState } from 'react'
import type { SearchResult, StrateKey } from '../types'

interface SearchResultItemProps {
  result: SearchResult
  isFocused?: boolean
  isInPalette?: boolean
  onSelect?: () => void
  onAddToPalette?: (strate: StrateKey) => void
}

const strateOptions: { id: StrateKey; label: string }[] = [
  { id: 'trees', label: 'Arbres' },
  { id: 'shrubs', label: 'Arbustes' },
  { id: 'climbers', label: 'Grimpantes' },
  { id: 'herbaceous', label: 'Herbacées' },
  { id: 'groundCover', label: 'Couvre-sols' },
  { id: 'aquatic', label: 'Aquatique' },
]

const typeIndicators: Record<string, { letter: string; color: string; inPaletteColor: string }> = {
  genus: {
    letter: 'G',
    color: 'bg-[#5B5781] text-white',
    inPaletteColor: 'bg-[#5B5781] text-white',
  },
  species: {
    letter: 'E',
    color: 'bg-[#AFBD00] text-white',
    inPaletteColor: 'bg-[#AFBD00] text-white ring-2 ring-[#AFBD00]/30',
  },
  variety: {
    letter: 'V',
    color: 'bg-amber-500 text-white',
    inPaletteColor: 'bg-amber-500 text-white ring-2 ring-amber-500/30',
  },
}

export function SearchResultItem({
  result,
  isFocused = false,
  isInPalette = false,
  onSelect,
  onAddToPalette,
}: SearchResultItemProps) {
  const [showStrateMenu, setShowStrateMenu] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const typeInfo = typeIndicators[result.type]

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isInPalette) {
      setShowStrateMenu(!showStrateMenu)
    }
  }

  const handleStrateSelect = (strate: StrateKey) => {
    onAddToPalette?.(strate)
    setShowStrateMenu(false)

    // Brief animation feedback
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 600)
  }

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-all duration-150 ${
          isInPalette
            ? 'bg-[#AFBD00]/8'
            : isFocused
              ? 'bg-[#5B5781]/10'
              : 'hover:bg-stone-100'
        } ${justAdded ? 'scale-[1.01]' : ''}`}
      >
        {/* Type indicator - single letter badge */}
        <span className={`shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded transition-all duration-200 ${
          isInPalette ? typeInfo.inPaletteColor : typeInfo.color
        } ${justAdded ? 'scale-125' : ''}`}>
          {typeInfo.letter}
        </span>

        {/* Plant info - single line */}
        <span className="flex-1 min-w-0 flex items-baseline gap-2 truncate">
          <span className={`font-medium italic truncate transition-colors ${
            isInPalette
              ? 'text-[#AFBD00]'
              : 'text-stone-900'
          }`}>
            {result.latinName}
          </span>
          {result.commonName && (
            <span className="text-sm text-stone-400 truncate hidden sm:inline">
              {result.commonName}
            </span>
          )}
        </span>

        {/* In palette indicator / Add button */}
        {onAddToPalette && (
          <button
            onClick={handleAddClick}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded transition-all duration-150 ${
              isInPalette
                ? 'bg-[#AFBD00] text-white cursor-default'
                : showStrateMenu
                  ? 'bg-[#AFBD00] text-white'
                  : 'text-stone-300 hover:text-[#AFBD00] hover:bg-[#AFBD00]/10 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isInPalette ? 'Dans la palette' : 'Ajouter à la palette'}
            disabled={isInPalette}
          >
            {isInPalette ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-stone-300 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Strate selection dropdown */}
      {showStrateMenu && onAddToPalette && !isInPalette && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowStrateMenu(false)}
          />
          <div className="absolute right-12 top-0 z-20 py-1 bg-white rounded-lg shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-100">
            {strateOptions.map((strate) => (
              <button
                key={strate.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStrateSelect(strate.id)
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap"
              >
                {strate.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
