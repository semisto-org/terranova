import { useState } from 'react'
import type {
  PlantPaletteProps,
  StrateKey
} from '../types'
import { StrateSection } from './StrateSection'

const strateConfig: Array<{ key: StrateKey; title: string; icon: string; color: string }> = [
  { key: 'trees', title: 'Arbres', icon: '🌲', color: '#234766' },
  { key: 'shrubs', title: 'Arbustes', icon: '🌳', color: '#3d7a4a' },
  { key: 'climbers', title: 'Grimpantes', icon: '🌿', color: '#7a8200' },
  { key: 'herbaceous', title: 'Herbacées', icon: '🌱', color: '#AFBD00' },
  { key: 'groundCover', title: 'Couvre-sols', icon: '☘️', color: '#6b9a3d' },
  { key: 'aquatic', title: 'Aquatiques', icon: '💧', color: '#2563eb' }
]

export function PlantPalette({
  palette,
  species,
  varieties,
  onRemoveItem,
  onSave,
  onExportPDF,
  onSendToDesignStudio,
  onClear
}: PlantPaletteProps) {
  const [expandedStrates, setExpandedStrates] = useState<Set<StrateKey>>(
    new Set(['trees', 'shrubs', 'herbaceous'])
  )
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [paletteName, setPaletteName] = useState(palette?.name || '')
  const [paletteDescription, setPaletteDescription] = useState(palette?.description || '')

  const toggleStrate = (strate: StrateKey) => {
    setExpandedStrates(prev => {
      const next = new Set(prev)
      if (next.has(strate)) {
        next.delete(strate)
      } else {
        next.add(strate)
      }
      return next
    })
  }

  const getTotalItems = () => {
    if (!palette) return 0
    return Object.values(palette.strates).reduce((sum, items) => sum + items.length, 0)
  }

  const handleSave = () => {
    onSave?.(paletteName, paletteDescription)
    setShowSaveModal(false)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-stone-200 dark:border-stone-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-stone-900 dark:text-stone-100">
              Palette végétale
            </h2>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#AFBD00]/15 rounded-full">
              <span className="text-sm font-semibold text-[#7a8200] dark:text-[#d4e34d]">
                {getTotalItems()}
              </span>
              <span className="text-xs text-[#7a8200] dark:text-[#d4e34d]">plantes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {palette ? (
          strateConfig.map(config => (
            <StrateSection
              key={config.key}
              strateKey={config.key}
              title={config.title}
              icon={config.icon}
              items={palette.strates[config.key]}
              species={species}
              varieties={varieties}
              accentColor={config.color}
              isExpanded={expandedStrates.has(config.key)}
              onToggle={() => toggleStrate(config.key)}
              onRemoveItem={(id) => onRemoveItem?.(id, config.key)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              Palette vide
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
              Ajoutez des plantes depuis les fiches espèces pour constituer votre palette végétale
            </p>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex-shrink-0 border-t border-stone-200 dark:border-stone-700 p-4 space-y-3">
        {/* Primary actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={getTotalItems() === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B5781] hover:bg-[#4a4669] disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Sauvegarder
          </button>
          <button
            onClick={onExportPDF}
            disabled={getTotalItems() === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </div>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <button
            onClick={onSendToDesignStudio}
            disabled={getTotalItems() === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#AFBD00]/15 text-[#7a8200] dark:text-[#d4e34d] font-medium rounded-xl hover:bg-[#AFBD00]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Envoyer au Design Studio
          </button>
          <button
            onClick={onClear}
            disabled={getTotalItems() === 0}
            className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vider
          </button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white dark:bg-stone-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
              <h3 className="font-serif text-lg text-stone-900 dark:text-stone-100">
                Sauvegarder la palette
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Nom de la palette
                </label>
                <input
                  type="text"
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  placeholder="Ex: Verger diversifié - Sol argileux"
                  className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Description (optionnelle)
                </label>
                <textarea
                  value={paletteDescription}
                  onChange={(e) => setPaletteDescription(e.target.value)}
                  placeholder="Décrivez le contexte, le type de sol, l'exposition..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/50 focus:border-[#5B5781] resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900/50 flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!paletteName.trim()}
                className="px-5 py-2 bg-[#5B5781] hover:bg-[#4a4669] disabled:bg-stone-300 dark:disabled:bg-stone-700 text-white font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
