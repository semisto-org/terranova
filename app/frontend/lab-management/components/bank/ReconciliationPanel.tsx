import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Bookmark, Check, GraduationCap, Minus, Plus, ReceiptText, Scale, Search, Sparkles, Wallet, X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import type { BankTransaction, BankReconciliationEntry } from './BankSection'
import { MatchingRuleModal } from './MatchingRuleModal'

interface RegistrationItem {
  id: string
  contactName: string
  contactEmail: string
  trainingId: string
  trainingTitle: string | null
  paymentAmount: number
  amountPaid: number
  remainingAmount: number
  paymentStatus: string
  registeredAt: string | null
}

interface Candidate {
  type: 'Expense' | 'Revenue'
  id: string
  score: number | null
  label: string
  supplier?: string
  contact?: string
  amount: number
  date: string | null
  status: string
}

type CandidatesMode = 'suggested' | 'search'

interface ReconciliationPanelProps {
  transaction: BankTransaction
  onMatch: (
    transactionId: string,
    reconcilableType: string,
    reconcilableId: string,
    amount?: number
  ) => Promise<void>
  onUnreconcile: (reconciliationId: string) => Promise<void>
  onBack: () => void
  onCreateRequest?: (kind: 'expense' | 'revenue') => void
  onReload?: () => Promise<void>
}

const fmtMoney = (v: number) =>
  `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—')

function CandidateRow({
  candidate,
  disabled,
  onSelect,
}: {
  candidate: Candidate
  disabled: boolean
  onSelect: () => void
}) {
  const badgeStyle =
    candidate.score == null
      ? 'bg-stone-100 text-stone-500'
      : candidate.score >= 80
        ? 'bg-emerald-100 text-emerald-700'
        : candidate.score >= 50
          ? 'bg-amber-100 text-amber-700'
          : 'bg-stone-100 text-stone-500'
  const badgeLabel = candidate.score == null ? '—' : `${candidate.score}%`

  return (
    <li className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 px-4 py-3 hover:border-[#5B5781]/30 transition-colors">
      <div className="shrink-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${badgeStyle}`}
          title={candidate.score == null ? 'Résultat de recherche libre' : `Score ${candidate.score}%`}
        >
          {badgeLabel}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
            {candidate.type === 'Expense' ? 'Dépense' : 'Recette'}
          </span>
          <span className="text-[10px] text-stone-300">#{candidate.id}</span>
        </div>
        <div className="text-sm font-medium text-stone-900 truncate">{candidate.label}</div>
        <div className="text-xs text-stone-400">
          {candidate.supplier || candidate.contact || '—'} · {fmtDate(candidate.date)} · {candidate.status}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-mono font-semibold text-stone-900">{fmtMoney(candidate.amount)}</div>
      </div>
      <button
        onClick={onSelect}
        disabled={disabled}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
        style={{ backgroundColor: '#5B5781' }}
      >
        <Check className="w-4 h-4" />
        Allouer
      </button>
    </li>
  )
}

