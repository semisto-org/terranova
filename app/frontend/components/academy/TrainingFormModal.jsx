import { useState, useEffect, useRef } from 'react'
import SimpleEditor from '@/components/SimpleEditor'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function TrainingFormModal({ training, trainingTypes, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(training)
  const titleRef = useRef(null)

  const [trainingTypeId, setTrainingTypeId] = useState(training?.trainingTypeId ?? (trainingTypes[0]?.id ?? ''))
  const [title, setTitle] = useState(training?.title ?? '')
  const [price, setPrice] = useState(training?.price ?? 180)
  const [vatRate, setVatRate] = useState(training?.vatRate ?? 0)
  const [maxParticipants, setMaxParticipants] = useState(training?.maxParticipants ?? 20)
  const [requiresAccommodation, setRequiresAccommodation] = useState(training?.requiresAccommodation ?? false)
  const [description, setDescription] = useState(training?.description ?? '')
  const [coordinatorNote, setCoordinatorNote] = useState(training?.coordinatorNote ?? '')
  const [error, setError] = useState(null)

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
    if (!trainingTypeId) {
      setError('Veuillez sélectionner un type de formation')
      return
    }

    if (!title.trim()) {
      setError('Veuillez saisir un titre')
      return
    }

    if (price < 0) {
      setError('Le prix ne peut pas être négatif')
      return
    }

    if (vatRate < 0 || vatRate >= 100) {
      setError('Le taux de TVA doit être entre 0 et 100')
      return
    }

    if (maxParticipants < 1) {
      setError('Le nombre de participants doit être au moins 1')
      return
    }

    try {
      await onSubmit({
        training_type_id: trainingTypeId,
        title: title.trim(),
        price,
        vat_rate: vatRate,
        max_participants: maxParticipants,
        requires_accommodation: requiresAccommodation,
        description: description === '<p></p>' ? '' : description,
        coordinator_note: coordinatorNote === '<p></p>' ? '' : coordinatorNote,
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
                  {isEdit ? 'Modifier la formation' : 'Nouvelle formation'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations de la formation'
                    : 'Créez une nouvelle formation Academy'}
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
                {/* Training Type */}
                <div>
                  <label
                    htmlFor="training-type"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Type de formation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="training-type"
                    value={trainingTypeId}
                    onChange={(e) => setTrainingTypeId(e.target.value)}
                    required
                    className={inputBase}
                  >
                    {trainingTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="training-title"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Titre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={titleRef}
                    id="training-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: Initiation au design en permaculture"
                  />
                </div>

                {/* Price, TVA, Max Participants */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="training-price"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Prix (€)
                    </label>
                    <input
                      id="training-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className={inputBase}
                      placeholder="180"
                    />
                    {vatRate > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        = {(price / (1 + vatRate / 100)).toFixed(2)} € HT
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="training-vat-rate"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      TVA (%)
                    </label>
                    <input
                      id="training-vat-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      max="99.99"
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                      className={inputBase}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="training-max-participants"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Participants max
                    </label>
                    <input
                      id="training-max-participants"
                      type="number"
                      min="1"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className={inputBase}
                      placeholder="20"
                    />
                  </div>
                </div>

                {/* Requires Accommodation */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={requiresAccommodation}
                        onChange={(e) => setRequiresAccommodation(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-11 h-6 rounded-full transition-colors duration-200 flex items-center
                          ${requiresAccommodation ? 'bg-[#B01A19]' : 'bg-stone-300'}
                        `}
                      >
                        <div
                          className={`
                            w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200
                            ${requiresAccommodation ? 'translate-x-5' : 'translate-x-0.5'}
                          `}
                        />
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-medium text-sm text-stone-900">
                        Hébergement requis
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        La formation nécessite un hébergement sur place
                      </p>
                    </div>
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Description
                  </label>
                  <SimpleEditor
                    content={description}
                    onUpdate={setDescription}
                    minHeight="120px"
                  />
                </div>

                {/* Coordinator Note */}
                <div>
                  <label
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Note coordinateur
                  </label>
                  <SimpleEditor
                    content={coordinatorNote}
                    onUpdate={setCoordinatorNote}
                    minHeight="100px"
                  />
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
                disabled={busy || !title.trim() || !trainingTypeId}
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
                  'Créer la formation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
