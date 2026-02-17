import { useState } from 'react'
import type { StrateKey } from '../types'

interface AddToPaletteButtonProps {
  onAddToPalette?: (strate: StrateKey) => void
}

const strates: Array<{ id: StrateKey; label: string; icon: string }> = [
  { id: 'aquatic', label: 'Aquatique', icon: '💧' },
  { id: 'groundCover', label: 'Couvre-sols', icon: '🌿' },
  { id: 'herbaceous', label: 'Herbacées', icon: '🌱' },
  { id: 'climbers', label: 'Grimpantes', icon: '🌻' },
  { id: 'shrubs', label: 'Arbustes', icon: '🌳' },
  { id: 'trees', label: 'Arbres', icon: '🌲' }
]

export function AddToPaletteButton({ onAddToPalette }: AddToPaletteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (strate: StrateKey) => {
    onAddToPalette?.(strate)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#AFBD00] hover:bg-[#9aa800] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#AFBD00]/25"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ajouter à la palette
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-stone-100">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Choisir une strate
              </p>
            </div>
            <div className="py-1">
              {strates.map(strate => (
                <button
                  key={strate.id}
                  onClick={() => handleSelect(strate.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="text-lg">{strate.icon}</span>
                  <span className="text-sm font-medium text-stone-700">
                    {strate.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
