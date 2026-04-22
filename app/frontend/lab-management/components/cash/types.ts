export const CASH_ACCENT = '#6B4423' // acajou ciré
export const CASH_SUPPORT = '#D4A574' // laiton brossé

export interface CashAccount {
  id: string
  organizationId: string
  organizationName: string | null
  balance: number
  vatRegime: 'subject' | 'exempt'
}

export interface CashMovement {
  id: string
  connectionId: string
  date: string
  amount: number
  counterpartName: string | null
  remittanceInfo: string | null
  internalReference: string | null
  status: 'unmatched' | 'matched' | 'partially_matched' | 'ignored'
  reconciliations: {
    id: string
    type: 'Expense' | 'Revenue'
    recordId: string
    label: string | null
    amount: number
    confidence: string
    notes: string | null
  }[]
}

export interface CashOrganization {
  id: string
  name: string
  vatSubject: boolean
  isDefault: boolean
}
