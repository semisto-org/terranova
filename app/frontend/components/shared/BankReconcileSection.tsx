import { useState } from 'react'
import { Landmark, Link2, Loader2, X } from 'lucide-react'
import { apiRequest } from '../../lib/api'

export interface LinkedTx {
  reconciliationId?: string
  transactionId: string
  connectionId?: string
  bankName: string | null
  provider: string | null
  date: string | null
  amount: number
  allocatedAmount?: number
  counterpartName: string | null
  remittanceInfo: string | null
  confidence?: string | null
}

interface Props {
  /** Transactions already reconciled to this expense/revenue. */
  linkedTransactions: LinkedTx[]
  reconcilableType: 'Expense' | 'Revenue'
  reconcilableId: string
  /** GET endpoint returning `{ items: LinkedTx[] }` of candidate transactions. */
  candidatesUrl: string
  emptyLabel: string
  /** Fired with the newly-linked transaction so the parent can update its row. */
  onReconciled?: (linkedTx: LinkedTx) => void
}

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')
const fmtMoney = (n: number) =>
  `${Math.abs(Number(n || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

// Read-only list of reconciled bank transactions, plus — when none are linked
// yet — an inline picker that fetches same-amount transactions (±3 months) and
// reconciles the chosen one without leaving the drawer.
export function BankReconcileSection({
  linkedTransactions,
  reconcilableType,
  reconcilableId,
  candidatesUrl,
  emptyLabel,
  onReconciled,
}: Props) {
  const [linked, setLinked] = useState<LinkedTx[]>(linkedTransactions)
  const [picking, setPicking] = useState(false)
  const [candidates, setCandidates] = useState<LinkedTx[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openPicker = async () => {
    setPicking(true)
    setLoading(true)
    setError(null)
    try {
      const res = await apiRequest(candidatesUrl)
      setCandidates(res?.items ?? [])
    } catch {
      setError('Impossible de charger les transactions candidates.')
    } finally {
      setLoading(false)
    }
  }

  const reconcile = async (tx: LinkedTx) => {
    setBusyId(tx.transactionId)
    setError(null)
    try {
      const rec = await apiRequest('/api/v1/bank/reconciliations', {
        method: 'POST',
        body: JSON.stringify({
          bank_transaction_id: tx.transactionId,
          reconcilable_type: reconcilableType,
          reconcilable_id: reconcilableId,
        }),
      })
      const linkedTx: LinkedTx = {
        ...tx,
        reconciliationId: rec?.id,
        allocatedAmount: rec?.amount ?? Math.abs(tx.amount),
        confidence: rec?.confidence ?? 'manual',
      }
      setLinked([linkedTx])
      setPicking(false)
      setCandidates(null)
      onReconciled?.(linkedTx)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réconciliation.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Landmark className="w-3.5 h-3.5 text-stone-400" />
        <div className="text-[10px] uppercase tracking-[0.16em] text-stone-400 font-medium">Transactions bancaires liées</div>
        {linked.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-600">
            {linked.length}
          </span>
        )}
      </div>

      {linked.length > 0 ? (
        <ul className="space-y-1.5">
          {linked.map((tx) => (
            <li
              key={tx.reconciliationId || tx.transactionId}
              className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-3 ${
                tx.confidence === 'auto' ? 'bg-emerald-50/40 border-emerald-200/60' : 'bg-white border-stone-200'
              }`}
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-stone-100 text-stone-500 inline-flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                  <span className="font-medium text-stone-600">{tx.bankName || tx.provider || '—'}</span>
                  <span>·</span>
                  <span className="font-mono">{fmtDate(tx.date)}</span>
                  {tx.confidence === 'auto' && (
                    <span className="text-emerald-700 text-[10px] uppercase tracking-wider font-semibold">auto</span>
                  )}
                </div>
                <div className="text-stone-900 truncate">{tx.counterpartName || tx.remittanceInfo || '—'}</div>
              </div>
              <div className="font-mono font-semibold text-stone-900 text-sm shrink-0">
                {fmtMoney(tx.allocatedAmount ?? tx.amount)}
              </div>
            </li>
          ))}
        </ul>
      ) : picking ? (
        <div className="rounded-lg border border-stone-200 bg-white p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-4 text-sm text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Recherche des transactions…
            </div>
          ) : (candidates?.length ?? 0) === 0 ? (
            <div className="px-2 py-4 text-xs text-stone-500">
              Aucune transaction du même montant sur ±3 mois.
            </div>
          ) : (
            <ul className="space-y-1">
              {candidates!.map((tx) => (
                <li key={tx.transactionId}>
                  <button
                    type="button"
                    onClick={() => reconcile(tx)}
                    disabled={Boolean(busyId)}
                    className="w-full text-left rounded-lg border border-stone-200 hover:border-[#5B5781] hover:bg-stone-50 px-3 py-2 flex items-center gap-3 transition-colors disabled:opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span className="font-medium text-stone-600">{tx.bankName || tx.provider || '—'}</span>
                        <span>·</span>
                        <span className="font-mono">{fmtDate(tx.date)}</span>
                      </div>
                      <div className="text-stone-900 truncate text-sm">{tx.counterpartName || tx.remittanceInfo || '—'}</div>
                    </div>
                    <div className="font-mono font-semibold text-stone-900 text-sm shrink-0">{fmtMoney(tx.amount)}</div>
                    {busyId === tx.transactionId ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#5B5781] shrink-0" />
                    ) : (
                      <Link2 className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => { setPicking(false); setCandidates(null); setError(null) }}
            className="mt-1 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-500 hover:text-stone-800"
          >
            <X className="w-3 h-3" /> Fermer
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-200 p-3 flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500">{emptyLabel}</span>
          <button
            type="button"
            onClick={openPicker}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-[#5B5781] transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" /> Réconcilier une transaction
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  )
}
