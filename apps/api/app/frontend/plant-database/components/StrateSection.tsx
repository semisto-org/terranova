import type { PaletteItem, StrateKey, Species, Variety } from '../types'
import { useState } from 'react'

interface StrateSectionProps {
  strateKey: StrateKey
  title: string
  icon: string
  items: PaletteItem[]
  species: Species[]
  varieties: Variety[]
  accentColor: string
  isExpanded: boolean
  onToggle: () => void
  onRemoveItem?: (id: string) => void
  onMoveItem?: (id: string, fromStrate: StrateKey, toStrate: StrateKey) => void
  onItemClick?: (id: string, type: 'species' | 'variety') => void
}

export function StrateSection({
  strateKey,
  title,
  icon,
  items,
  species,
  varieties,
  accentColor,
  isExpanded,
  onToggle,
  onRemoveItem,
  onMoveItem,
  onItemClick
}: StrateSectionProps) {
  const [isDropActive, setIsDropActive] = useState(false)

  const getItemDetails = (item: PaletteItem) => {
    if (item.type === 'species') {
      const sp = species.find(s => s.id === item.id)
      return {
        latinName: item.latinName,
        type: sp?.type || 'unknown',
        exposures: sp?.exposures || []
      }
    } else {
      const variety = varieties.find(v => v.id === item.id)
      const sp = variety ? species.find(s => s.id === variety.speciesId) : null
      return {
        latinName: item.latinName,
        type: sp?.type || 'unknown',
        exposures: sp?.exposures || []
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDropActive(true)
  }

  const handleDragLeave = () => {
    setIsDropActive(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDropActive(false)

    const raw = event.dataTransfer.getData('text/plain')
    if (!raw) return

    try {
      const payload = JSON.parse(raw)
      const fromStrate = payload.fromStrate as StrateKey
      const id = payload.id as string
      if (!id || !fromStrate || fromStrate === strateKey) return
      onMoveItem?.(id, fromStrate, strateKey)
    } catch (_) {
      // ignore malformed payload
    }
  }

  return (
    <div
      className={`border-b border-stone-200 dark:border-stone-700 last:border-b-0 transition-colors ${
        isDropActive ? 'bg-[#AFBD00]/10' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <span className="text-xl">{icon}</span>
        <span className="flex-1 text-left font-medium text-stone-900 dark:text-stone-100">
          {title}
        </span>
        <span
          className="min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold flex items-center justify-center text-white"
          style={{ backgroundColor: items.length > 0 ? accentColor : '#a8a29e' }}
        >
          {items.length}
        </span>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-3">
          {items.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-stone-400 dark:text-stone-500 italic">
                Glissez des plantes ici ou utilisez le bouton "+"
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const details = getItemDetails(item)
                return (
                  <div
                    key={`${item.type}:${item.id}`}
                    className="group flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        'text/plain',
                        JSON.stringify({
                          id: item.paletteItemId || item.id,
                          fromStrate: strateKey
                        })
                      )
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    {/* Type indicator */}
                    <div
                      className="w-2 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Content */}
                    <button
                      onClick={() => onItemClick?.(item.id, item.type)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 italic">
                        {details.latinName}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {item.type === 'variety' ? 'Variété' : 'Espèce'} • {details.exposures.join(', ')}
                      </p>
                    </button>

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveItem?.(item.paletteItemId || item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                      title="Retirer de la palette"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
