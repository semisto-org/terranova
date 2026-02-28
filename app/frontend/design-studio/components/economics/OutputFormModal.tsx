import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import type { EconomicOutput, OutputCategory, SpeciesSearchResult } from './types'
import { OUTPUT_CATEGORY_LABELS } from './types'

interface OutputFormModalProps {
  output: EconomicOutput | null
  busy: boolean
  onSave: (values: Record<string, unknown>) => Promise<void>
  onClose: () => void
  onSearchSpecies: (query: string) => Promise<SpeciesSearchResult[]>
}

const CATEGORIES = Object.entries(OUTPUT_CATEGORY_LABELS) as [OutputCategory, string][]

export function OutputFormModal({ output, busy, onSave, onClose, onSearchSpecies }: OutputFormModalProps) {
  const isEdit = !!output

  const [date, setDate] = useState(output?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<OutputCategory>(output?.category ?? 'harvest')
  const [amountEur, setAmountEur] = useState(output?.amount_cents != null ? (output.amount_cents / 100).toString() : '')
  const [quantity, setQuantity] = useState(output?.quantity?.toString() ?? '')
  const [unit, setUnit] = useState(output?.unit ?? 'kg')
  const [notes, setNotes] = useState(output?.notes ?? '')

  // Species autocomplete state
  const [speciesId, setSpeciesId] = useState<string | null>(output?.species_id ?? null)
  const [speciesName, setSpeciesName] = useState(output?.species_latin_name ?? output?.species_name ?? '')
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [speciesResults, setSpeciesResults] = useState<SpeciesSearchResult[]>([])
  const [speciesLoading, setSpeciesLoading] = useState(false)
  const [speciesOpen, setSpeciesOpen] = useState(false)
  const speciesInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (speciesQuery.length < 2) {
      setSpeciesResults([])
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSpeciesLoading(true)
      try {
        const results = await onSearchSpecies(speciesQuery)
        setSpeciesResults(results.filter((r) => r.type === 'species').slice(0, 15))
      } finally {
        setSpeciesLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [speciesQuery, onSearchSpecies])

  const selectSpecies = (result: SpeciesSearchResult) => {
    setSpeciesId(result.id)
    setSpeciesName(result.latinName)
    setSpeciesQuery('')
    setSpeciesOpen(false)
  }

  const clearSpecies = () => {
    setSpeciesId(null)
    setSpeciesName('')
    setSpeciesQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const values: Record<string, unknown> = {
      date,
      category,
      amount_cents: amountEur ? Math.round(parseFloat(amountEur) * 100) : null,
      quantity: parseFloat(quantity || '0'),
      unit,
      notes: notes || null,
      species_id: speciesId || null,
      species_name: speciesName || null,
    }
    await onSave(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.42)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-lg font-semibold text-stone-900">
              {isEdit ? 'Modifier le revenu' : 'Nouveau revenu'}
            </h2>
            <button type="button" onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Date</span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Catégorie</span>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OutputCategory)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                >
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Species autocomplete */}
            <div className="block">
              <span className="text-sm font-medium text-stone-700">Espèce</span>
              <div className="relative mt-1">
                {speciesId ? (
                  <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <span className="flex-1 text-sm text-stone-800 italic">{speciesName}</span>
                    <button
                      type="button"
                      onClick={clearSpecies}
                      className="p-0.5 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                      <input
                        ref={speciesInputRef}
                        type="text"
                        value={speciesQuery}
                        onChange={(e) => {
                          setSpeciesQuery(e.target.value)
                          setSpeciesOpen(true)
                        }}
                        onFocus={() => setSpeciesOpen(true)}
                        placeholder="Rechercher une espèce…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                      />
                    </div>

                    {speciesOpen && speciesQuery.length >= 2 && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setSpeciesOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-stone-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                          {speciesLoading ? (
                            <div className="flex items-center justify-center py-5">
                              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                            </div>
                          ) : speciesResults.length === 0 ? (
                            <div className="py-4 px-3 text-sm text-stone-500 text-center">Aucune espèce trouvée</div>
                          ) : (
                            <ul className="py-1">
                              {speciesResults.map((result) => (
                                <li key={result.id}>
                                  <button
                                    type="button"
                                    onClick={() => selectSpecies(result)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-stone-50 transition-colors"
                                  >
                                    <span className="text-sm text-stone-800 italic">{result.latinName}</span>
                                    {result.commonName && (
                                      <span className="text-xs text-stone-500">({result.commonName})</span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Montant (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountEur}
                  onChange={(e) => setAmountEur(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Quantité</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Unité</span>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, L, pièces…"
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Notes</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Détails optionnels…"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent resize-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-100 bg-stone-50/50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-[#AFBD00] text-sm font-semibold text-stone-900 hover:bg-[#9BAA00] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