export function ReconciliationPanel({ transaction, onMatch, onUnreconcile, onBack, onCreateRequest, onReload }: ReconciliationPanelProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState<string | null>(null)
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null)
  const [pendingAmount, setPendingAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<CandidatesMode>('suggested')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Candidate[]>([])
  const [searching, setSearching] = useState(false)
  const [memorizeFor, setMemorizeFor] = useState<BankReconciliationEntry | null>(null)
  const [memorizeToast, setMemorizeToast] = useState<string | null>(null)
  const [showRegistrationPicker, setShowRegistrationPicker] = useState(false)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [registrationQuery, setRegistrationQuery] = useState('')
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [registrationSubmitting, setRegistrationSubmitting] = useState<string | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)

  const remaining = transaction.remainingAmount
  const totalAbs = Math.abs(transaction.amount)
  const allocated = transaction.allocatedAmount
  const progress = totalAbs > 0 ? Math.min(100, (allocated / totalAbs) * 100) : 0
  const isCredit = transaction.amount >= 0

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

  const loadRegistrations = useCallback(
    async (query: string) => {
      setRegistrationsLoading(true)
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        const data = await apiRequest(
          `/api/v1/bank/transactions/${transaction.id}/registrations${params.toString() ? `?${params.toString()}` : ''}`,
        )
        setRegistrations(data.items)
      } finally {
        setRegistrationsLoading(false)
      }
    },
    [transaction.id],
  )

  useEffect(() => {
    if (!showRegistrationPicker) return
    const timer = setTimeout(() => loadRegistrations(registrationQuery), 250)
    return () => clearTimeout(timer)
  }, [showRegistrationPicker, registrationQuery, loadRegistrations])

  const linkToRegistration = async (reg: RegistrationItem) => {
    setRegistrationError(null)
    setRegistrationSubmitting(reg.id)
    try {
      const body: Record<string, unknown> = {
        bank_transaction_id: transaction.id,
        training_registration_id: reg.id,
      }
      await apiRequest('/api/v1/bank/reconciliations/from_registration', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setShowRegistrationPicker(false)
      if (onReload) await onReload()
    } catch (err: unknown) {
      setRegistrationError(err instanceof Error ? err.message : 'Erreur lors de la liaison')
    } finally {
      setRegistrationSubmitting(null)
    }
  }

  // Debounced free search
  useEffect(() => {
    if (mode !== 'search') return
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({ q: trimmed })
        const data = await apiRequest(
          `/api/v1/bank/transactions/${transaction.id}/search_candidates?${params.toString()}`,
        )
        setSearchResults(data.items)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, mode, transaction.id])

  const openAllocation = (candidate: Candidate) => {
    setError(null)
    setPendingCandidate(candidate)
    const defaultAmount = Math.min(remaining, candidate.amount).toFixed(2)
    setPendingAmount(defaultAmount)
  }

  const confirmAllocation = async () => {
    if (!pendingCandidate) return
    const parsed = parseFloat(pendingAmount.replace(',', '.'))
    if (!isFinite(parsed) || parsed <= 0) {
      setError('Montant invalide.')
      return
    }
    if (parsed > remaining + 0.01) {
      setError(`Le montant dépasse le reste disponible (${fmtMoney(remaining)}).`)
      return
    }
    setMatching(pendingCandidate.id)
    try {
      await onMatch(transaction.id, pendingCandidate.type, pendingCandidate.id, parsed)
      setPendingCandidate(null)
      setPendingAmount('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur pendant le rapprochement.')
    } finally {
      setMatching(null)
    }
  }

  const handleUnreconcile = async (entry: BankReconciliationEntry) => {
    if (!window.confirm(`Retirer l'allocation de ${fmtMoney(entry.amount)} sur ${entry.label || 'cet élément'} ?`)) return
    await onUnreconcile(entry.id)
  }

  const allocatedKeys = useMemo(
    () => new Set(transaction.reconciliations.map((r) => `${r.type}-${r.recordId}`)),
    [transaction.reconciliations],
  )
  const visibleSuggested = useMemo(
    () => candidates.filter((c) => !allocatedKeys.has(`${c.type}-${c.id}`)),
    [candidates, allocatedKeys],
  )
  const visibleSearchResults = useMemo(
    () => searchResults.filter((c) => !allocatedKeys.has(`${c.type}-${c.id}`)),
    [searchResults, allocatedKeys],
  )

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux transactions
      </button>

      {/* Transaction + progression */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-400 uppercase tracking-[0.12em] mb-2 flex-wrap">
                <Wallet className="w-3.5 h-3.5" />
                Transaction bancaire
                <span className="text-stone-300">·</span>
                <span className="font-normal text-stone-500 normal-case tracking-normal">{transaction.bankName}</span>
                {transaction.organizationName && (
                  <>
                    <span className="text-stone-300">·</span>
                    <span className="font-normal text-stone-500 normal-case tracking-normal">
                      {transaction.organizationName}
                    </span>
                  </>
                )}
                {transaction.vatRegime === 'exempt' && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-700 normal-case tracking-normal"
                    title="Structure franchisée de TVA — aucune TVA à déclarer"
                  >
                    <Scale className="w-3 h-3" />
                    Franchise TVA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isCredit ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-400" />
                )}
                <span className="text-lg font-semibold text-stone-900 truncate">
                  {transaction.counterpartName || 'Inconnu'}
                </span>
              </div>
              {transaction.remittanceInfo && (
                <p className="text-sm text-stone-500 mt-1">{transaction.remittanceInfo}</p>
              )}
              {transaction.counterpartIban && (
                <p className="text-xs font-mono text-stone-400 mt-0.5">{transaction.counterpartIban}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className={`text-2xl font-bold font-mono ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                {isCredit ? '+' : ''}{fmtMoney(transaction.amount)}
              </div>
              <div className="text-sm text-stone-400 mt-0.5">{fmtDate(transaction.date)}</div>
            </div>
          </div>
        </div>

        {/* Allocation progress bar */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-stone-500">
              Alloué <span className="font-mono text-stone-700">{fmtMoney(allocated)}</span>
              <span className="text-stone-300"> / {fmtMoney(totalAbs)}</span>
            </span>
            <span className={remaining > 0.01 ? 'text-sky-700' : 'text-emerald-700'}>
              {remaining > 0.01 ? `Reste ${fmtMoney(remaining)}` : 'Totalement rapproché'}
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                progress >= 99.9 ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Existing allocations */}
        {transaction.reconciliations.length > 0 && (
          <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3">
            <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.12em] mb-2">
              Allocations enregistrées
            </div>
            <ul className="space-y-1.5">
              {transaction.reconciliations.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-stone-200 px-3 py-2"
                >
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-stone-100 text-stone-600 uppercase tracking-wider">
                    {entry.type === 'Expense' ? 'Dép.' : 'Rec.'}
                    <span className="text-stone-400">#{entry.recordId}</span>
                  </span>
                  <span className="flex-1 min-w-0 text-sm text-stone-700 truncate">
                    {entry.label || 'Sans titre'}
                  </span>
                  <span className="font-mono text-sm text-stone-900">{fmtMoney(entry.amount)}</span>
                  {entry.type === 'Expense' && entry.confidence === 'manual' && (
                    <button
                      onClick={() => setMemorizeFor(entry)}
                      className="p-1 text-stone-400 hover:text-[#5B5781] rounded transition-colors"
                      title="Mémoriser cette correspondance pour les futures transactions"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleUnreconcile(entry)}
                    className="p-1 text-stone-400 hover:text-red-500 rounded transition-colors"
                    title="Retirer cette allocation"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Candidates */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 bg-stone-100/80 rounded-lg">
            <button
              onClick={() => setMode('suggested')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'suggested' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Suggérés
              <span className="text-stone-400">({visibleSuggested.length})</span>
            </button>
            <button
              onClick={() => setMode('search')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === 'search' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Recherche libre
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isCredit && (
              <button
                onClick={() => { setShowRegistrationPicker(true); setRegistrationError(null) }}
                disabled={remaining <= 0.01}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B01A19] border border-[#B01A19]/30 rounded-lg hover:bg-[#B01A19]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Lier à une inscription
              </button>
            )}
            {onCreateRequest && (
              <button
                onClick={() => onCreateRequest(isCredit ? 'revenue' : 'expense')}
                disabled={remaining <= 0.01}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5B5781] border border-[#5B5781]/30 rounded-lg hover:bg-[#5B5781]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer une {isCredit ? 'recette' : 'dépense'}
              </button>
            )}
          </div>
        </div>

        {mode === 'search' && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Rechercher une ${isCredit ? 'recette' : 'dépense'} par nom, tiers, ou ID`}
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:border-[#5B5781] focus:ring-1 focus:ring-[#5B5781] outline-none"
              autoFocus
            />
          </div>
        )}

        {mode === 'suggested' ? (
          loading ? (
            <div className="text-center py-8 text-stone-400">Recherche de correspondances...</div>
          ) : visibleSuggested.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-stone-200">
              <p className="text-stone-500">Aucun candidat suggéré.</p>
              <p className="text-xs text-stone-400 mt-1">
                Basculez en recherche libre pour trouver un élément hors fenêtre.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleSuggested.map((c) => (
                <CandidateRow
                  key={`${c.type}-${c.id}`}
                  candidate={c}
                  disabled={matching !== null || remaining <= 0.01}
                  onSelect={() => openAllocation(c)}
                />
              ))}
            </ul>
          )
        ) : searchQuery.trim().length < 2 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-stone-200">
            <p className="text-stone-500">Saisissez au moins 2 caractères.</p>
            <p className="text-xs text-stone-400 mt-1">
              Les éléments déjà totalement rapprochés sont exclus.
            </p>
          </div>
        ) : searching ? (
          <div className="text-center py-8 text-stone-400">Recherche…</div>
        ) : visibleSearchResults.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-stone-200">
            <p className="text-stone-500">Aucun résultat.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleSearchResults.map((c) => (
              <CandidateRow
                key={`${c.type}-${c.id}`}
                candidate={c}
                disabled={matching !== null || remaining <= 0.01}
                onSelect={() => openAllocation(c)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Allocation dialog */}
      {pendingCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-[2px] px-4"
          onClick={() => !matching && setPendingCandidate(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.12em]">
                  Allouer à cette {pendingCandidate.type === 'Expense' ? 'dépense' : 'recette'}
                </div>
                <div className="text-sm font-medium text-stone-900 mt-0.5">{pendingCandidate.label}</div>
                <div className="text-xs text-stone-400">
                  {pendingCandidate.supplier || pendingCandidate.contact || '—'} · {fmtDate(pendingCandidate.date)} · {fmtMoney(pendingCandidate.amount)}
                </div>
              </div>
              <button
                onClick={() => setPendingCandidate(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
                disabled={matching !== null}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-stone-600 mb-1">Montant à allouer</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={pendingAmount}
                onChange={(e) => setPendingAmount(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-lg font-mono border border-stone-300 rounded-lg focus:border-[#5B5781] focus:ring-1 focus:ring-[#5B5781] outline-none"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">€</span>
            </div>
            <div className="text-xs text-stone-400 mt-1.5">
              Reste disponible sur la transaction : <span className="font-mono text-stone-600">{fmtMoney(remaining)}</span>
            </div>

            {error && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setPendingCandidate(null)}
                disabled={matching !== null}
                className="px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={confirmAllocation}
                disabled={matching !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#5B5781' }}
              >
                <Check className="w-4 h-4" />
                {matching !== null ? 'Allocation…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration picker modal */}
      {showRegistrationPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-[2px] px-4"
          onClick={() => !registrationSubmitting && setShowRegistrationPicker(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-2xl p-5 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.12em]">
                  Inscription activité
                </div>
                <div className="text-sm font-medium text-stone-900 mt-0.5">Lier ce paiement de {fmtMoney(remaining)}</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Seules les inscriptions non totalement payées sont listées.
                </div>
              </div>
              <button
                onClick={() => setShowRegistrationPicker(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
                disabled={registrationSubmitting !== null}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={registrationQuery}
                onChange={(e) => setRegistrationQuery(e.target.value)}
                placeholder="Rechercher par nom, email, ou titre d'activité"
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:border-[#5B5781] focus:ring-1 focus:ring-[#5B5781] outline-none"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto -mx-5 px-5">
              {registrationsLoading ? (
                <div className="text-center py-10 text-stone-400">Recherche…</div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-10 text-stone-500">
                  Aucune inscription ouverte trouvée.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {registrations.map((reg) => {
                    const progress = reg.paymentAmount > 0 ? Math.min(100, (reg.amountPaid / reg.paymentAmount) * 100) : 0
                    return (
                      <li
                        key={reg.id}
                        className="flex items-center gap-4 bg-white rounded-lg border border-stone-200 px-3 py-2.5 hover:border-[#B01A19]/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-stone-900 truncate">{reg.contactName}</div>
                          <div className="text-xs text-stone-500 truncate">
                            {reg.trainingTitle || 'Sans titre'} · <span className="text-stone-400">{reg.contactEmail}</span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="relative h-1 flex-1 rounded-full bg-stone-100 overflow-hidden">
                              <div
                                className={`absolute inset-y-0 left-0 ${progress >= 99.9 ? 'bg-emerald-500' : 'bg-[#B01A19]/70'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-stone-500 font-mono shrink-0">
                              {reg.amountPaid.toFixed(2)} / {reg.paymentAmount.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => linkToRegistration(reg)}
                          disabled={registrationSubmitting !== null}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
                          style={{ backgroundColor: '#B01A19' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {registrationSubmitting === reg.id ? 'Liaison…' : 'Lier'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {registrationError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {registrationError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memorize rule modal */}
      {memorizeFor && (
        <MatchingRuleModal
          transaction={{
            id: transaction.id,
            organizationId: transaction.organizationId || null,
            counterpartName: transaction.counterpartName,
            remittanceInfo: transaction.remittanceInfo,
            counterpartIban: transaction.counterpartIban,
          }}
          matchedExpense={{
            supplierName: memorizeFor.label,
          }}
          onSaved={() => {
            setMemorizeFor(null)
            setMemorizeToast('Règle enregistrée — sera appliquée aux futures transactions')
            window.setTimeout(() => setMemorizeToast(null), 4000)
          }}
          onCancel={() => setMemorizeFor(null)}
        />
      )}

      {memorizeToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-stone-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          {memorizeToast}
        </div>
      )}
    </div>
  )
}
