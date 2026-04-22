import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { PAYMENT_METHOD_OPTIONS, VAT_RATE_OPTIONS, fmtMoney } from './helpers'
import {
  SHOP_ACCENT,
  type ShopContactOption,
  type ShopOrganization,
  type ShopProduct,
  type ShopSale,
  type VatRate,
} from './types'

interface SaleFormModalProps {
  sale: ShopSale | null
  products: ShopProduct[]
  organizations: ShopOrganization[]
  contacts: ShopContactOption[]
  onSave: (payload: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

interface DraftItem {
  productId: string
  quantity: number
  unitPrice: number
  vatRate: VatRate
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function SaleFormModal({ sale, products, organizations, contacts, onSave, onCancel }: SaleFormModalProps) {
  const isEdit = !!sale
  const defaultOrg = organizations.find((o) => o.isDefault)?.id || organizations[0]?.id || ''

  const [soldAt, setSoldAt] = useState(sale?.soldAt ? sale.soldAt.slice(0, 10) : todayIso())
  const [organizationId, setOrganizationId] = useState(sale?.organizationId || defaultOrg)
  const [contactId, setContactId] = useState(sale?.contactId || '')
  const [customerLabel, setCustomerLabel] = useState(sale?.customerLabel || '')
  const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod || 'cash')
  const [notes, setNotes] = useState(sale?.notes || '')
  const [items, setItems] = useState<DraftItem[]>(() => {
    if (sale) {
      return sale.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
      }))
    }
    return []
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const productMap = useMemo(() => {
    const m = new Map<string, ShopProduct>()
    products.forEach((p) => m.set(p.id, p))
    return m
  }, [products])

  const selectedOrg = organizations.find((o) => o.id === organizationId)

  const addItem = () => {
    const firstAvailable = products.find((p) => p.stockQuantity > 0) || products[0]
    if (!firstAvailable) return
    setItems((prev) => [
      ...prev,
      {
        productId: firstAvailable.id,
        quantity: 1,
        unitPrice: firstAvailable.unitPrice,
        vatRate: firstAvailable.vatRate,
      },
    ])
  }

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it
        const merged = { ...it, ...patch }
        // When product changes, snap unit_price + vat_rate from product defaults
        if (patch.productId && patch.productId !== it.productId) {
          const p = productMap.get(patch.productId)
          if (p) {
            merged.unitPrice = p.unitPrice
            merged.vatRate = p.vatRate
          }
        }
        return merged
      }),
    )
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  // Stock warnings: for each product, compare requested quantity to current stock
  const stockWarnings = useMemo(() => {
    const warnings: Record<string, string> = {}
    items.forEach((item) => {
      const product = productMap.get(item.productId)
      if (!product) return
      // When editing a sale, the already-reserved qty was deducted — allow up to current+original
      const originalQty = sale?.items.find((i) => i.productId === item.productId)?.quantity || 0
      const effectiveStock = product.stockQuantity + (isEdit ? originalQty : 0)
      if (item.quantity > effectiveStock) {
        warnings[item.productId] = `Stock insuffisant : ${effectiveStock} disponible${effectiveStock > 1 ? 's' : ''}`
      }
    })
    return warnings
  }, [items, productMap, sale, isEdit])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      setError('Ajoutez au moins un produit.')
      return
    }
    if (Object.keys(stockWarnings).length > 0) {
      setError('Corrigez les alertes de stock avant de valider.')
      return
    }
    if (!organizationId) {
      setError('Sélectionnez une structure.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        sold_at: soldAt,
        organization_id: organizationId,
        contact_id: contactId || null,
        customer_label: customerLabel.trim(),
        payment_method: paymentMethod,
        notes: notes.trim(),
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          vat_rate: i.vatRate,
        })),
      })
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between gap-4 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: SHOP_ACCENT }}>
              Comptoir
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-900 tracking-tight inline-flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-400" />
              {isEdit ? 'Modifier la vente' : 'Nouvelle vente'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </header>

        <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Meta */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date" required>
                <input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Moyen de paiement" required>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className={inputCls}
                >
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Structure" required>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className={inputCls}
                  required
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {!o.vatSubject ? ' · franchise TVA' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Client (contact)" hint="Optionnel">
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Aucun contact (walk-in) —</option>
                  {contacts.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </section>

            {!contactId && (
              <Field label="Libellé acheteur" hint="Libre, pour traçabilité (ex. nom sur ticket)">
                <input
                  type="text"
                  value={customerLabel}
                  onChange={(e) => setCustomerLabel(e.target.value)}
                  className={inputCls}
                  placeholder="Ex. Marie, ou laissez vide"
                />
              </Field>
            )}

            {/* Items */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-stone-700">Panier</h3>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={products.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter un produit
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-sm text-stone-500">
                  Aucun produit dans le catalogue. Créez un produit d'abord.
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-sm text-stone-500">
                  Aucun produit ajouté au panier.
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    const product = productMap.get(item.productId)
                    const warning = stockWarnings[item.productId]
                    return (
                      <li
                        key={index}
                        className={`bg-white rounded-xl border p-3 ${warning ? 'border-amber-300 bg-amber-50/50' : 'border-stone-200'}`}
                      >
                        <div className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-12 sm:col-span-5">
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(index, { productId: e.target.value })}
                              className={inputCls}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} {p.stockQuantity === 0 ? '· rupture' : `· ${p.stockQuantity} en stock`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                              className={`${inputCls} text-center font-mono`}
                              aria-label="Quantité"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                                className={`${inputCls} pr-6 font-mono text-right`}
                                aria-label="Prix unitaire"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-400">€</span>
                            </div>
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <select
                              value={item.vatRate}
                              onChange={(e) => updateItem(index, { vatRate: e.target.value as VatRate })}
                              className={inputCls}
                              aria-label="TVA"
                            >
                              {VAT_RATE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                              aria-label="Retirer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          {warning ? (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <AlertTriangle className="w-3 h-3" />
                              {warning}
                            </span>
                          ) : (
                            <span className="text-stone-400">
                              {product?.name || 'Produit supprimé'}
                            </span>
                          )}
                          <span className="font-mono font-semibold text-stone-700">
                            {fmtMoney(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputCls} resize-none`}
                rows={2}
                placeholder="Optionnel"
              />
            </Field>
          </div>

          <footer className="shrink-0 border-t border-stone-100 bg-stone-50/60 px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Total</div>
              <div className="text-2xl font-mono font-bold text-stone-900">{fmtMoney(total)}</div>
              {selectedOrg && !selectedOrg.vatSubject && (
                <div className="text-[10px] text-amber-700 mt-0.5">Structure en franchise TVA</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                  {error}
                </span>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || items.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: SHOP_ACCENT }}
              >
                {busy ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Valider la vente'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-300/50 transition-all'

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[10px] text-stone-400">{hint}</span>}
      </span>
      {children}
    </label>
  )
}
