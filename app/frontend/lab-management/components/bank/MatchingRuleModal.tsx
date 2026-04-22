import { useEffect, useState } from 'react'
import { Bookmark, X } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface MatchingRuleModalProps {
  // The transaction whose data seeds the rule
  transaction: {
    id: string
    organizationId: string | null
    counterpartName: string | null
    remittanceInfo: string | null
    counterpartIban: string | null
  }
  // The expense that was just matched (used to suggest fields)
  matchedExpense?: {
    supplierContactId?: string | null
    expenseCategoryId?: string | null
    expenseType?: string | null
    vatRate?: string | null
    supplierName?: string | null
    categoryLabel?: string | null
  } | null
  onSaved: () => void
  onCancel: () => void
}

const PATTERN_FIELD_OPTIONS = [
  { value: 'counterpart_name', label: 'Nom du tiers' },
  { value: 'remittance_info', label: 'Communication' },
  { value: 'counterpart_iban', label: 'IBAN' },
]

export function MatchingRuleModal({ transaction, matchedExpense, onSaved, onCancel }: MatchingRuleModalProps) {
  const [patternField, setPatternField] = useState<'counterpart_name' | 'remittance_info' | 'counterpart_iban'>(
    transaction.counterpartName ? 'counterpart_name' : 'remittance_info',
  )
  const initialPattern = (() => {
    const value = transaction.counterpartName || transaction.remittanceInfo || ''
    // Extract a short distinguishing slice (first significant word)
    const trimmed = value.trim().split(/[\s,;]+/).slice(0, 2).join(' ')
    return trimmed.slice(0, 32)
  })()
  const [patternValue, setPatternValue] = useState(initialPattern)
  const [scope, setScope] = useState<'global' | 'org'>('org')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patternValue.trim()) {
      setError('Le motif ne peut pas être vide.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        pattern_field: patternField,
        pattern_value: patternValue.trim(),
        organization_id: scope === 'org' ? transaction.organizationId : null,
      }
      if (matchedExpense?.supplierContactId) body.suggested_supplier_contact_id = matchedExpense.supplierContactId
      if (matchedExpense?.expenseCategoryId) body.suggested_expense_category_id = matchedExpense.expenseCategoryId
      if (matchedExpense?.expenseType) body.suggested_expense_type = matchedExpense.expenseType
      if (matchedExpense?.vatRate) body.suggested_vat_rate = matchedExpense.vatRate

      await apiRequest('/api/v1/bank/matching_rules', { method: 'POST', body: JSON.stringify(body) })
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-[2px] px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#5B5781]">Apprendre</p>
            <h2 className="mt-1 text-xl font-bold text-stone-900 inline-flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-stone-400" />
              Mémoriser cette correspondance
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">
              Les futures transactions correspondant à ce motif pré-rempliront les mêmes informations.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Champ à matcher
            </label>
            <select
              value={patternField}
              onChange={(e) => setPatternField(e.target.value as typeof patternField)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            >
              {PATTERN_FIELD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Motif (recherche par contenu)
            </label>
            <input
              type="text"
              value={patternValue}
              onChange={(e) => setPatternValue(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
              placeholder="Ex. STIB"
              autoFocus
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Recherche insensible à la casse, accepte une partie du nom (ex. "STIB" matche "STIB-MIVB Brussels").
            </p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
              Portée
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope('org')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  scope === 'org'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                Cette structure uniquement
              </button>
              <button
                type="button"
                onClick={() => setScope('global')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  scope === 'global'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                }`}
              >
                Toutes les structures
              </button>
            </div>
          </div>

          {/* Suggestions preview */}
          {matchedExpense && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
                Sera pré-rempli
              </div>
              {matchedExpense.supplierName && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Fournisseur</span>
                  <span className="font-medium text-stone-700">{matchedExpense.supplierName}</span>
                </div>
              )}
              {matchedExpense.categoryLabel && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Catégorie</span>
                  <span className="font-medium text-stone-700">{matchedExpense.categoryLabel}</span>
                </div>
              )}
              {matchedExpense.expenseType && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Type</span>
                  <span className="font-mono text-stone-700">{matchedExpense.expenseType}</span>
                </div>
              )}
              {matchedExpense.vatRate && (
                <div className="flex justify-between">
                  <span className="text-stone-500">TVA</span>
                  <span className="font-mono text-stone-700">{matchedExpense.vatRate}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900">
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#5B5781' }}
            >
              <Bookmark className="w-4 h-4" />
              {busy ? 'Mémorisation…' : 'Créer la règle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
