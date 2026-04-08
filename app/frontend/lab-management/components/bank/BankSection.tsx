import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ConnectionStatus } from './ConnectionStatus'
import { TransactionList } from './TransactionList'
import { ReconciliationPanel } from './ReconciliationPanel'

export interface AccountSummary {
  connectionId: string
  bankName: string
  iban: string | null
  scope: string
  balance: number | null
  unmatchedCount: number
  matchedCount: number
  lastSyncedAt: string | null
  consentExpiresAt: string | null
  consentExpiringSoon: boolean
}

export interface BankSummaryResponse {
  accounts: AccountSummary[]
  totals: { unmatchedCount: number; matchedCount: number }
}

export interface BankTransaction {
  id: string
  connectionId: string
  bankName: string
  date: string
  bookingDate: string | null
  amount: number
  currency: string
  counterpartName: string | null
  counterpartIban: string | null
  remittanceInfo: string | null
  internalReference: string | null
  category: string | null
  status: 'unmatched' | 'matched' | 'ignored'
  reconciliation: {
    id: string
    type: string
    recordId: string
    confidence: string
    notes: string | null
  } | null
}

export interface BankConnection {
  id: string
  provider: string
  institutionId: string | null
  bankName: string
  iban: string | null
  status: string
  accountingScope: string
  consentExpiresAt: string | null
  consentExpiringSoon: boolean
  lastSyncedAt: string | null
  connectedBy: { id: string; name: string } | null
  createdAt: string
}

export const SCOPE_LABELS: Record<string, string> = {
  general: 'Général',
  nursery: 'Pépinière',
}

type SubView = 'overview' | 'transactions' | 'reconcile'

