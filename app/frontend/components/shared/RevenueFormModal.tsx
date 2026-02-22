import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { RevenueItem } from '../../lab-management/components/RevenueList'

const inputBase =
  'w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781]'
const selectBase =
  'w-full pl-4 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#5B5781]/30 focus:border-[#5B5781] cursor-pointer appearance-none bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat'
const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23787573' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'received', label: 'Reçu' },
]

const POLE_OPTIONS = [
  { value: '', label: '— Aucun —' },
  { value: 'academy', label: 'Academy' },
  { value: 'design_studio', label: 'Design Studio' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'roots', label: 'Roots' },
]

const VAT_RATE_OPTIONS = [
  { value: '', label: '— Aucun —' },
  { value: '0', label: '0%' },
  { value: '6', label: '6%' },
  { value: '21', label: '21%' },
  { value: 'exempt', label: 'Exempté' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: '— Aucun —' },
  { value: 'transfer', label: 'Virement' },
  { value: 'card', label: 'Carte' },
  { value: 'cash', label: 'Cash' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Autre' },
]

interface RevenueFormModalProps {
  revenue: RevenueItem | null
  contacts?: { value: string; label: string }[]
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  busy?: boolean
}

export function RevenueFormModal({ revenue, contacts = [], onSave, onCancel, busy = false }: RevenueFormModalProps) {
  const isEdit = !!revenue

  const [form, setForm] = useState({
    description: '',
    label: '',
    date: '',
    status: 'draft',
    pole: '',
    contact_id: '',
    revenue_type: '',
    category: '',
    amount: '0',
    amount_excl_vat: '0',
    vat_rate: '',
    vat_6: '0',
    vat_21: '0',
    vat_exemption: '',
    payment_method: '',
    invoice_url: '',
    paid_at: '',
    notes: '',
    training_id: '',
    design_project_id: '',
  })

  useEffect(() => {
    if (revenue) {
      setForm({
        description: revenue.description || '',
        label: revenue.label || '',
        date: revenue.date ? revenue.date.slice(0, 10) : '',
        status: revenue.status || 'draft',
        pole: revenue.pole || '',
        contact_id: revenue.contactId || '',
        revenue_type: revenue.revenueType || '',
        category: revenue.category || '',
        amount: String(revenue.amount || 0),
        amount_excl_vat: String(revenue.amountExclVat || 0),
        vat_rate: revenue.vatRate || '',
        vat_6: String(revenue.vat6 || 0),
        vat_21: String(revenue.vat21 || 0),
        vat_exemption: revenue.vatExemption || '',
        payment_method: revenue.paymentMethod || '',
        invoice_url: revenue.invoiceUrl || '',
        paid_at: revenue.paidAt ? revenue.paidAt.slice(0, 10) : '',
        notes: revenue.notes || '',
        training_id: revenue.trainingId || '',
        design_project_id: revenue.designProjectId || '',
      })
    }
  }, [revenue])

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, unknown> = { ...form }
    // Convert numeric fields
    data.amount = parseFloat(form.amount) || 0
    data.amount_excl_vat = parseFloat(form.amount_excl_vat) || 0
    data.vat_6 = parseFloat(form.vat_6) || 0
    data.vat_21 = parseFloat(form.vat_21) || 0
    // Remove empty strings for optional fields
    if (!data.contact_id) delete data.contact_id
    if (!data.training_id) delete data.training_id
    if (!data.design_project_id) delete data.design_project_id
    if (!data.paid_at) delete data.paid_at
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">
            {isEdit ? 'Modifier la recette' : 'Nouvelle recette'}
          </h2>
          <button onClick={onCancel} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Statut *</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className={selectBase} style={selectChevronStyle}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => update('description', e.target.value)} className={inputBase} placeholder="Description de la recette" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Label</label>
              <input type="text" value={form.label} onChange={(e) => update('label', e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Catégorie</label>
              <input type="text" value={form.category} onChange={(e) => update('category', e.target.value)} className={inputBase} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Pôle</label>
              <select value={form.pole} onChange={(e) => update('pole', e.target.value)} className={selectBase} style={selectChevronStyle}>
                {POLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Type de recette</label>
              <input type="text" value={form.revenue_type} onChange={(e) => update('revenue_type', e.target.value)} className={inputBase} />
            </div>
          </div>

          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Client (contact)</label>
              <select value={form.contact_id} onChange={(e) => update('contact_id', e.target.value)} className={selectBase} style={selectChevronStyle}>
                <option value="">— Aucun —</option>
                {contacts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Montant total</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => update('amount', e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Montant HTVA</label>
              <input type="number" step="0.01" value={form.amount_excl_vat} onChange={(e) => update('amount_excl_vat', e.target.value)} className={inputBase} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Taux TVA</label>
              <select value={form.vat_rate} onChange={(e) => update('vat_rate', e.target.value)} className={selectBase} style={selectChevronStyle}>
                {VAT_RATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">TVA 6%</label>
              <input type="number" step="0.01" value={form.vat_6} onChange={(e) => update('vat_6', e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">TVA 21%</label>
              <input type="number" step="0.01" value={form.vat_21} onChange={(e) => update('vat_21', e.target.value)} className={inputBase} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Méthode de paiement</label>
              <select value={form.payment_method} onChange={(e) => update('payment_method', e.target.value)} className={selectBase} style={selectChevronStyle}>
                {PAYMENT_METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Date de paiement</label>
              <input type="date" value={form.paid_at} onChange={(e) => update('paid_at', e.target.value)} className={inputBase} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Exemption TVA</label>
            <input type="text" value={form.vat_exemption} onChange={(e) => update('vat_exemption', e.target.value)} className={inputBase} placeholder="Ex: Art. 44 §2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">URL Facture</label>
            <input type="url" value={form.invoice_url} onChange={(e) => update('invoice_url', e.target.value)} className={inputBase} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className={inputBase} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
              Annuler
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {busy ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
