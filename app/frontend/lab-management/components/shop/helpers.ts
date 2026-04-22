import type { VatRate } from './types'

export const fmtMoney = (v: number) =>
  `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR')
}

export const VAT_RATE_OPTIONS: { value: VatRate; label: string }[] = [
  { value: '6', label: '6 %' },
  { value: '21', label: '21 %' },
  { value: '12', label: '12 %' },
  { value: '0', label: '0 %' },
  { value: 'exempt', label: 'Exempté' },
]

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash (comptoir)' },
  { value: 'transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Autre' },
]

export const paymentLabel = (code: string) =>
  PAYMENT_METHOD_OPTIONS.find((o) => o.value === code)?.label || code
