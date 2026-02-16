import { useState, useEffect, useRef } from 'react'
import SimpleEditor from '@/components/SimpleEditor'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function SessionFormModal({ session, locations, members, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(session)
  const startDateRef = useRef(null)

  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(session?.startDate ?? today)
  const [endDate, setEndDate] = useState(session?.endDate ?? today)
  const [locationIds, setLocationIds] = useState(session?.locationIds ?? [])
  const [trainerIds, setTrainerIds] = useState(session?.trainerIds ?? [])
  const [assistantIds, setAssistantIds] = useState(session?.assistantIds ?? [])
  const [topic, setTopic] = useState(session?.topic ?? '')
  const [description, setDescription] = useState(session?.description ?? '')
  const [error, setError] = useState(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (startDateRef.current) {
      const timer = setTimeout(() => {
        startDateRef.current?.focus()
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

  const toggleLocation = (id) => {
    setLocationIds((prev) =>
      prev.includes(id) ? prev.filter((locId) => locId !== id) : [...prev, id]
    )
  }

  const toggleTrainer = (id) => {
    setTrainerIds((prev) =>
      prev.includes(id) ? prev.filter((memberId) => memberId !== id) : [...prev, id]
    )
  }

  const toggleAssistant = (id) => {
    setAssistantIds((prev) =>
      prev.includes(id) ? prev.filter((memberId) => memberId !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!startDate) {
      setError('Veuillez saisir une date de début')
      return
    }

    if (!endDate) {
      setError('Veuillez saisir une date de fin')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('La date de fin doit être égale ou postérieure à la date de début')
      return
    }

    try {
      await onSubmit({
        start_date: startDate,
        end_date: endDate,
        topic: topic.trim() || null,
        location_ids: locationIds,
        trainer_ids: trainerIds,
        assistant_ids: assistantIds,
        description: description === '<p></p>' ? '' : description,
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
          className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 dark:border-stone-700 bg-gradient-to-br from-red-50 to-white dark:from-stone-800 dark:to-stone-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-heading)' }}>
                  {isEdit ? 'Modifier la session' : 'Nouvelle session'}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations de la session'
                    : 'Créez une nouvelle session de formation'}
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
                {/* Dates - side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Date de début <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={startDateRef}
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                    >
                      Date de fin <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className={inputBase}
                    />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label
                    htmlFor="session-topic"
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    Thématique
                  </label>
                  <input
                    id="session-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={inputBase}
                    placeholder="ex: Les guildes végétales, La taille douce..."
                  />
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Optionnel — utile pour les formations de plusieurs jours avec des thèmes différents par session
                  </p>
                </div>

                {/* Locations */}
                {locations && locations.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                      Lieux
                    </label>
                    <div className="space-y-2">
                      {locations.map((location) => {
                        const isSelected = locationIds.includes(location.id)
                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => toggleLocation(location.id)}
                            className={`
                              w-full p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3
                              ${
                                isSelected
                                  ? 'border-[#B01A19] bg-[#B01A19]/5 dark:bg-[#B01A19]/20'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                              }
                            `}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${
                                  isSelected
                                    ? 'border-[#B01A19] bg-[#B01A19]'
                                    : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                                }
                              `}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                              {location.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Trainers */}
                {members && members.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                      Formateurs
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((member) => {
                        const isSelected = trainerIds.includes(member.id)
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleTrainer(member.id)}
                            className={`
                              p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3
                              ${
                                isSelected
                                  ? 'border-[#B01A19] bg-[#B01A19]/5 dark:bg-[#B01A19]/20'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                              }
                            `}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${
                                  isSelected
                                    ? 'border-[#B01A19] bg-[#B01A19]'
                                    : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                                }
                              `}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                              {member.firstName} {member.lastName}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Assistants */}
                {members && members.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                      Assistants
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((member) => {
                        const isSelected = assistantIds.includes(member.id)
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAssistant(member.id)}
                            className={`
                              p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3
                              ${
                                isSelected
                                  ? 'border-[#B01A19] bg-[#B01A19]/5 dark:bg-[#B01A19]/20'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                              }
                            `}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${
                                  isSelected
                                    ? 'border-[#B01A19] bg-[#B01A19]'
                                    : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                                }
                              `}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                              {member.firstName} {member.lastName}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2"
                  >
                    Description
                  </label>
                  <SimpleEditor
                    content={description}
                    onUpdate={setDescription}
                    minHeight="120px"
                  />
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
                disabled={busy || !startDate || !endDate}
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
                  'Créer la session'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
