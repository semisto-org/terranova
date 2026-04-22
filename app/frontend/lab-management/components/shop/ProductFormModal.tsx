import { useEffect, useState } from 'react'
import { Package, X } from 'lucide-react'
import { VAT_RATE_OPTIONS } from './helpers'
import { SHOP_ACCENT, type ShopProduct, type VatRate } from './types'

interface ProductFormModalProps {
  product: ShopProduct | null
  onSave: (payload: Partial<ShopProduct>) => Promise<void>
  onCancel: () => void
}

export function ProductFormModal({ product, onSave, onCancel }: ProductFormModalProps) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [unitPrice, setUnitPrice] = useState(String(product?.unitPrice ?? 0))
  const [vatRate, setVatRate] = useState<VatRate>(product?.vatRate ?? '6')
  const [stockQuantity, setStockQuantity] = useState(String(product?.stockQuantity ?? 0))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom est requis.')
      return
    }
    const price = parseFloat(unitPrice.replace(',', '.')) || 0
    const qty = parseInt(stockQuantity, 10) || 0
    if (price < 0 || qty < 0) {
      setError('Les valeurs ne peuvent pas être négatives.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        sku: sku.trim() || null,
        unitPrice: price,
        vatRate,
        stockQuantity: qty,
      } as Partial<ShopProduct>)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: SHOP_ACCENT }}>
              Comptoir
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-900 tracking-tight inline-flex items-center gap-2">
              <Package className="w-5 h-5 text-stone-400" />
              {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <Field label="Nom" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Ex. Livre permaculture"
              autoFocus
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Quelques mots pour référence interne"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix TTC">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className={`${inputCls} pr-8 font-mono`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
              </div>
            </Field>
            <Field label="TVA">
              <select value={vatRate} onChange={(e) => setVatRate(e.target.value as VatRate)} className={inputCls}>
                {VAT_RATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock initial">
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className={`${inputCls} font-mono`}
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-[10px] text-stone-400 mt-1">
                  Utilisez « Ajuster le stock » pour modifier cette valeur.
                </p>
              )}
            </Field>
            <Field label="Référence (SKU)">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="optionnel"
              />
            </Field>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: SHOP_ACCENT }}
            >
              {busy ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-300/50 transition-all'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
