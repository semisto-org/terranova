import { useState, useEffect, useRef, useCallback } from 'react'
import { Link2, X, Loader2 } from 'lucide-react'
import { apiRequest } from '../../lib/api'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
  { value: 'paid', label: 'Payé' },
]

function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function RegistrationFormModal({ registration, trainingPrice, participantCategories = [], packs = [], academySettings, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(registration)
  const nameRef = useRef(null)
  const suggestionsRef = useRef(null)

  const [contactId, setContactId] = useState(registration?.contactId ?? null)
  const [contactName, setContactName] = useState(registration?.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(registration?.contactEmail ?? '')
  const [phone, setPhone] = useState(registration?.phone ?? '')
  const [departurePostalCode, setDeparturePostalCode] = useState(registration?.departurePostalCode ?? '')
  const [departureCountry, setDepartureCountry] = useState(registration?.departureCountry ?? '')
  const [amountPaid, setAmountPaid] = useState(registration?.amountPaid ?? 0)
  const [paymentStatus, setPaymentStatus] = useState(registration?.paymentStatus ?? 'pending')
  const [internalNote, setInternalNote] = useState(registration?.internalNote ?? '')
  const [items, setItems] = useState(() => {
    if (registration?.items?.length > 0) {
      return registration.items.reduce((acc, item) => {
        acc[item.participantCategoryId] = item.quantity
        return acc
      }, {})
    }
    return {}
  })
  const [selectedPacks, setSelectedPacks] = useState(() => {
    if (registration?.packs?.length > 0) {
      return registration.packs.reduce((acc, p) => {
        acc[p.packId] = p.quantity
        return acc
      }, {})
    }
    return {}
  })
  const [error, setError] = useState(null)

  const discountPerSpot = academySettings?.volumeDiscountPerSpot ?? 10
  const discountMax = academySettings?.volumeDiscountMax ?? 30

  const computeDiscount = (qty) => {
    if (qty <= 1) return 0
    return Math.min(discountPerSpot * (qty - 1), discountMax)
  }

  const computeSubtotal = (price, qty) => {
    const discount = computeDiscount(qty)
    return +(price * qty * (1 - discount / 100)).toFixed(2)
  }

  // Spots used by selected packs per category
  const spotsUsedByPacks = {}
  packs.forEach((pack) => {
    const qty = selectedPacks[pack.id] || 0
    if (qty > 0) {
      (pack.items || []).forEach((pi) => {
        spotsUsedByPacks[pi.participantCategoryId] = (spotsUsedByPacks[pi.participantCategoryId] || 0) + pi.quantity * qty
      })
    }
  })

  const packsTotal = packs.reduce((sum, pack) => {
    const qty = selectedPacks[pack.id] || 0
    return sum + pack.price * qty
  }, 0)

  const itemsTotal = participantCategories.reduce((sum, cat) => {
    const qty = items[cat.id] || 0
    return sum + computeSubtotal(cat.price, qty)
  }, 0)

  const grandTotal = packsTotal + itemsTotal

  const hasItems = Object.values(items).some((qty) => qty > 0)
  const hasPacks = Object.values(selectedPacks).some((qty) => qty > 0)
  const hasSelection = hasItems || hasPacks

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

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

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchContacts = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }
      setSearchLoading(true)
      try {
        const res = await apiRequest(`/api/v1/lab/contacts?q=${encodeURIComponent(query)}&contact_type=person`)
        const items = res.items || []
        setSuggestions(items)
        setShowSuggestions(items.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setSearchLoading(false)
      }
    }, 300),
    []
  )

  const handleNameChange = (value) => {
    setContactName(value)
    if (contactId) setContactId(null)
    searchContacts(value)
  }

  const handleSelectContact = (contact) => {
    setContactId(contact.id)
    setContactName(contact.name || '')
    setContactEmail(contact.email || '')
    setPhone(contact.phone || '')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleUnlinkContact = () => {
    setContactId(null)
  }

  const validateEmail = (email) => {
    if (!email) return true
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Max qty for a pack: limited by the category with the fewest remaining spots
  const getPackMaxQty = (pack) => {
    if (!pack.items || pack.items.length === 0) return 0
    return Math.min(...pack.items.map((pi) => {
      const cat = participantCategories.find((c) => c.id === pi.participantCategoryId)
      if (!cat) return 0
      const baseRemaining = cat.spotsRemaining + (registration?.items?.find((i) => i.participantCategoryId === cat.id)?.quantity || 0)
      // Subtract spots used by OTHER packs (not this one)
      const otherPackSpots = packs.reduce((sum, otherPack) => {
        if (otherPack.id === pack.id) return sum
        const otherQty = selectedPacks[otherPack.id] || 0
        const otherPi = (otherPack.items || []).find((i) => i.participantCategoryId === pi.participantCategoryId)
        return sum + (otherPi ? otherPi.quantity * otherQty : 0)
      }, 0)
      // Subtract individual items
      const individualQty = items[pi.participantCategoryId] || 0
      const available = baseRemaining - otherPackSpots - individualQty
      return Math.floor(available / pi.quantity)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

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

    const validCategoryIds = new Set(participantCategories.map((c) => c.id))
    const itemsPayload = Object.entries(items)
      .filter(([categoryId, qty]) => qty > 0 && validCategoryIds.has(categoryId))
      .map(([categoryId, qty]) => ({
        participant_category_id: categoryId,
        quantity: Number(qty),
      }))

    const packsPayload = Object.entries(selectedPacks)
      .filter(([, qty]) => qty > 0)
      .map(([packId, qty]) => ({
        pack_id: packId,
        quantity: Number(qty),
      }))

    try {
      await onSubmit({
        contact_id: contactId || undefined,
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        phone: phone.trim(),
        departure_postal_code: departurePostalCode.trim(),
        departure_country: departureCountry.trim(),
        amount_paid: amountPaid,
        payment_status: paymentStatus,
        internal_note: internalNote.trim(),
        items: participantCategories.length > 0 ? itemsPayload : undefined,
        packs: packsPayload.length > 0 ? packsPayload : undefined,
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
                    : 'Inscrivez un nouveau participant à l\'activité'}
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
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full" data-1p-ignore>
            <div className="flex-1 overflow-y-auto min-h-0 p-6">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in slide-in-from-top-2 duration-200">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Contact Name with autocomplete */}
                <div ref={suggestionsRef} className="relative">
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-semibold text-stone-700 mb-2"
                  >
                    Nom du participant <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={nameRef}
                      id="contact-name"
                      type="text"
                      value={contactName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                      required
                      autoComplete="off"
                      className={inputBase}
                      placeholder="ex: Marie Dupont"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Contact link indicator */}
                  {contactId && (
                    <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 w-fit">
                      <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Lié à un contact existant</span>
                      <button
                        type="button"
                        onClick={handleUnlinkContact}
                        className="ml-1 p-0.5 rounded text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Délier le contact"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectContact(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span className="text-sm font-medium text-stone-900">{c.name}</span>
                          {c.email && (
                            <span className="text-xs text-stone-500 ml-2">{c.email}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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
                    Optionnel - utile pour le contact le jour de l'activité
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

                {/* Packs Selection */}
                {packs.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      Formules
                    </label>
                    <div className="space-y-2">
                      {packs.map((pack) => {
                        const qty = selectedPacks[pack.id] || 0
                        const maxQty = Math.max(0, getPackMaxQty(pack))
                        const composition = (pack.items || []).map((pi) => {
                          const cat = participantCategories.find((c) => c.id === pi.participantCategoryId)
                          return `${pi.quantity} ${cat?.label || '?'}`
                        }).join(' + ')
                        const individualPrice = (pack.items || []).reduce((sum, pi) => {
                          const cat = participantCategories.find((c) => c.id === pi.participantCategoryId)
                          return sum + (cat?.price || 0) * pi.quantity
                        }, 0)
                        const savings = individualPrice - pack.price

                        return (
                          <div
                            key={pack.id}
                            className={`rounded-xl border p-3 transition-colors ${
                              qty > 0
                                ? 'border-[#B01A19]/20 bg-red-50/30'
                                : 'border-stone-200 bg-white'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-stone-900">{pack.name}</span>
                                  <span className="text-sm font-semibold text-[#B01A19]">{pack.price.toFixed(2)} €</span>
                                  {savings > 0 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                                      -{savings.toFixed(2)} €
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-400 mt-0.5">{composition}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPacks((prev) => ({ ...prev, [pack.id]: Math.max(0, (prev[pack.id] || 0) - 1) }))}
                                    disabled={qty === 0}
                                    className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="w-8 text-center text-sm font-medium text-stone-900">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPacks((prev) => ({ ...prev, [pack.id]: Math.min(maxQty + qty, (prev[pack.id] || 0) + 1) }))}
                                    disabled={maxQty <= 0}
                                    className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                                {qty > 0 && (
                                  <div className="text-right min-w-[80px]">
                                    <span className="text-sm font-medium text-stone-900">{(pack.price * qty).toFixed(2)} €</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Participant Categories — Place Selection */}
                {participantCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-3">
                      Places individuelles
                    </label>
                    <div className="space-y-2">
                      {participantCategories.map((cat) => {
                        const qty = items[cat.id] || 0
                        const discount = computeDiscount(qty)
                        const subtotal = computeSubtotal(cat.price, qty)
                        const packSpotsUsed = spotsUsedByPacks[cat.id] || 0
                        const baseRemaining = cat.spotsRemaining + (registration?.items?.find((i) => i.participantCategoryId === cat.id)?.quantity || 0)
                        const maxQty = Math.max(0, baseRemaining - packSpotsUsed)
                        const isClosed = cat.maxSpots === 0

                        return (
                          <div
                            key={cat.id}
                            className={`rounded-xl border p-3 transition-colors ${
                              isClosed
                                ? 'border-stone-100 bg-stone-50 opacity-50'
                                : qty > 0
                                  ? 'border-[#B01A19]/20 bg-red-50/30'
                                  : 'border-stone-200 bg-white'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-stone-900">{cat.label}</span>
                                  <span className="text-sm text-stone-500">{cat.price.toFixed(2)} €</span>
                                </div>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {isClosed ? 'Fermé' : `${maxQty} place${maxQty !== 1 ? 's' : ''} disponible${maxQty !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                              {!isClosed && (
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => setItems((prev) => ({ ...prev, [cat.id]: Math.max(0, (prev[cat.id] || 0) - 1) }))}
                                      disabled={qty === 0}
                                      className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <span className="w-8 text-center text-sm font-medium text-stone-900">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setItems((prev) => ({ ...prev, [cat.id]: Math.min(maxQty, (prev[cat.id] || 0) + 1) }))}
                                      disabled={qty >= maxQty}
                                      className="px-2.5 py-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                  {qty > 0 && (
                                    <div className="text-right min-w-[80px]">
                                      <span className="text-sm font-medium text-stone-900">{subtotal.toFixed(2)} €</span>
                                      {discount > 0 && (
                                        <span className="block text-xs text-emerald-600">-{discount}%</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Grand Total */}
                    {hasSelection && (
                      <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-stone-700">Total</span>
                          <span className="text-base font-bold text-stone-900">{grandTotal.toFixed(2)} €</span>
                        </div>
                        {amountPaid > 0 && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-stone-500">Restant dû</span>
                            <span className="text-sm text-stone-600">{Math.max(0, grandTotal - amountPaid).toFixed(2)} €</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy single-price info */}
                {participantCategories.length === 0 && trainingPrice > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Prix de l'activité : {trainingPrice.toFixed(2)} €</p>
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
