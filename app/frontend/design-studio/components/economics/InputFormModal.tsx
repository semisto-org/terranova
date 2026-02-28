import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { EconomicInput, InputCategory, LaborType } from './types'
import { INPUT_CATEGORY_LABELS, LABOR_TYPE_LABELS } from './types'

interface InputFormModalProps {
  input: EconomicInput | null
  presetCategory?: InputCategory
  busy: boolean
  onSave: (values: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

const CATEGORIES = Object.entries(INPUT_CATEGORY_LABELS) as [InputCategory, string][]
const LABOR_TYPES = Object.entries(LABOR_TYPE_LABELS) as [LaborType, string][]

export function InputFormModal({ input, presetCategory, busy, onSave, onClose }: InputFormModalProps) {
  const isEdit = !!input

  const [date, setDate] = useState(input?.date ?? new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<InputCategory>(input?.category ?? presetCategory ?? 'plants')
  const [amountEur, setAmountEur] = useState(input ? (input.amount_cents / 100).toString() : '')
  const [quantity, setQuantity] = useState(input?.quantity?.toString() ?? '')
  const [unit, setUnit] = useState(input?.unit ?? (presetCategory === 'labor' ? 'h' : ''))
  const [laborType, setLaborType] = useState<LaborType | ''>(input?.labor_type ?? '')
  const [notes, setNotes] = useState(input?.notes ?? '')

  useEffect(() => {
    if (category === 'labor' && !unit) setUnit('h')
    if (category !== 'labor') setLaborType('')
  }, [category, unit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const values: Record<string, unknown> = {
      date,
      category,
      amount_cents: Math.round(parseFloat(amountEur || '0') * 100),
      quantity: parseFloat(quantity || '0'),
      unit,
      notes: notes || null,
      labor_type: category === 'labor' && laborType ? laborType : null,
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
              {isEdit ? 'Modifier le coût' : 'Nouveau coût'}
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
                  onChange={(e) => setCategory(e.target.value as InputCategory)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                >
                  {CATEGORIES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            {category === 'labor' && (
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Type de travail</span>
                <select
                  value={laborType}
                  onChange={(e) => setLaborType(e.target.value as LaborType)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AFBD00]/40 focus:border-transparent"
                >
                  <option value="">Non spécifié</option>
                  {LABOR_TYPES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">Montant (€)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
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
                  placeholder="kg, h, m²…"
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
