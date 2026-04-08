import { ArrowDownLeft, ArrowUpRight, Check, Eye, EyeOff, Search, Wand2, X } from 'lucide-react'
import type { BankConnection, BankSummaryResponse, BankTransaction } from './BankSection'
import { SCOPE_LABELS } from './BankSection'

interface TransactionListProps {
  transactions: BankTransaction[]
  filters: { status?: string; dateFrom?: string; dateTo?: string; search?: string }
  onFiltersChange: (f: TransactionListProps['filters']) => void
  onReconcile: (tx: BankTransaction) => void
  onIgnore: (id: string) => void
  onUnignore: (id: string) => void
  onUnreconcile: (reconciliationId: string) => void
  onAutoReconcile: () => Promise<unknown>
  summary: BankSummaryResponse | null
  connections: BankConnection[]
  activeConnectionId: string | null
  onConnectionChange: (id: string | null) => void
}

const fmtMoney = (v: number) =>
  `${v >= 0 ? '+' : ''}${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string) => new Date(v).toLocaleDateString('fr-FR')

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  unmatched: { label: 'Non rapprochée', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  matched: { label: 'Rapprochée', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  ignored: { label: 'Ignorée', bg: 'bg-stone-50 border-stone-200', text: 'text-stone-500' },
}

// Short bank initial for badge
const bankInitial = (name: string) => name.charAt(0).toUpperCase()

export function TransactionList({
  transactions,
  filters,
  onFiltersChange,
  onReconcile,
  onIgnore,
  onUnignore,
  onUnreconcile,
  onAutoReconcile,
  summary,
  connections,
  activeConnectionId,
  onConnectionChange,
}: TransactionListProps) {
  const hasMultipleConnections = connections.filter((c) => c.status === 'linked').length > 1

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, communication...)"
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
          />
        </div>
        {hasMultipleConnections && (
          <select
            value={activeConnectionId || ''}
            onChange={(e) => onConnectionChange(e.target.value || null)}
            className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
          >
            <option value="">Tous les comptes</option>
            {connections
              .filter((c) => c.status === 'linked')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bankName} ({SCOPE_LABELS[c.accountingScope] || c.accountingScope})
                </option>
              ))}
          </select>
        )}
        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="unmatched">Non rapprochées</option>
          <option value="matched">Rapprochées</option>
          <option value="ignored">Ignorées</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
        />
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onAutoReconcile()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#5B5781] border border-[#5B5781] rounded-lg hover:bg-[#5B5781]/5 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Réconciliation auto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                {hasMultipleConnections && (
                  <th className="text-center px-2 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Cpte</th>
                )}
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Contrepartie</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Communication</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Montant</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={hasMultipleConnections ? 7 : 6} className="text-center py-12 text-stone-400">
                    {summary && summary.accounts.length > 0 ? 'Aucune transaction trouvée.' : 'Connectez un compte pour voir les transactions.'}
                  </td>
                </tr>
              )}
              {transactions.map((tx) => {
                const badge = STATUS_BADGES[tx.status]
                return (
                  <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmtDate(tx.date)}</td>
                    {hasMultipleConnections && (
                      <td className="px-2 py-3 text-center">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: tx.bankName === 'Triodos' ? '#00684A' : '#1a5276' }}
                          title={tx.bankName}
                        >
                          {bankInitial(tx.bankName)}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tx.amount < 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-medium text-stone-900 truncate max-w-[200px]">
                          {tx.counterpartName || tx.counterpartIban || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 truncate max-w-[250px]" title={tx.remittanceInfo || undefined}>
                      {tx.remittanceInfo || '—'}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${tx.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {fmtMoney(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      {tx.reconciliation && (
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {tx.reconciliation.type === 'Expense' ? 'Dépense' : 'Recette'} #{tx.reconciliation.recordId}
                          {tx.reconciliation.confidence === 'auto' && ' · auto'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {tx.status === 'unmatched' && (
                          <>
                            <button
                              onClick={() => onReconcile(tx)}
                              className="p-1.5 text-[#5B5781] hover:bg-[#5B5781]/10 rounded transition-colors"
                              title="Rapprocher"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onIgnore(tx.id)}
                              className="p-1.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
                              title="Ignorer"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {tx.status === 'matched' && tx.reconciliation && (
                          <button
                            onClick={() => onUnreconcile(tx.reconciliation!.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 rounded transition-colors"
                            title="Annuler le rapprochement"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {tx.status === 'ignored' && (
                          <button
                            onClick={() => onUnignore(tx.id)}
                            className="p-1.5 text-stone-400 hover:text-stone-600 rounded transition-colors"
                            title="Rétablir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
