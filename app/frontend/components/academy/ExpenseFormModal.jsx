import { useState, useEffect, useRef } from 'react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const EXPENSE_CATEGORIES = [
  { value: 'location', label: 'Location', icon: '🏠' },
  { value: 'material', label: 'Matériel', icon: '🛠️' },
  { value: 'food', label: 'Nourriture', icon: '🍽️' },
  { value: 'accommodation', label: 'Hébergement', icon: '🏨' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'other', label: 'Autre', icon: '📝' },
]

export function ExpenseFormModal({ expense, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(expense)
  const descriptionRef = useRef(null)

  const today = new Date().toISOString().slice(0, 10)
  const [category, setCategory] = useState(expense?.category ?? 'location')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense?.amount ?? 0)
  const [date, setDate] = useState(expense?.date ?? today)
  const [error, setError] = useState(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (descriptionRef.current) {
      const timer = setTimeout(() => {
        descriptionRef.current?.focus()
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

    if (!description.trim()) {
      setError('Veuillez saisir une description')
      return
    }

    if (amount <= 0) {
      setError('Le montant doit être supérieur à 0')
      return
    }

    if (!date) {
      setError('Veuillez saisir une date')
      return
    }

    try {
      await onSubmit({
        category,
        description: description.trim(),
        amount,
        date,
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
                  {isEdit ? 'Modifier la dépense' : 'Nouvelle dépense'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations de la dépense'
                    : 'Enregistrez une nouvelle dépense de formation'}
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
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const isSelected = category === cat.value
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`
                            p-3 rounded-xl border-2 transition-all duration-200 text-left
                            ${
                              isSelected
                                ? 'border-[#B01A19] bg-[#B01A19]/5 dark:bg-[#B01A19]/20 shadow-sm'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl">{cat.icon}</span>
                            <span className={`font-medium text-xs ${
                              isSelected
                                ? 'text-stone-900 dark:text-stone-100'
                                : 'text-stone-700 dark:text-stone-300'
                            }`}>
                              {cat.label}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="expense-description"
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={descriptionRef}
                    id="expense-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: Location salle de formation"
                  />
                </div>

                {/* Amount and Date - side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expense-amount"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Montant (€) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="expense-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      required
                      className={inputBase}
                      placeholder="120.00"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expense-date"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="expense-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className={inputBase}
                    />
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
                disabled={busy || !description.trim() || amount <= 0 || !date}
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
                  'Créer la dépense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
