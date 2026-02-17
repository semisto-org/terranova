import { useState, useEffect, useRef } from 'react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'En attente', description: 'Aucun paiement reçu' },
  { value: 'partial', label: 'Partiel', description: 'Paiement partiel reçu' },
  { value: 'paid', label: 'Payé', description: 'Paiement complet reçu' },
]

export function PaymentStatusModal({ registration, trainingPrice, onSubmit, onCancel, busy = false }) {
  const statusRef = useRef(null)

  const [status, setStatus] = useState(registration?.paymentStatus ?? 'pending')
  const [amountPaid, setAmountPaid] = useState(registration?.amountPaid ?? 0)
  const [error, setError] = useState(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (statusRef.current) {
      const timer = setTimeout(() => {
        statusRef.current?.focus()
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
    if (amountPaid < 0) {
      setError('Le montant payé ne peut pas être négatif')
      return
    }

    // Status validation
    if (status === 'paid' && amountPaid < trainingPrice) {
      setError(`Pour un statut "Payé", le montant doit être au moins ${trainingPrice.toFixed(2)} €`)
      return
    }

    if (status === 'partial' && (amountPaid <= 0 || amountPaid >= trainingPrice)) {
      setError('Pour un statut "Partiel", le montant doit être entre 0 et le prix total')
      return
    }

    if (status === 'pending' && amountPaid > 0) {
      setError('Pour un statut "En attente", le montant doit être 0')
      return
    }

    try {
      await onSubmit(status, amountPaid)
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    }
  }

  const remainingAmount = Math.max(0, trainingPrice - amountPaid)

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
          className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                  Modifier le paiement
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {registration.contactName}
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
                {/* Training price info */}
                <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
                  <div className="text-sm text-stone-600 mb-1">Prix de la formation</div>
                  <div className="text-2xl font-bold text-stone-900">
                    {trainingPrice.toFixed(2)} €
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <label
                    htmlFor="payment-status"
                    className="block text-sm font-semibold text-stone-700 mb-3"
                  >
                    Statut du paiement
                  </label>
                  <div className="space-y-2">
                    {PAYMENT_STATUSES.map((statusOption) => {
                      const isSelected = status === statusOption.value
                      return (
                        <button
                          key={statusOption.value}
                          type="button"
                          onClick={() => setStatus(statusOption.value)}
                          className={`
                            w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                            ${
                              isSelected
                                ? 'border-[#B01A19] bg-[#B01A19]/5 shadow-sm'
                                : 'border-stone-200 bg-white hover:border-stone-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${
                                  isSelected
                                    ? 'border-[#B01A19] bg-[#B01A19]'
                                    : 'border-stone-300 bg-white'
                                }
                              `}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${
                                isSelected
                                  ? 'text-stone-900'
                                  : 'text-stone-700'
                              }`}>
                                {statusOption.label}
                              </div>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {statusOption.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount Paid */}
                <div>
                  <label
                    htmlFor="amount-paid"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Montant payé (€)
                  </label>
                  <input
                    id="amount-paid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className={inputBase}
                    placeholder="0"
                  />
                </div>

                {/* Remaining amount */}
                {amountPaid > 0 && (
                  <div className={`p-4 rounded-xl border ${
                    remainingAmount === 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          remainingAmount === 0
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {remainingAmount === 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      <div className={`text-sm ${
                        remainingAmount === 0
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}>
                        {remainingAmount === 0 ? (
                          <p className="font-medium">Paiement complet</p>
                        ) : (
                          <>
                            <p className="font-medium">Restant dû : {remainingAmount.toFixed(2)} €</p>
                            <p className="mt-1 text-xs">
                              {((amountPaid / trainingPrice) * 100).toFixed(0)}% payé
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                disabled={busy}
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
                  'Enregistrer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
