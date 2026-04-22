import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Banknote, Receipt, Search, ShoppingBag, Wallet } from 'lucide-react'
import { fmtDate, fmtMoney, movementKind, movementLabel } from './helpers'
import { CASH_ACCENT, type CashMovement } from './types'

interface CashMovementListProps {
  movements: CashMovement[]
}

const kindIcon = (kind: ReturnType<typeof movementKind>) => {
  switch (kind) {
    case 'sale': return ShoppingBag
    case 'expense': return Receipt
    case 'transfer': return Banknote
    default: return Wallet
  }
}

export function CashMovementList({ movements }: CashMovementListProps) {
  const [filter, setFilter] = useState<'all' | 'sale' | 'expense' | 'transfer'>('all')
  const [search, setSearch] = useState('')

  const visibleMovements = useMemo(() => {
    const q = search.trim().toLowerCase()
    return movements.filter((m) => {
      const kind = movementKind(m.internalReference)
      if (filter !== 'all' && kind !== filter) return false
      if (!q) return true
      return [m.counterpartName, m.remittanceInfo].some((v) => v?.toLowerCase().includes(q))
    })
  }, [movements, filter, search])

  const subtotal = useMemo(
    () => visibleMovements.reduce((sum, m) => sum + Number(m.amount), 0),
    [visibleMovements],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-stone-100/70 rounded-lg p-1">
          {([
            { id: 'all', label: 'Tous' },
            { id: 'sale', label: 'Ventes' },
            { id: 'expense', label: 'Dépenses' },
            { id: 'transfer', label: 'Apports' },
          ] as const).map((opt) => {
            const active = filter === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
                }`}
                style={active ? { color: CASH_ACCENT } : undefined}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
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
      </div>

      {visibleMovements.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-dashed border-stone-200">
          <Wallet className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="mt-2 text-stone-500 font-medium">Aucun mouvement</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Les ventes cash shop et dépenses cash apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {/* Book-style ledger header */}
          <div
            className="px-5 py-3 border-b flex items-center justify-between text-[10px] uppercase tracking-[0.14em] font-semibold"
            style={{ backgroundColor: `${CASH_ACCENT}08`, color: CASH_ACCENT, borderColor: `${CASH_ACCENT}15` }}
          >
            <span>Grand livre · {visibleMovements.length} mouvement{visibleMovements.length > 1 ? 's' : ''}</span>
            <span className="font-mono normal-case tracking-normal">
              Sous-total : {fmtMoney(subtotal)}
            </span>
          </div>
          <ul className="divide-y divide-stone-100">
            {visibleMovements.map((m) => {
              const kind = movementKind(m.internalReference)
              const Icon = kindIcon(kind)
              const isCredit = m.amount >= 0
              return (
                <li key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50/50 transition-colors">
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isCredit ? '#10b98118' : '#ef444418',
                      color: isCredit ? '#065f46' : '#b91c1c',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-500">
                        {movementLabel(kind)}
                      </span>
                      <span className="text-[10px] text-stone-300">·</span>
                      <span className="text-xs text-stone-500">{fmtDate(m.date)}</span>
                    </div>
                    <div className="text-sm font-medium text-stone-900 truncate">
                      {m.counterpartName || m.remittanceInfo || '—'}
                    </div>
                    {m.counterpartName && m.remittanceInfo && (
                      <div className="text-xs text-stone-400 truncate">{m.remittanceInfo}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-semibold text-sm inline-flex items-center gap-1 ${isCredit ? 'text-emerald-700' : 'text-red-700'}`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isCredit ? '+' : ''}{fmtMoney(m.amount)}
                    </div>
                    {m.reconciliations.length > 0 && (
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {m.reconciliations[0].type === 'Revenue' ? 'Recette' : 'Dépense'} #{m.reconciliations[0].recordId}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
