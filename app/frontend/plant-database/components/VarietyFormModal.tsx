import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { apiRequest } from '@/lib/api'
import SimpleEditor from '@/components/SimpleEditor'
import type { Variety, Species } from '../types'

interface VarietyFormModalProps {
  variety?: Variety | null
  availableSpecies: Array<{ id: string; latinName: string }>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  busy?: boolean
  defaultSpeciesId?: string | null
}

interface DuplicateMatch {
  id: string
  latinName: string
  speciesName?: string | null
}

const inputBase =
  'w-full px-4 py-3 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/25 focus:border-[#5B5781]'

const labelBase = 'block text-sm font-semibold text-stone-700 mb-2'

function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || (value ?? 0))
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? null : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform duration-100 hover:scale-110"
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
          >
            <svg
              className={`w-7 h-7 transition-colors duration-150 ${
                filled ? 'text-amber-400' : 'text-stone-200'
              }`}
              fill={filled ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={filled ? 0 : 1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        )
      })}
      <span className="ml-2 text-sm text-stone-500">
        {value === null && 'Non évalué'}
        {value === 1 && 'Faible'}
        {value === 2 && 'Correct'}
        {value === 3 && 'Bon'}
        {value === 4 && 'Très bon'}
        {value === 5 && 'Exceptionnel'}
      </span>
    </div>
  )
}

