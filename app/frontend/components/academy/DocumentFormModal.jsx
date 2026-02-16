import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, Image, Video, File } from 'lucide-react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const DOCUMENT_TYPES = [
  { value: 'pdf', label: 'PDF', icon: FileText, description: 'Document PDF' },
  { value: 'image', label: 'Image', icon: Image, description: 'Image ou photo' },
  { value: 'video', label: 'Vidéo', icon: Video, description: 'Vidéo ou enregistrement' },
  { value: 'other', label: 'Autre', icon: File, description: 'Autre type de fichier' },
]

export function DocumentFormModal({ onSubmit, onCancel, busy = false }) {
  const nameRef = useRef(null)
  const fileInputRef = useRef(null)

  const [name, setName] = useState('')
  const [documentType, setDocumentType] = useState('pdf')
  const [file, setFile] = useState(null)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Veuillez saisir un nom pour le document')
      return
    }

    if (!file) {
      setError('Veuillez sélectionner un fichier à envoyer')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        document_type: documentType,
        file,
      })
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    }
  }

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0]
    setFile(chosen || null)
    if (chosen && !name.trim()) {
      setName(chosen.name.replace(/\.[^.]+$/, '') || chosen.name)
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
                  Envoyez un fichier depuis votre ordinateur (stockage local)
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
                      const Icon = type.icon
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
                            <Icon className="w-6 h-6 flex-shrink-0 text-stone-600 dark:text-stone-400" />
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

                {/* File upload */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                    Fichier <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-all cursor-pointer
                      ${file
                        ? 'border-[#B01A19]/50 bg-[#B01A19]/5 dark:bg-[#B01A19]/10'
                        : 'border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 bg-stone-50/50 dark:bg-stone-800/50'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,image/*,video/*,.txt,.csv"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-8 h-8 text-stone-400 dark:text-stone-500 shrink-0" />
                    <div className="text-center min-w-0">
                      {file ? (
                        <>
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{file.name}</p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {(file.size / 1024).toFixed(1)} Ko · Cliquez pour changer
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-stone-700 dark:text-stone-300">Cliquez ou glissez un fichier</p>
                          <p className="text-xs text-stone-500 mt-0.5">PDF, images, vidéos, etc.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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
                disabled={busy || !name.trim() || !file}
                className="px-5 py-2 rounded-xl font-medium text-white bg-[#B01A19] hover:bg-[#8f1514] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
