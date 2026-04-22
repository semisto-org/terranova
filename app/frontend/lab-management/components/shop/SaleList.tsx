import { useMemo, useState } from 'react'
import { Banknote, Coins, CreditCard, Edit, Link as LinkIcon, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { fmtDate, fmtMoney, paymentLabel } from './helpers'
import { SHOP_ACCENT, type ShopSale } from './types'

interface SaleListProps {
  sales: ShopSale[]
  onCreateSale: () => void
  onEditSale: (sale: ShopSale) => void
  onDeleteSale: (sale: ShopSale) => void
}

const paymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return Coins
    case 'transfer':
      return Banknote
    case 'card':
    case 'stripe':
      return CreditCard
    default:
      return Banknote
  }
}

export function SaleList({ sales, onCreateSale, onEditSale, onDeleteSale }: SaleListProps) {
  const [search, setSearch] = useState('')

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sales
    return sales.filter((s) => {
      const haystack = [
        s.customerLabel,
        s.contactName,
        s.notes,
        ...s.items.map((i) => i.productName || ''),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [sales, search])

  const total = useMemo(() => filteredSales.reduce((sum, s) => sum + s.totalAmount, 0), [filteredSales])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-stone-700 inline-flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-stone-400" />
          Historique des ventes
          {search && (
            <span className="text-xs text-stone-400 font-normal">
              ({filteredSales.length} · {fmtMoney(total)})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white w-44"
            />
          </div>
          <button
            onClick={onCreateSale}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: SHOP_ACCENT }}
          >
            <Plus className="w-4 h-4" />
            Nouvelle vente
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-stone-200">
          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="mt-2 text-stone-500 font-medium">
            {search ? 'Aucune vente correspondant à la recherche' : 'Aucune vente enregistrée'}
          </p>
          {!search && (
            <p className="text-xs text-stone-400 mt-0.5">
              Cliquez sur <strong>Nouvelle vente</strong> pour enregistrer votre première vente.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50/60 border-b border-stone-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Produits</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Paiement</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Total</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSales.map((sale) => {
                const PaymentIcon = paymentIcon(sale.paymentMethod)
                const products = sale.items
                  .map((i) => `${i.quantity}× ${i.productName || '?'}`)
                  .join(', ')
                return (
                  <tr key={sale.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmtDate(sale.soldAt)}</td>
                    <td className="px-4 py-3 text-stone-700 truncate max-w-[180px]">
                      {sale.contactName || sale.customerLabel || <span className="text-stone-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-stone-500 truncate max-w-[280px]" title={products}>
                      {products}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-stone-600 bg-stone-100 rounded-full">
                        <PaymentIcon className="w-3 h-3" />
                        {paymentLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-stone-900 whitespace-nowrap">
                      {fmtMoney(sale.totalAmount)}
                      {sale.revenueId && (
                        <div className="text-[10px] text-emerald-600 font-normal mt-0.5 inline-flex items-center gap-0.5">
                          <LinkIcon className="w-2.5 h-2.5" />
                          recette #{sale.revenueId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditSale(sale)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSale(sale)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