/** Dynamic autocomplete for species selection */
function SpeciesAutocomplete({ species, value, onChange }: {
  species: Array<{ id: string; latinName: string }>
  value: string
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = species.find((s) => s.id === value)

  const filtered = useMemo(() => {
    if (!query.trim()) return species.slice(0, 20)
    const q = query.toLowerCase()
    return species.filter((s) => s.latinName.toLowerCase().includes(q)).slice(0, 20)
  }, [species, query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { setFocusedIndex(-1) }, [filtered])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); e.preventDefault() }; return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex((p) => Math.min(p + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex((p) => Math.max(p - 1, 0)) }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); pick(filtered[focusedIndex]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const pick = (s: { id: string; latinName: string }) => {
    onChange(s.id)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className="relative">
      {selected && !open ? (
        <div className={`${inputBase} flex items-center justify-between cursor-pointer`} onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}>
          <span className="italic text-stone-900">{selected.latinName}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); clear() }} className="p-0.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className={inputBase}
            placeholder="Rechercher une espèce..."
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === focusedIndex ? 'bg-[#5B5781]/10 text-[#5B5781]' : 'text-stone-700 hover:bg-stone-50'
              } ${s.id === value ? 'font-semibold' : ''}`}
            >
              <span className="italic">{s.latinName}</span>
            </button>
          )) : (
            <div className="px-4 py-3 text-sm text-stone-400">Aucune espèce trouvée</div>
          )}
        </div>
      )}
    </div>
  )
}

export function VarietyFormModal({
  variety,
  availableSpecies,
  onSubmit,
  onCancel,
  busy = false,
  defaultSpeciesId = null,
}: VarietyFormModalProps) {
  const isEdit = Boolean(variety)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [speciesId, setSpeciesId] = useState(variety?.speciesId ?? defaultSpeciesId ?? '')
  const [latinName, setLatinName] = useState(variety?.latinName ?? '')
  const [productivity, setProductivity] = useState(variety?.productivity ?? '')
  const [tasteRating, setTasteRating] = useState<number | null>(variety?.tasteRating ?? null)
  const [fruitSize, setFruitSize] = useState(variety?.fruitSize ?? '')
  const [storageLife, setStorageLife] = useState(variety?.storageLife ?? '')
  const [maturity, setMaturity] = useState(variety?.maturity ?? '')
  const [diseaseResistance, setDiseaseResistance] = useState(variety?.diseaseResistance ?? '')
  const [additionalNotes, setAdditionalNotes] = useState(variety?.additionalNotes ?? '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Duplicate check for variety name within the selected species
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => firstInputRef.current?.focus(), 120)
    return () => clearTimeout(timer)
  }, [])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced duplicate check for variety name within the selected species
  useEffect(() => {
    const trimmed = latinName.trim()
    if (!trimmed || trimmed.length < 2 || !speciesId) {
      setDuplicateMatch(null)
      setCheckingDuplicate(false)
      return
    }

    // When editing, skip if the name hasn't changed
    if (isEdit && variety?.latinName === trimmed) {
      setDuplicateMatch(null)
      setCheckingDuplicate(false)
      return
    }

    setCheckingDuplicate(true)
    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest(`/api/v1/plants/search?query=${encodeURIComponent(trimmed)}`)
        const items = res?.items ?? (Array.isArray(res) ? res : [])
        // Filter to varieties of the same species with the same name
        const match = items.find((r: any) =>
          r.type === 'variety' &&
          r.latinName?.toLowerCase() === trimmed.toLowerCase() &&
          r.speciesId === speciesId &&
          (!isEdit || r.id !== variety?.id)
        )
        if (match) {
          setDuplicateMatch({ id: match.id, latinName: match.latinName, speciesName: match.speciesName || selectedSpeciesName || null })
        } else {
          setDuplicateMatch(null)
        }
      } catch {
        setDuplicateMatch(null)
      } finally {
        setCheckingDuplicate(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [latinName, speciesId, isEdit, variety, availableSpecies])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!latinName.trim()) next.latinName = 'Le nom de la variété est obligatoire'
    if (!speciesId) next.speciesId = "L'espèce parente est obligatoire"
    setErrors(next)
    return Object.keys(next).length === 0
  }, [latinName, speciesId])

  useEffect(() => {
    if (Object.keys(touched).length > 0) validate()
  }, [latinName, speciesId, touched, validate])

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))
  const showError = (field: string) => touched[field] && errors[field]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ latinName: true, speciesId: true })
    if (!validate()) return

    await onSubmit({
      species_id: speciesId,
      latin_name: latinName.trim(),
      productivity: productivity.trim(),
      taste_rating: tasteRating ?? null,
      fruit_size: fruitSize.trim(),
      storage_life: storageLife.trim(),
      maturity: maturity.trim(),
      disease_resistance: (diseaseResistance === '<p></p>' ? '' : diseaseResistance.trim()) || '',
      additional_notes: (additionalNotes === '<p></p>' ? '' : additionalNotes.trim()) || '',
      common_names: [],
    })
  }

  const canSubmit = !busy && latinName.trim() && speciesId && Object.keys(errors).length === 0

  const selectedSpeciesName = availableSpecies.find((s) => s.id === speciesId)?.latinName

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'fadeIn 200ms ease-out' }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={panelRef}
          className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl pointer-events-auto max-h-[92vh] overflow-hidden flex flex-col"
          style={{ animation: 'modalSlideIn 250ms ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-stone-100 bg-gradient-to-br from-amber-50/80 via-stone-50/50 to-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04]">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-amber-900 w-full h-full">
                <circle cx="50" cy="40" r="25" />
                <path d="M50 65C50 65 35 70 30 80C25 90 40 95 50 95C60 95 75 90 70 80C65 70 50 65 50 65Z" />
              </svg>
            </div>

            <div className="flex items-center justify-between relative">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-4.5 h-4.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading)' }}>
                    {isEdit ? 'Modifier la variété' : 'Nouvelle variété'}
                  </h3>
                </div>
                <p className="text-sm text-stone-500 ml-[42px]">
                  {isEdit
                    ? 'Mettez à jour les caractéristiques de la variété'
                    : 'Ajoutez un cultivar avec ses propriétés fruitières'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 h-full">
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">

              {/* Species selector — dynamic autocomplete */}
              <div>
                <label className={labelBase}>
                  Espèce parente <span className="text-rose-500">*</span>
                </label>
                <SpeciesAutocomplete
                  species={availableSpecies}
                  value={speciesId}
                  onChange={(id) => { setSpeciesId(id); markTouched('speciesId') }}
                />
                {showError('speciesId') && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.speciesId}</p>
                )}
                {selectedSpeciesName && (
                  <p className="mt-1.5 text-xs text-stone-400 italic">
                    Variété de {selectedSpeciesName}
                  </p>
                )}
              </div>

              {/* Variety name with duplicate check */}
              <div>
                <label htmlFor="variety-latin" className={labelBase}>
                  Nom de la variété <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={firstInputRef}
                    id="variety-latin"
                    type="text"
                    value={latinName}
                    onChange={(e) => setLatinName(e.target.value)}
                    onBlur={() => markTouched('latinName')}
                    className={`${inputBase} pr-10 font-medium ${showError('latinName') ? '!border-red-400 !ring-red-200' : duplicateMatch ? '!border-amber-400 !ring-amber-200' : ''}`}
                    placeholder="ex: Golden Delicious, Burlat, Williams..."
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingDuplicate && (
                      <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {!checkingDuplicate && latinName.trim().length >= 2 && speciesId && !errors.latinName && !duplicateMatch && (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!checkingDuplicate && duplicateMatch && (
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                </div>
                {showError('latinName') && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.latinName}</p>
                )}
                {!errors.latinName && duplicateMatch && (
                  <div className="mt-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200/60 flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      La variété <span className="italic">{duplicateMatch.latinName}</span> existe déjà
                      {duplicateMatch.speciesName && (
                        <span className="font-normal text-amber-700"> pour {duplicateMatch.speciesName}</span>
                      )}
                      . Vous pouvez tout de même continuer si nécessaire.
                    </p>
                  </div>
                )}
                {!errors.latinName && !duplicateMatch && latinName.trim().length >= 2 && speciesId && !checkingDuplicate && (
                  <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Nom disponible
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-stone-100" />

              {/* Taste Rating */}
              <div>
                <label className={labelBase}>Note gustative</label>
                <StarRating value={tasteRating} onChange={setTasteRating} />
              </div>

              {/* Fruit characteristics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="variety-productivity" className={labelBase}>Productivité</label>
                  <input
                    id="variety-productivity"
                    type="text"
                    value={productivity}
                    onChange={(e) => setProductivity(e.target.value)}
                    className={inputBase}
                    placeholder="ex: Très productive, Alternante..."
                  />
                </div>
                <div>
                  <label htmlFor="variety-fruit-size" className={labelBase}>Taille du fruit</label>
                  <input
                    id="variety-fruit-size"
                    type="text"
                    value={fruitSize}
                    onChange={(e) => setFruitSize(e.target.value)}
                    className={inputBase}
                    placeholder="ex: Moyen (6-8cm), Gros..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="variety-maturity" className={labelBase}>Maturité</label>
                  <input
                    id="variety-maturity"
                    type="text"
                    value={maturity}
                    onChange={(e) => setMaturity(e.target.value)}
                    className={inputBase}
                    placeholder="ex: Mi-août, Octobre..."
                  />
                </div>
                <div>
                  <label htmlFor="variety-storage" className={labelBase}>Conservation</label>
                  <input
                    id="variety-storage"
                    type="text"
                    value={storageLife}
                    onChange={(e) => setStorageLife(e.target.value)}
                    className={inputBase}
                    placeholder="ex: 3 mois, Longue durée..."
                  />
                </div>
              </div>

              <div>
                <label className={labelBase}>Résistance aux maladies</label>
                <SimpleEditor content={diseaseResistance} onUpdate={setDiseaseResistance} toolbar={['bold', 'italic', '|', 'bulletList', 'orderedList']} />
              </div>

              {/* Divider */}
              <div className="border-t border-stone-100" />

              <div>
                <label className={labelBase}>Informations complémentaires</label>
                <SimpleEditor content={additionalNotes} onUpdate={setAdditionalNotes} toolbar={['bold', 'italic', 'strike', '|', 'bulletList', 'orderedList']} />
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-xs text-stone-400 hidden sm:block">
                <span className="text-rose-500">*</span> Champs obligatoires
              </p>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl font-medium text-stone-700 border border-stone-200 hover:bg-stone-100 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-[#5B5781] hover:bg-[#4a4770] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none flex items-center gap-2"
                >
                  {busy ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : isEdit ? (
                    'Enregistrer'
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Créer la variété
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
