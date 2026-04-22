import { useEffect, useState } from 'react'
import { Minus, Plus, TrendingUp, X } from 'lucide-react'
import { SHOP_ACCENT, type ShopProduct } from './types'

interface RestockModalProps {
  product: ShopProduct
  onConfirm: (delta: number) => Promise<void>
  onCancel: () => void
}

export function RestockModal({ product, onConfirm, onCancel }: RestockModalProps) {
  const [delta, setDelta] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const newStock = product.stockQuantity + delta
  const invalid = newStock < 0 || delta === 0

  const submit = async () => {
    if (invalid) {
      setError(newStock < 0 ? 'Le stock ne peut pas être négatif.' : null)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(delta)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajustement.")
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: SHOP_ACCENT }}>
              Ajustement de stock
            </p>
            <h2 className="mt-1 text-lg font-bold text-stone-900 inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stone-400" />
              {product.name}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setDelta(delta - 1)}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
            className="w-24 text-center px-2 py-2 text-2xl font-mono font-semibold bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
          />
          <button
            onClick={() => setDelta(delta + 1)}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-stone-500">
            Stock actuel : <span className="font-mono text-stone-900 font-semibold">{product.stockQuantity}</span>
          </span>
          <span className="text-stone-500">
            Après :{' '}
            <span className={`font-mono font-semibold ${newStock < 0 ? 'text-red-600' : 'text-stone-900'}`}>
              {newStock}
            </span>
          </span>
        </div>

        <p className="text-[11px] text-stone-400 mt-2">
          Positif pour réapprovisionner, négatif pour corriger (casse, perte, inventaire).
        </p>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={busy || invalid}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: SHOP_ACCENT }}
          >
            {busy ? 'Ajustement…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
