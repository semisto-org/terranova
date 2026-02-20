import { useState, useEffect, useRef } from 'react'
import SimpleEditor from '../SimpleEditor'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const IDEA_CATEGORIES = [
  { value: 'subject', label: 'Sujet', icon: '🎓', description: 'Idée de sujet de formation' },
  { value: 'trainer', label: 'Formateur', icon: '👤', description: 'Idée de formateur' },
  { value: 'location', label: 'Lieu', icon: '📍', description: 'Idée de lieu de formation' },
  { value: 'other', label: 'Autre', icon: '📝', description: 'Autre type de note' },
]

export function IdeaNoteFormModal({ note, existingTags = [], onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(note)
  const titleRef = useRef(null)
  const newTagRef = useRef(null)

  const [category, setCategory] = useState(note?.category ?? 'subject')
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [selectedTags, setSelectedTags] = useState(note?.tags ?? [])
  const [newTagInput, setNewTagInput] = useState('')
  const [error, setError] = useState(null)

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addNewTag = () => {
    const tag = newTagInput.trim().toLowerCase()
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag])
    }
    setNewTagInput('')
    newTagRef.current?.focus()
  }

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const availableTags = existingTags.filter((t) => !selectedTags.includes(t))

  // Focus first input when modal opens
  useEffect(() => {
    if (titleRef.current) {
      const timer = setTimeout(() => {
        titleRef.current?.focus()
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
    if (!category) {
      setError('Veuillez sélectionner une catégorie')
      return
    }

    if (!title.trim()) {
      setError('Veuillez saisir un titre')
      return
    }

    try {
      await onSubmit({
        category,
        title: title.trim(),
        content: content,
        tags: selectedTags,
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
          className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  {isEdit ? 'Modifier la note' : 'Nouvelle note'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit
                    ? 'Mettez à jour votre note relative aux activités du pôle Academy'
                    : 'Capture une note relative aux activités du pôle Academy'}
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

              <div className="space-y-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {IDEA_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.value
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${
                              isSelected
                                ? 'border-[#B01A19] bg-[#B01A19]/5 shadow-sm'
                                : 'border-stone-200 bg-white hover:border-stone-300'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${
                                isSelected
                                  ? 'text-stone-900'
                                  : 'text-stone-700'
                              }`}>
                                {cat.label}
                              </div>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {cat.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="idea-title"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Titre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={titleRef}
                    id="idea-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inputBase}
                    placeholder=""
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Contenu
                  </label>
                  <SimpleEditor
                    content={content}
                    onUpdate={setContent}
                    placeholder="Développez votre idée... Contexte, objectifs, public visé, etc."
                    minHeight="150px"
                    toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Tags
                  </label>

                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B01A19]/10 text-[#B01A19] text-xs font-medium border border-[#B01A19]/20 hover:bg-[#B01A19]/20 transition-colors"
                        >
                          {tag}
                          <svg className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}

                  {availableTags.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-stone-500 mb-2">Tags existants</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200 hover:bg-stone-200 hover:text-stone-800 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={newTagRef}
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addNewTag()
                        }
                      }}
                      className={inputBase}
                      placeholder="Ajouter un nouveau tag..."
                    />
                    <button
                      type="button"
                      onClick={addNewTag}
                      disabled={!newTagInput.trim()}
                      className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium text-[#B01A19] border border-[#B01A19]/30 hover:bg-[#B01A19]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Ajouter
                    </button>
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
                disabled={busy || !title.trim()}
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
                ) : isEdit ? (
                  'Enregistrer les modifications'
                ) : (
                  'Créer la note'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
