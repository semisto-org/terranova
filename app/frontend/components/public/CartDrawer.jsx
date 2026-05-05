import { useEffect, useMemo, useState } from 'react'
import { X, Minus, Plus, Trash2, MapPin, Check, AlertTriangle } from 'lucide-react'
import { apiRequest } from '@/lib/api'

/**
 * CartDrawer — herbier-styled cart + checkout for the public catalogue.
 * View states: 'cart' → 'checkout' → 'success' | 'error'.
 */
export function CartDrawer({ items, totalEuros, count, setQuantity, removeItem, clear, onClose }) {
  const [view, setView] = useState('cart')
  const [pickupPoints, setPickupPoints] = useState([])
  const [pickupLoading, setPickupLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', pickupId: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Load pickup points when entering checkout
  useEffect(() => {
    if (view !== 'checkout' || pickupPoints.length > 0) return
    setPickupLoading(true)
    apiRequest('/api/v1/nursery/public-pickup-points')
      .then((res) => setPickupPoints(res || []))
      .catch(() => setPickupPoints([]))
      .finally(() => setPickupLoading(false))
  }, [view, pickupPoints.length])

  // Group items per nursery for clarity
  const groups = useMemo(() => {
    const map = new Map()
    for (const it of items) {
      const key = it.batch?.nurseryId || 'unknown'
      if (!map.has(key)) map.set(key, { nurseryId: key, nurseryName: it.batch?.nurseryName || '—', items: [] })
      map.get(key).items.push(it)
    }
    return Array.from(map.values())
  }, [items])

  const submit = async (e) => {
    e?.preventDefault?.()
    if (submitting) return
    setSubmitting(true); setErrorMsg(null)
    try {
      const payload = {
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        pickup_nursery_id: form.pickupId,
        notes: form.notes.trim(),
        lines: items.map((it) => ({ stock_batch_id: it.stockBatchId, quantity: it.quantity })),
      }
      const res = await apiRequest('/api/v1/nursery/public-orders', {
        method: 'POST', body: JSON.stringify(payload),
      })
      setConfirmation(res)
      setView('success')
      clear()
    } catch (err) {
      setErrorMsg(err?.message || 'Une erreur est survenue.')
      setView('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button onClick={onClose} aria-label="Fermer le panier" className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
      <aside
        role="dialog"
        aria-modal="true"
        className="relative h-full w-full max-w-[520px] overflow-y-auto bg-[#fbf6ec] shadow-2xl"
        style={{ animation: 'slideIn 280ms cubic-bezier(0.2, 0.7, 0.2, 1)' }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        <button onClick={onClose} aria-label="Fermer" className="absolute right-5 top-5 z-10 rounded-full bg-white/80 p-2 text-stone-700 shadow-sm hover:bg-white">
          <X className="h-4 w-4" />
        </button>

        {view === 'cart' && (
          <CartView
            groups={groups}
            count={count}
            totalEuros={totalEuros}
            setQuantity={setQuantity}
            removeItem={removeItem}
            onCheckout={() => setView('checkout')}
          />
        )}
        {view === 'checkout' && (
          <CheckoutView
            items={items}
            totalEuros={totalEuros}
            pickupPoints={pickupPoints}
            pickupLoading={pickupLoading}
            form={form}
            setForm={setForm}
            submitting={submitting}
            onBack={() => setView('cart')}
            onSubmit={submit}
          />
        )}
        {view === 'success' && confirmation && (
          <SuccessView confirmation={confirmation} onClose={onClose} />
        )}
        {view === 'error' && (
          <ErrorView errorMsg={errorMsg} onRetry={() => setView('checkout')} />
        )}
      </aside>
    </div>
  )
}

function CartView({ groups, count, totalEuros, setQuantity, removeItem, onCheckout }) {
  return (
    <div>
      <div className="border-b border-[#2f4a3a]/15 bg-white px-7 pb-7 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#EF9B0D]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Panier · {count} {count > 1 ? 'plants' : 'plant'}
        </p>
        <h2 className="mt-2 font-serif text-4xl italic leading-tight text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
          Votre récolte
        </h2>
      </div>

      <div className="px-7 py-6">
        {groups.length === 0 ? (
          <p className="py-12 text-center font-serif text-xl italic text-stone-500" style={{ fontFamily: 'Sole Serif Small, serif' }}>
            Le panier est vide.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.nurseryId}>
                <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <MapPin className="h-3 w-3" /> {g.nurseryName}
                </p>
                <ul className="space-y-2">
                  {g.items.map((it) => (
                    <li key={it.stockBatchId} className="rounded-lg border border-[#2f4a3a]/15 bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-base italic text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
                            {it.batch?.speciesName}
                            {it.batch?.varietyName && <span className="ml-1 text-stone-500">· {it.batch.varietyName}</span>}
                          </p>
                          <p className="mt-0.5 text-xs uppercase tracking-wider text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {it.batch?.containerName || '—'} · {(it.batch?.priceEuros || 0).toFixed(2)} €/pc
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(it.stockBatchId)}
                          aria-label="Retirer"
                          className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-[#2f4a3a]/20 bg-white">
                          <button
                            onClick={() => setQuantity(it.stockBatchId, it.quantity - 1)}
                            aria-label="Diminuer"
                            className="rounded-l-full px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] px-2 text-center text-sm font-semibold tabular-nums text-stone-900">{it.quantity}</span>
                          <button
                            onClick={() => setQuantity(it.stockBatchId, it.quantity + 1)}
                            aria-label="Augmenter"
                            className="rounded-r-full px-3 py-1.5 text-stone-700 hover:bg-stone-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-[#1d2e23]">
                          {(it.quantity * (it.batch?.priceEuros || 0)).toFixed(2)} €
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {groups.length > 0 && (
        <div className="sticky bottom-0 border-t border-[#2f4a3a]/15 bg-[#fbf6ec]/95 px-7 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Total</span>
            <span className="font-serif text-2xl text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>{totalEuros.toFixed(2)} €</span>
          </div>
          <button
            onClick={onCheckout}
            className="mt-4 w-full rounded-full bg-[#2f4a3a] py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#fbf6ec] transition hover:bg-[#1d2e23]"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Passer commande
          </button>
        </div>
      )}
    </div>
  )
}

function CheckoutView({ items, totalEuros, pickupPoints, pickupLoading, form, setForm, submitting, onBack, onSubmit }) {
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const canSubmit = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.pickupId && items.length > 0 && !submitting

  return (
    <form onSubmit={onSubmit}>
      <div className="border-b border-[#2f4a3a]/15 bg-white px-7 pb-7 pt-12">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#EF9B0D]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Validation
        </p>
        <h2 className="mt-2 font-serif text-4xl italic leading-tight text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
          Vos coordonnées
        </h2>
        <p className="mt-3 text-sm text-stone-600">La pépinière vous recontacte par email pour confirmer la disponibilité et organiser le retrait.</p>
      </div>

      <div className="space-y-4 px-7 py-6">
        <Field label="Nom et prénom" required>
          <input type="text" value={form.name} onChange={update('name')} required maxLength={200} autoComplete="name"
            className="w-full rounded-lg border border-[#2f4a3a]/20 bg-white px-3 py-2 text-stone-900 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30" />
        </Field>
        <Field label="Email" required>
          <input type="email" value={form.email} onChange={update('email')} required autoComplete="email"
            className="w-full rounded-lg border border-[#2f4a3a]/20 bg-white px-3 py-2 text-stone-900 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30" />
        </Field>
        <Field label="Téléphone (optionnel)">
          <input type="tel" value={form.phone} onChange={update('phone')} autoComplete="tel"
            className="w-full rounded-lg border border-[#2f4a3a]/20 bg-white px-3 py-2 text-stone-900 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30" />
        </Field>
        <Field label="Point de retrait" required>
          {pickupLoading ? (
            <p className="text-sm text-stone-500">Chargement…</p>
          ) : pickupPoints.length === 0 ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Aucun point de retrait actif. Contactez-nous directement.</p>
          ) : (
            <select value={form.pickupId} onChange={update('pickupId')} required
              className="w-full rounded-lg border border-[#2f4a3a]/20 bg-white px-3 py-2 text-stone-900 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30">
              <option value="">— Choisir —</option>
              {pickupPoints.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.city ? ` · ${p.city}` : ''}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Notes (optionnel)">
          <textarea value={form.notes} onChange={update('notes')} rows={3} maxLength={1000}
            placeholder="Préférences de retrait, questions sur les variétés…"
            className="w-full rounded-lg border border-[#2f4a3a]/20 bg-white px-3 py-2 text-stone-900 focus:border-[#EF9B0D] focus:outline-none focus:ring-2 focus:ring-[#EF9B0D]/30" />
        </Field>

        <div className="rounded-lg border border-dashed border-[#2f4a3a]/25 bg-white/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Récapitulatif</p>
          <p className="mt-1 text-sm text-stone-700">{items.length} {items.length > 1 ? 'lignes' : 'ligne'} · Total : <span className="font-semibold text-[#1d2e23]">{totalEuros.toFixed(2)} €</span></p>
          <p className="mt-1 text-xs italic text-stone-500">Paiement sur place au retrait.</p>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-[#2f4a3a]/15 bg-[#fbf6ec]/95 px-7 py-5 backdrop-blur">
        <button type="button" onClick={onBack} disabled={submitting}
          className="flex-1 rounded-full border border-[#2f4a3a]/30 bg-white py-3 text-sm font-semibold uppercase tracking-[0.18em] text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Retour
        </button>
        <button type="submit" disabled={!canSubmit}
          className="flex-1 rounded-full bg-[#EF9B0D] py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#d68a0a] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {submitting ? 'Envoi…' : 'Confirmer'}
        </button>
      </div>
    </form>
  )
}

function SuccessView({ confirmation, onClose }) {
  return (
    <div className="px-7 pb-12 pt-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-serif text-3xl italic text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
        Commande envoyée
      </h2>
      <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-stone-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        N° {confirmation.orderNumber}
      </p>
      <div className="mx-auto mt-6 max-w-sm space-y-3 text-sm text-stone-700">
        <p>Merci ! Nous avons envoyé une copie à <span className="font-semibold">{confirmation.customerEmail}</span>.</p>
        <p>Retrait prévu chez <span className="font-semibold">{confirmation.pickupNurseryName}</span>. La pépinière vous recontacte pour confirmer.</p>
        <p className="text-stone-600">Total à régler au retrait : <span className="font-semibold text-[#1d2e23]">{confirmation.totalEuros.toFixed(2)} €</span></p>
      </div>
      <button onClick={onClose}
        className="mt-8 rounded-full bg-[#2f4a3a] px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#fbf6ec] hover:bg-[#1d2e23]"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        Continuer la visite
      </button>
    </div>
  )
}

function ErrorView({ errorMsg, onRetry }) {
  return (
    <div className="px-7 pb-12 pt-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-700">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="mt-6 font-serif text-3xl italic text-[#1d2e23]" style={{ fontFamily: 'Sole Serif Small, serif' }}>
        Envoi impossible
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm text-stone-700">{errorMsg}</p>
      <button onClick={onRetry}
        className="mt-8 rounded-full bg-[#EF9B0D] px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#d68a0a]"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        Réessayer
      </button>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {label}{required && <span className="text-[#EF9B0D]"> *</span>}
      </span>
      {children}
    </label>
  )
}
