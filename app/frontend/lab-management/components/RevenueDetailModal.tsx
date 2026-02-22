import { X, Edit, ExternalLink } from 'lucide-react'
import type { RevenueItem } from './RevenueList'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  received: 'Reçu',
}

const POLE_LABELS: Record<string, string> = {
  academy: 'Academy',
  design_studio: 'Design Studio',
  nursery: 'Nursery',
  roots: 'Roots',
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold text-stone-900">Détail de la recette</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <Field label="Date" value={formatDate(revenue.date)} />
          <Field label="Statut" value={STATUS_LABELS[revenue.status] ?? revenue.status} />
          <Field label="Client" value={revenue.contactName} />
          <Field label="Pôle" value={revenue.pole ? (POLE_LABELS[revenue.pole] ?? revenue.pole) : null} />
          <div className="col-span-2">
            <Field label="Description" value={revenue.description} />
          </div>
          <Field label="Label" value={revenue.label} />
          <Field label="Catégorie" value={revenue.category} />
          <Field label="Type de recette" value={revenue.revenueType} />
          <Field label="Méthode de paiement" value={revenue.paymentMethod} />
          <Field label="Montant HTVA" value={formatCurrency(revenue.amountExclVat)} />
          <Field label="Taux TVA" value={revenue.vatRate || '—'} />
          <Field label="TVA 6%" value={formatCurrency(revenue.vat6)} />
          <Field label="TVA 21%" value={formatCurrency(revenue.vat21)} />
          <Field label="Total TTC" value={<span className="font-semibold">{formatCurrency(totalTtc)}</span>} />
          <Field label="Montant total" value={formatCurrency(revenue.amount)} />
          <Field label="Date de paiement" value={formatDate(revenue.paidAt)} />
          <Field label="Exemption TVA" value={revenue.vatExemption} />
          {revenue.invoiceUrl && (
            <div className="col-span-2">
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
          {revenue.notes && (
            <div className="col-span-2">
              <Field label="Notes" value={revenue.notes} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5B5781] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
