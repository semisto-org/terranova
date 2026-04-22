export const fmtMoney = (v: number) =>
  `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

export const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR')
}

export const movementKind = (providerRef: string | null | undefined): 'sale' | 'expense' | 'transfer' | 'manual' => {
  if (!providerRef) return 'manual'
  if (providerRef.startsWith('cash_shop_sale_')) return 'sale'
  if (providerRef.startsWith('cash_expense_')) return 'expense'
  if (providerRef.startsWith('cash_transfer_')) return 'transfer'
  return 'manual'
}

export const movementLabel = (kind: ReturnType<typeof movementKind>) => {
  switch (kind) {
    case 'sale': return 'Vente comptoir'
    case 'expense': return 'Dépense cash'
    case 'transfer': return 'Apport de caisse'
    default: return 'Mouvement'
  }
}
