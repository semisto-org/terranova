import React, { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Shared confirmation modal for delete actions across the application.
 *
 * @param {string}   title       - Modal title (e.g. "Supprimer ce lieu ?")
 * @param {string}   message     - Descriptive message shown below the title
 * @param {string}   confirmLabel - Label for the confirm button (default: "Supprimer")
 * @param {Function} onConfirm   - Called when the user confirms deletion
 * @param {Function} onCancel    - Called when the user cancels
 * @param {string}   accentColor - Optional accent color (default: red-600)
 */
export default function ConfirmDeleteModal({
  title = 'Confirmer la suppression',
  message,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
  accentColor,
}) {
  const panelRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[modalSlideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        </div>
        {message && (
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: accentColor || '#dc2626',
            }}
            onMouseEnter={(e) => (e.target.style.filter = 'brightness(0.9)')}
            onMouseLeave={(e) => (e.target.style.filter = '')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
