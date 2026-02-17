import { useState, useEffect, useRef } from 'react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function ChecklistItemModal({ onSubmit, onCancel, busy = false }) {
  const itemRef = useRef(null)

  const [item, setItem] = useState('')
  const [error, setError] = useState(null)

  // Focus input when modal opens
  useEffect(() => {
    if (itemRef.current) {
      const timer = setTimeout(() => {
        itemRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!item.trim()) {
      setError('Veuillez saisir un item pour la checklist')
      return
    }

    try {
      await onSubmit(item.trim())
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  Nouvel item checklist
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  Ajoutez une tâche à la checklist de préparation
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Item */}
                <div>
                  <label
                    htmlFor="checklist-item"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Tâche à effectuer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={itemRef}
                    id="checklist-item"
                    type="text"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: Réserver la salle de formation"
                  />
                </div>

                {/* Info */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700">
                      <p className="font-medium mb-1">Conseils pour une bonne checklist</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>Soyez concis et précis</li>
                        <li>Une action par item</li>
                        <li>Utilisez des verbes d'action</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !item.trim()}
                className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ajout...
                  </span>
                ) : (
                  'Ajouter à la checklist'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