export function BankSection() {
  const [subView, setSubView] = useState<SubView>('overview')
  const [summary, setSummary] = useState<BankSummaryResponse | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ status?: string; dateFrom?: string; dateTo?: string; search?: string }>({})

  const loadSummary = useCallback(async () => {
    const data = await apiRequest('/api/v1/bank/summary')
    setSummary(data)
  }, [])

  const loadConnections = useCallback(async () => {
    const data = await apiRequest('/api/v1/bank/connections')
    setConnections(data.items)
  }, [])

  const loadTransactions = useCallback(async () => {
    const params = new URLSearchParams()
    if (activeConnectionId) params.set('connection_id', activeConnectionId)
    if (filters.status) params.set('status', filters.status)
    if (filters.dateFrom) params.set('date_from', filters.dateFrom)
    if (filters.dateTo) params.set('date_to', filters.dateTo)
    if (filters.search) params.set('search', filters.search)
    const qs = params.toString()
    const data = await apiRequest(`/api/v1/bank/transactions${qs ? `?${qs}` : ''}`)
    setTransactions(data.items)
  }, [filters, activeConnectionId])

  useEffect(() => {
    Promise.all([loadSummary(), loadConnections()]).finally(() => setLoading(false))
  }, [loadSummary, loadConnections])

  useEffect(() => {
    if (summary && summary.accounts.length > 0) loadTransactions()
  }, [summary?.accounts?.length, loadTransactions])

  const handleConnect = async (institutionId: string, accountingScope: string) => {
    const redirectUrl = `${window.location.origin}/lab?section=bank&bank_callback=1`
    const data = await apiRequest('/api/v1/bank/connect', {
      method: 'POST',
      body: JSON.stringify({ redirect_url: redirectUrl, institution_id: institutionId, accounting_scope: accountingScope }),
    })
    if (data.link) window.location.href = data.link
  }

  const handleCallback = useCallback(async (requisitionId: string) => {
    await apiRequest('/api/v1/bank/callback', {
      method: 'POST',
      body: JSON.stringify({ requisition_id: requisitionId }),
    })
    await Promise.all([loadSummary(), loadConnections()])
  }, [loadSummary, loadConnections])

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (params.get('bank_callback') === '1' && ref) {
      handleCallback(ref)
      const url = new URL(window.location.href)
      url.searchParams.delete('bank_callback')
      url.searchParams.delete('ref')
      window.history.replaceState({}, '', url.toString())
    }
  }, [handleCallback])

  const handleSync = async (connectionId?: string) => {
    const targetId = connectionId || activeConnectionId
    if (!targetId && (!summary || summary.accounts.length === 0)) return
    setSyncing(true)
    try {
      if (targetId) {
        await apiRequest('/api/v1/bank/sync', {
          method: 'POST',
          body: JSON.stringify({ connection_id: targetId }),
        })
      } else {
        // Sync all connections
        for (const account of summary!.accounts) {
          await apiRequest('/api/v1/bank/sync', {
            method: 'POST',
            body: JSON.stringify({ connection_id: account.connectionId }),
          })
        }
      }
      await Promise.all([loadSummary(), loadTransactions()])
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    await apiRequest(`/api/v1/bank/connections/${connectionId}`, { method: 'DELETE' })
    await Promise.all([loadSummary(), loadConnections()])
  }

  const handleAutoReconcile = async () => {
    const body: Record<string, string> = {}
    if (activeConnectionId) body.connection_id = activeConnectionId
    const result = await apiRequest('/api/v1/bank/reconciliations/auto', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    await Promise.all([loadSummary(), loadTransactions()])
    return result
  }

  const handleIgnore = async (transactionId: string) => {
    await apiRequest(`/api/v1/bank/transactions/${transactionId}/ignore`, { method: 'PATCH' })
    await loadTransactions()
    await loadSummary()
  }

  const handleUnignore = async (transactionId: string) => {
    await apiRequest(`/api/v1/bank/transactions/${transactionId}/unignore`, { method: 'PATCH' })
    await loadTransactions()
    await loadSummary()
  }

  const handleReconcile = async (transactionId: string, reconcilableType: string, reconcilableId: string) => {
    await apiRequest('/api/v1/bank/reconciliations', {
      method: 'POST',
      body: JSON.stringify({
        bank_transaction_id: transactionId,
        reconcilable_type: reconcilableType,
        reconcilable_id: reconcilableId,
      }),
    })
    setSelectedTransaction(null)
    await Promise.all([loadSummary(), loadTransactions()])
  }

  const handleUnreconcile = async (reconciliationId: string) => {
    await apiRequest(`/api/v1/bank/reconciliations/${reconciliationId}`, { method: 'DELETE' })
    await Promise.all([loadSummary(), loadTransactions()])
  }

  const openReconcile = (tx: BankTransaction) => {
    setSelectedTransaction(tx)
    setSubView('reconcile')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-stone-400">Chargement...</div>
  }

  const totalUnmatched = summary?.totals?.unmatchedCount ?? 0

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-1 border-b border-stone-200">
        {([
          { id: 'overview' as const, label: 'Connexions' },
          { id: 'transactions' as const, label: 'Transactions', count: totalUnmatched },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              subView === tab.id || (subView === 'reconcile' && tab.id === 'transactions')
                ? 'border-[#5B5781] text-[#5B5781]'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {subView === 'overview' && (
        <ConnectionStatus
          summary={summary}
          connections={connections}
          syncing={syncing}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
        />
      )}

      {subView === 'transactions' && (
        <TransactionList
          transactions={transactions}
          filters={filters}
          onFiltersChange={setFilters}
          onReconcile={openReconcile}
          onIgnore={handleIgnore}
          onUnignore={handleUnignore}
          onUnreconcile={handleUnreconcile}
          onAutoReconcile={handleAutoReconcile}
          onSync={() => handleSync()}
          syncing={syncing}
          summary={summary}
          connections={connections}
          activeConnectionId={activeConnectionId}
          onConnectionChange={setActiveConnectionId}
        />
      )}

      {subView === 'reconcile' && selectedTransaction && (
        <ReconciliationPanel
          transaction={selectedTransaction}
          onMatch={handleReconcile}
          onBack={() => setSubView('transactions')}
        />
      )}
    </div>
  )
}
