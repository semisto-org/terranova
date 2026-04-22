export const SHOP_ACCENT = '#C48955' // cuivre chaud comptoir

export type VatRate = '0' | '6' | '12' | '21' | 'exempt'

export type StockKind = 'owned' | 'consignment'

export interface ShopProduct {
  id: string
  name: string
  description: string
  sku: string | null
  unitPrice: number
  vatRate: VatRate
  stockQuantity: number
  stockKind: StockKind
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ShopSaleItem {
  id: string
  productId: string
  productName: string | null
  quantity: number
  unitPrice: number
  vatRate: VatRate
  subtotal: number
}

export interface ShopSale {
  id: string
  soldAt: string
  organizationId: string
  organizationName: string | null
  contactId: string | null
  contactName: string | null
  customerLabel: string
  paymentMethod: 'cash' | 'transfer' | 'card' | 'stripe' | 'other'
  notes: string
  totalAmount: number
  revenueId: string | null
  items: ShopSaleItem[]
  createdAt: string
  updatedAt: string
}

export interface ShopOrganization {
  id: string
  name: string
  vatSubject: boolean
  isDefault: boolean
}

export interface ShopContactOption {
  value: string
  label: string
}
