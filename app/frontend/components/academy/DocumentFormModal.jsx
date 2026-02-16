import { useState, useEffect, useRef } from 'react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const DOCUMENT_TYPES = [
  { value: 'pdf', label: 'PDF', icon: '📄', description: 'Document PDF' },
  { value: 'link', label: 'Lien', icon: '🔗', description: 'Lien externe' },
  { value: 'image', label: 'Image', icon: '🖼️', description: 'Image ou photo' },
  { value: 'video', label: 'Vidéo', icon: '🎥', description: 'Vidéo ou enregistrement' },
]

export function DocumentFormModal({ onSubmit, onCancel, busy = false }) {
  const nameRef = useRef(null)

  const [name, setName] = useState('')
  const [documentType, setDocumentType] = useState('link')
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (nameRef.current) {
      const timer = setTimeout(() => {
        nameRef.current?.focus()
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

  const validateUrl = (urlString) => {
    try {
      const parsedUrl = new URL(urlString)
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Veuillez saisir un nom pour le document')
      return
    }

    if (!url.trim()) {
      setError('Veuillez saisir une URL')
      return
    }

    if (!validateUrl(url.trim())) {
      setError('Veuillez saisir une URL valide (doit commencer par http:// ou https://)')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        document_type: documentType,
        url: url.trim(),
      })
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
          className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 dark:border-stone-700 bg-gradient-to-br from-red-50 to-white dark:from-stone-800 dark:to-stone-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  Nouveau document
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Ajoutez un document à la formation
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="ml-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                    Type de document <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DOCUMENT_TYPES.map((type) => {
                      const isSelected = documentType === type.value
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setDocumentType(type.value)}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${
                              isSelected
                                ? 'border-[#B01A19] bg-[#B01A19]/5 dark:bg-[#B01A19]/20 shadow-sm'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{type.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${
                                isSelected
                                  ? 'text-stone-900 dark:text-stone-100'
                                  : 'text-stone-700 dark:text-stone-300'
                              }`}>
                                {type.label}
                              </div>
                              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label
                    htmlFor="document-name"
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    Nom du document <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="document-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: Support de cours - Introduction"
                  />
                </div>

                {/* URL */}
                <div>
                  <label
                    htmlFor="document-url"
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="document-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="https://example.com/document.pdf"
                  />
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    L'URL doit commencer par http:// ou https://
                  </p>
                </div>

                {/* Preview info */}
                {url && validateUrl(url) && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Aperçu du lien</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline break-all hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          {url}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2 rounded-xl font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !name.trim() || !url.trim()}
                className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </span>
                ) : (
                  'Ajouter le document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
