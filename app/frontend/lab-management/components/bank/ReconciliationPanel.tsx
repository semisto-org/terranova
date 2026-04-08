import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { BankTransaction } from './BankSection'

interface Candidate {
  type: string
  id: string
  score: number
  label: string
  supplier?: string
  contact?: string
  amount: number
  date: string | null
  status: string
}

interface ReconciliationPanelProps {
  transaction: BankTransaction
  onMatch: (transactionId: string, reconcilableType: string, reconcilableId: string) => Promise<void>
  onBack: () => void
}

const fmtMoney = (v: number) =>
  `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')

export function ReconciliationPanel({ transaction, onMatch, onBack }: ReconciliationPanelProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState<string | null>(null)

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest(`/api/v1/bank/transactions/${transaction.id}/candidates`)
      setCandidates(data.items)
    } finally {
      setLoading(false)
    }
  }, [transaction.id])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  const handleMatch = async (candidate: Candidate) => {
    setMatching(candidate.id)
    try {
      await onMatch(transaction.id, candidate.type, candidate.id)
    } finally {
      setMatching(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
        <ArrowLeft className="w-4 h-4" />
        Retour aux transactions
      </button>

      {/* Transaction detail */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">Transaction bancaire</div>
            <div className="flex items-center gap-2">
              {transaction.amount < 0 ? (
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              ) : (
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-lg font-semibold text-stone-900">
                {transaction.counterpartName || 'Inconnu'}
              </span>
            </div>
            {transaction.remittanceInfo && (
              <p className="text-sm text-stone-500 mt-1">{transaction.remittanceInfo}</p>
            )}
            {transaction.counterpartIban && (
              <p className="text-xs text-stone-400 mt-0.5">{transaction.counterpartIban}</p>
            )}
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold font-mono ${transaction.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {transaction.amount >= 0 ? '+' : ''}{fmtMoney(transaction.amount)}
            </div>
            <div className="text-sm text-stone-400">{fmtDate(transaction.date)}</div>
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">
          {transaction.amount < 0 ? 'Dépenses' : 'Recettes'} candidates ({candidates.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-stone-400">Recherche de correspondances...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-stone-200">
            <p className="text-stone-500">Aucune correspondance trouvée.</p>
            <p className="text-xs text-stone-400 mt-1">
              Vérifiez que la {transaction.amount < 0 ? 'dépense' : 'recette'} existe et que le montant/date correspondent.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => (
              <div
                key={`${c.type}-${c.id}`}
                className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 px-4 py-3 hover:border-[#5B5781]/30 transition-colors"
              >
                {/* Score indicator */}
                <div className="shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      c.score >= 80
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.score >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {c.score}%
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-400 uppercase">
                      {c.type === 'Expense' ? 'Dépense' : 'Recette'}
                    </span>
                    <span className="text-xs text-stone-300">#{c.id}</span>
                  </div>
                  <div className="text-sm font-medium text-stone-900 truncate">{c.label}</div>
                  <div className="text-xs text-stone-400">
                    {c.supplier || c.contact || '—'} · {fmtDate(c.date)} · {c.status}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-semibold text-stone-900">{fmtMoney(c.amount)}</div>
                </div>

                {/* Match button */}
                <button
                  onClick={() => handleMatch(c)}
                  disabled={matching !== null}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#5B5781' }}
                >
                  <Check className="w-4 h-4" />
                  {matching === c.id ? 'Match...' : 'Matcher'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
