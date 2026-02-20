import { useState, useEffect, useRef } from 'react'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
  { value: 'paid', label: 'Payé' },
]

export function RegistrationFormModal({ registration, trainingPrice, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(registration)
  const nameRef = useRef(null)

  const [contactName, setContactName] = useState(registration?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(registration?.contactEmail ?? '')
  const [phone, setPhone] = useState(registration?.phone ?? '')
  const [departurePostalCode, setDeparturePostalCode] = useState(registration?.departurePostalCode ?? '')
  const [departureCountry, setDepartureCountry] = useState(registration?.departureCountry ?? '')
  const [amountPaid, setAmountPaid] = useState(registration?.amountPaid ?? 0)
  const [paymentStatus, setPaymentStatus] = useState(registration?.paymentStatus ?? 'pending')
  const [internalNote, setInternalNote] = useState(registration?.internalNote ?? '')
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

  const validateEmail = (email) => {
    if (!email) return true // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!contactName.trim()) {
      setError('Veuillez saisir le nom du participant')
      return
    }

    if (contactEmail && !validateEmail(contactEmail)) {
      setError('Veuillez saisir une adresse email valide')
      return
    }

    if (amountPaid < 0) {
      setError('Le montant payé ne peut pas être négatif')
      return
    }

    try {
      await onSubmit({
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        phone: phone.trim(),
        departure_postal_code: departurePostalCode.trim(),
        departure_country: departureCountry.trim(),
        amount_paid: amountPaid,
        payment_status: paymentStatus,
        internal_note: internalNote.trim(),
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
                  {isEdit ? 'Modifier l\'inscription' : 'Nouvelle inscription'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations du participant'
                    : 'Inscrivez un nouveau participant à la formation'}
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
                {/* Contact Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Nom du participant <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="contact-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className={inputBase}
                    placeholder="ex: Marie Dupont"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Email du participant
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={inputBase}
                    placeholder="ex: marie.dupont@example.com"
                  />
                  <p className="text-xs text-stone-500 mt-1.5">
                    Optionnel - pour envoyer la confirmation d'inscription
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputBase}
                    placeholder="ex: +32 470 12 34 56"
                  />
                  <p className="text-xs text-stone-500 mt-1.5">
                    Optionnel - utile pour le contact le jour de la formation
                  </p>
                </div>

                {/* Departure location - for carpooling */}
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Lieu de départ (covoiturage)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        id="departure-postal-code"
                        type="text"
                        value={departurePostalCode}
                        onChange={(e) => setDeparturePostalCode(e.target.value)}
                        className={inputBase}
                        placeholder="ex: 1000"
                      />
                      <p className="text-xs text-stone-500 mt-1.5">Code postal</p>
                    </div>
                    <div>
                      <input
                        id="departure-country"
                        type="text"
                        value={departureCountry}
                        onChange={(e) => setDepartureCountry(e.target.value)}
                        className={inputBase}
                        placeholder="ex: Belgique"
                      />
                      <p className="text-xs text-stone-500 mt-1.5">Pays</p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Optionnel - facilite l'organisation du covoiturage entre participants
                  </p>
                </div>

                {/* Payment Status and Amount - side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="payment-status"
                      className="block text-sm font-semibold text-stone-700 mb-2"
                    >
                      Statut du paiement
                    </label>
                    <select
                      id="payment-status"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className={inputBase}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

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
                </div>

                {/* Payment info */}
                {trainingPrice > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Prix de la formation : {trainingPrice.toFixed(2)} €</p>
                        {amountPaid > 0 && (
                          <p className="mt-1">
                            Restant dû : {Math.max(0, trainingPrice - amountPaid).toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Internal Note */}
                <div>
                  <label
                    htmlFor="internal-note"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Note interne
                  </label>
                  <textarea
                    id="internal-note"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    className={inputBase}
                    placeholder="Notes pour l'équipe (besoins spéciaux, allergies, etc.)..."
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
                disabled={busy || !contactName.trim()}
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
                  'Créer l\'inscription'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
