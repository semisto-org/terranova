import { X, Edit, ExternalLink } from 'lucide-react'
import type { RevenueItem } from './RevenueList'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  received: 'Reçu',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  confirmed: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
}

const POLE_LABELS: Record<string, string> = {
  academy: 'Academy',
  design_studio: 'Design Studio',
  nursery: 'Nursery',
  roots: 'Roots',
}

const POLE_COLORS: Record<string, string> = {
  academy: '#B01A19',
  design_studio: '#AFBD00',
  nursery: '#EF9B0D',
  roots: '#5B5781',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transfer: 'Virement',
  card: 'Carte',
  cash: 'Cash',
  stripe: 'Stripe',
  other: 'Autre',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

interface RevenueDetailModalProps {
  revenue: RevenueItem
  onClose: () => void
  onEdit: () => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-stone-900">{value || '—'}</dd>
    </div>
  )
}

export function RevenueDetailModal({ revenue, onClose, onEdit }: RevenueDetailModalProps) {
  const totalVat = revenue.vat6 + revenue.vat21
  const totalTtc = revenue.amountExclVat + totalVat

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Détail de la recette</h2>
            {revenue.contactName && (
              <p className="text-sm text-stone-500">{revenue.contactName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[revenue.status] ?? 'bg-stone-100 text-stone-700'}`}>
              {STATUS_LABELS[revenue.status] ?? revenue.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Dates & Info */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" value={formatDate(revenue.date)} />
            <Field label="Date de paiement" value={formatDate(revenue.paidAt)} />
            <Field label="Client" value={revenue.contactName} />
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wider">Pôle</dt>
              <dd className="mt-1">
                {revenue.pole ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: POLE_COLORS[revenue.pole] || '#a8a29e' }} />
                    <span className="text-sm text-stone-900">{POLE_LABELS[revenue.pole] ?? revenue.pole}</span>
                  </span>
                ) : (
                  <span className="text-sm text-stone-900">—</span>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <Field label="Description" value={revenue.description} />
            </div>
            <Field label="Label" value={revenue.label} />
            <Field label="Catégorie" value={revenue.category} />
            <Field label="Type de recette" value={revenue.revenueType} />
            <Field label="Méthode de paiement" value={revenue.paymentMethod ? (PAYMENT_METHOD_LABELS[revenue.paymentMethod] ?? revenue.paymentMethod) : null} />
          </div>

          {/* Amounts */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Montants</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-stone-50 border border-stone-200">
              <div>
                <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">HTVA</dt>
                <dd className="mt-1 text-sm font-medium text-stone-900">{formatCurrency(revenue.amountExclVat)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">TVA 6%</dt>
                <dd className="mt-1 text-sm font-medium text-stone-900">{revenue.vat6 ? formatCurrency(revenue.vat6) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">TVA 21%</dt>
                <dd className="mt-1 text-sm font-medium text-stone-900">{revenue.vat21 ? formatCurrency(revenue.vat21) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-stone-500 uppercase tracking-wide">TTC</dt>
                <dd className="mt-1 text-sm font-bold text-[#5B5781]">{formatCurrency(totalTtc)}</dd>
              </div>
            </div>
          </div>

          {/* Extra info */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Taux TVA" value={revenue.vatRate || null} />
            <Field label="Montant total" value={formatCurrency(revenue.amount)} />
            {revenue.vatExemption && (
              <div className="col-span-2">
                <Field label="Exemption TVA" value={revenue.vatExemption} />
              </div>
            )}
          </div>

          {/* Invoice */}
          {revenue.invoiceUrl && (
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wider">Facture</dt>
              <dd className="mt-1">
                <a
                  href={revenue.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#5B5781] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir la facture
                </a>
              </dd>
            </div>
          )}

          {/* Notes */}
          {revenue.notes && (
            <div>
              <dt className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Notes</dt>
              <dd className="text-sm text-stone-700 whitespace-pre-wrap p-3 rounded-lg bg-stone-50 border border-stone-200">
                {revenue.notes}
              </dd>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  )
}
