import { useState, useEffect, useRef } from 'react'
import SimpleEditor from '@/components/SimpleEditor'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B01A19]/30 focus:border-[#B01A19]'

export function TrainingFormModal({ training, trainingTypes, onSubmit, onCancel, busy = false }) {
  const isEdit = Boolean(training)
  const titleRef = useRef(null)

  const [trainingTypeId, setTrainingTypeId] = useState(training?.trainingTypeId ?? (trainingTypes[0]?.id ?? ''))
  const [title, setTitle] = useState(training?.title ?? '')
  const [vatRate, setVatRate] = useState(training?.vatRate ?? 0)
  const [requiresAccommodation, setRequiresAccommodation] = useState(training?.requiresAccommodation ?? false)
  const [description, setDescription] = useState(training?.description ?? '')
  const [coordinatorNote, setCoordinatorNote] = useState(training?.coordinatorNote ?? '')
  const [categories, setCategories] = useState(() => {
    if (training?.participantCategories?.length > 0) {
      return training.participantCategories.map((c) => ({
        id: c.id,
        label: c.label,
        price: c.price,
        maxSpots: c.maxSpots,
        depositAmount: c.depositAmount || 0,
      }))
    }
    return []
  })
  const [packs, setPacks] = useState(() => {
    if (training?.packs?.length > 0) {
      return training.packs.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        depositAmount: p.depositAmount || 0,
        items: (p.items || []).reduce((acc, pi) => {
          acc[pi.participantCategoryId] = pi.quantity
          return acc
        }, {}),
      }))
    }
    return []
  })
  const [error, setError] = useState(null)

  const activeCategories = categories.filter((c) => !c._destroy && c.label.trim())
  const showPacks = activeCategories.length >= 2

  // Focus first input when modal opens
  useEffect(() => {
    if (titleRef.current) {
      const timer = setTimeout(() => {
        titleRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Auto-fill categories from training type defaults when type changes
  useEffect(() => {
    if (!isEdit && categories.length === 0 && trainingTypeId) {
      const selectedType = trainingTypes.find((t) => t.id === trainingTypeId)
      const defaults = selectedType?.defaultCategories || []
      if (defaults.length > 0) {
        setCategories(defaults.map((c, i) => ({
          id: `new-${Date.now()}-${i}`,
          label: c.label || '',
          price: c.price || 0,
          maxSpots: c.maxSpots || c.max_spots || 0,
          depositAmount: c.depositAmount || c.deposit_amount || 0,
        })))
      }
    }
  }, [trainingTypeId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const computePackSavings = (pack) => {
    const individualTotal = activeCategories.reduce((sum, cat) => {
      const qty = pack.items?.[cat.id] || 0
      return sum + (Number(cat.price) || 0) * qty
    }, 0)
    return individualTotal - (Number(pack.price) || 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!trainingTypeId) {
      setError('Veuillez sélectionner un type d\'activité')
      return
    }

    if (!title.trim()) {
      setError('Veuillez saisir un titre')
      return
    }

    if (vatRate < 0 || vatRate >= 100) {
      setError('Le taux de TVA doit être entre 0 et 100')
      return
    }

    const categoriesPayload = categories
      .filter((c) => c._destroy || c.label.trim())
      .map((c) => ({
        ...(c.id && !String(c.id).startsWith('new-') ? { id: c.id } : {}),
        ...(c._destroy ? { _destroy: true } : {
          label: c.label.trim(),
          price: Number(c.price) || 0,
          max_spots: Number(c.maxSpots) || 0,
          deposit_amount: Number(c.depositAmount) || 0,
        }),
      }))

    const packsPayload = packs
      .filter((p) => p._destroy || p.name?.trim())
      .map((p) => ({
        ...(p.id && !String(p.id).startsWith('new-') ? { id: p.id } : {}),
        ...(p._destroy ? { _destroy: true } : {
          name: p.name.trim(),
          price: Number(p.price) || 0,
          deposit_amount: Number(p.depositAmount) || 0,
          items: Object.entries(p.items || {})
            .filter(([, qty]) => Number(qty) > 0)
            .map(([categoryId, qty]) => ({
              participant_category_id: categoryId,
              quantity: Number(qty),
            })),
        }),
      }))

    try {
      await onSubmit({
        training_type_id: trainingTypeId,
        title: title.trim(),
        vat_rate: vatRate,
        requires_accommodation: requiresAccommodation,
        description: description === '<p></p>' ? '' : description,
        coordinator_note: coordinatorNote === '<p></p>' ? '' : coordinatorNote,
        participant_categories: categoriesPayload,
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
                  {isEdit ? 'Modifier l\'activité' : 'Nouvelle activité'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  {isEdit
                    ? 'Mettez à jour les informations de l\'activité'
                    : 'Créez une nouvelle activité Academy'}
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
                    Type d'activité <span className="text-rose-500">*</span>
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

                {/* TVA */}
                <div className="w-full sm:w-1/3">
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

                {/* Participant Categories */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700">
                        Catégories de participants
                      </label>
                      {categories.filter((c) => !c._destroy).length > 0 && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          Capacité totale : {categories.filter((c) => !c._destroy).reduce((sum, c) => sum + (Number(c.maxSpots) || 0), 0)} places
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategories([...categories, { id: `new-${Date.now()}`, label: '', price: 0, maxSpots: 0, depositAmount: 0 }])}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors shrink-0 self-start"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter
                    </button>
                  </div>

                  {categories.filter((c) => !c._destroy).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center">
                      <p className="text-sm text-stone-400">Aucune catégorie de participants</p>
                      <p className="text-xs text-stone-400 mt-1">Ajoutez une catégorie pour définir les tarifs et places</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.filter((c) => !c._destroy).map((cat) => (
                        <div
                          key={cat.id}
                          className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={cat.label}
                              onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, label: e.target.value } : c))}
                              className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                              placeholder="Libellé (ex: Adulte)"
                            />
                            <button
                              type="button"
                              onClick={() => setCategories((cats) => {
                                if (String(cat.id).startsWith('new-')) return cats.filter((c) => c.id !== cat.id)
                                return cats.map((c) => c.id === cat.id ? { ...c, _destroy: true } : c)
                              })}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                              title="Supprimer"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[90px]">
                              <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Tarif</label>
                              <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={cat.price}
                                  onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, price: e.target.value } : c))}
                                  className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                                  placeholder="0"
                                />
                                <span className="flex items-center px-2 bg-stone-50 border-l border-stone-200 text-xs text-stone-500 font-medium">€</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Places</label>
                              <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                                <input
                                  type="number"
                                  min="0"
                                  value={cat.maxSpots}
                                  onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, maxSpots: e.target.value } : c))}
                                  className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                                  placeholder="0"
                                />
                                <span className="flex items-center px-2 bg-stone-50 border-l border-stone-200 text-[10px] text-stone-500 font-medium uppercase tracking-wider">max</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-[100px]">
                              <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Acompte</label>
                              <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={cat.depositAmount}
                                  onChange={(e) => setCategories((cats) => cats.map((c) => c.id === cat.id ? { ...c, depositAmount: e.target.value } : c))}
                                  className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                                  placeholder="0"
                                />
                                <span className="flex items-center px-2 bg-stone-50 border-l border-stone-200 text-xs text-stone-500 font-medium">€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Packs / Formules */}
                {showPacks && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700">
                          Formules / Packs
                        </label>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Proposez des combinaisons à prix réduit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPacks([...packs, { id: `new-${Date.now()}`, name: '', price: 0, depositAmount: 0, items: {} }])}
                        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors shrink-0 self-start"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter un pack
                      </button>
                    </div>

                    {packs.filter((p) => !p._destroy).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center">
                        <p className="text-sm text-stone-400">Aucun pack configuré</p>
                        <p className="text-xs text-stone-400 mt-1">Les packs permettent d'offrir des formules groupées à prix avantageux</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {packs.filter((p) => !p._destroy).map((pack) => {
                          const savings = computePackSavings(pack)
                          const hasComposition = Object.values(pack.items || {}).some((q) => Number(q) > 0)
                          return (
                            <div
                              key={pack.id}
                              className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                            >
                              {/* Pack name + delete */}
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={pack.name}
                                  onChange={(e) => setPacks((ps) => ps.map((p) => p.id === pack.id ? { ...p, name: e.target.value } : p))}
                                  className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-[#B01A19] focus:outline-none focus:ring-2 focus:ring-[#B01A19]/10"
                                  placeholder="Nom du pack (ex: Duo, Famille)"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPacks((ps) => {
                                    if (String(pack.id).startsWith('new-')) return ps.filter((p) => p.id !== pack.id)
                                    return ps.map((p) => p.id === pack.id ? { ...p, _destroy: true } : p)
                                  })}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                  title="Supprimer"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              {/* Price + deposit */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 min-w-[90px]">
                                  <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Prix du pack</label>
                                  <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={pack.price}
                                      onChange={(e) => setPacks((ps) => ps.map((p) => p.id === pack.id ? { ...p, price: e.target.value } : p))}
                                      className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                                      placeholder="0"
                                    />
                                    <span className="flex items-center px-2 bg-stone-50 border-l border-stone-200 text-xs text-stone-500 font-medium">€</span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-[100px]">
                                  <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-1">Acompte</label>
                                  <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden focus-within:border-[#B01A19] focus-within:ring-2 focus-within:ring-[#B01A19]/10">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={pack.depositAmount}
                                      onChange={(e) => setPacks((ps) => ps.map((p) => p.id === pack.id ? { ...p, depositAmount: e.target.value } : p))}
                                      className="w-full px-2.5 py-1.5 text-sm text-right text-stone-900 border-0 bg-transparent focus:outline-none"
                                      placeholder="0"
                                    />
                                    <span className="flex items-center px-2 bg-stone-50 border-l border-stone-200 text-xs text-stone-500 font-medium">€</span>
                                  </div>
                                </div>
                              </div>

                              {/* Composition: qty per category */}
                              <div className="rounded-lg border border-stone-200 bg-white p-2.5">
                                <label className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">Composition</label>
                                <div className="space-y-1.5">
                                  {activeCategories.map((cat) => {
                                    const qty = pack.items?.[cat.id] || 0
                                    return (
                                      <div key={cat.id} className="flex items-center gap-2">
                                        <span className="flex-1 text-xs text-stone-600 truncate">{cat.label || 'Sans nom'}</span>
                                        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={() => setPacks((ps) => ps.map((p) => {
                                              if (p.id !== pack.id) return p
                                              return { ...p, items: { ...p.items, [cat.id]: Math.max(0, (p.items?.[cat.id] || 0) - 1) } }
                                            }))}
                                            disabled={qty === 0}
                                            className="px-2 py-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                          </button>
                                          <span className="w-6 text-center text-xs font-medium text-stone-900">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => setPacks((ps) => ps.map((p) => {
                                              if (p.id !== pack.id) return p
                                              return { ...p, items: { ...p.items, [cat.id]: (p.items?.[cat.id] || 0) + 1 } }
                                            }))}
                                            className="px-2 py-1 text-stone-500 hover:bg-stone-100 transition-colors"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Savings badge */}
                              {hasComposition && savings > 0 && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Économie de {savings.toFixed(2)} €
                                  </span>
                                </div>
                              )}
                              {hasComposition && savings <= 0 && Number(pack.price) > 0 && (
                                <p className="mt-2 text-[10px] text-amber-600">
                                  Le prix du pack est supérieur ou égal au total individuel
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

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
                        L'activité nécessite un hébergement sur place
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
                  'Créer l\'activité'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
