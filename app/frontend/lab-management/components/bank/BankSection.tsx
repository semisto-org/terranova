import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { ConnectionStatus } from './ConnectionStatus'
import { TransactionList } from './TransactionList'
import { ReconciliationPanel } from './ReconciliationPanel'
import { ExpenseFormModal } from '../../../components/shared/ExpenseFormModal'
import { RevenueFormModal } from '../../../components/shared/RevenueFormModal'

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

export interface BankReconciliationEntry {
  id: string
  type: 'Expense' | 'Revenue'
  recordId: string
  label: string | null
  amount: number
  confidence: string
  notes: string | null
}

export interface BankTransaction {
  id: string
  connectionId: string
  bankName: string
  accountingScope: string
  vatRegime: 'subject' | 'exempt'
  organizationId: string | null
  organizationName: string | null
  date: string
  bookingDate: string | null
  amount: number
  currency: string
  counterpartName: string | null
  counterpartIban: string | null
  remittanceInfo: string | null
  internalReference: string | null
  category: string | null
  status: 'unmatched' | 'matched' | 'ignored' | 'partially_matched'
  allocatedAmount: number
  remainingAmount: number
  reconciliations: BankReconciliationEntry[]
}

export interface BankConnection {
  id: string
  provider: string
  institutionId: string | null
  bankName: string
  iban: string | null
  status: string
  accountingScope: string
  vatRegime: 'subject' | 'exempt'
  organizationId: string
  organizationName: string | null
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

interface OrganizationSummary {
  id: string
  name: string
  vatSubject: boolean
  isDefault: boolean
}

export function BankSection() {
  const [subView, setSubView] = useState<SubView>('overview')
  const [summary, setSummary] = useState<BankSummaryResponse | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ status?: string; dateFrom?: string; dateTo?: string; search?: string }>({})
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [contactOptions, setContactOptions] = useState<{ value: string; label: string }[]>([])

  const loadSummary = useCallback(async () => {
    const data = await apiRequest('/api/v1/bank/summary')
    setSummary(data)
  }, [])

  const loadConnections = useCallback(async () => {
    const data = await apiRequest('/api/v1/bank/connections')
    setConnections(data.items)
  }, [])

  const loadOrganizations = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/organizations')
      setOrganizations(data.items || [])
    } catch {
      setOrganizations([])
    }
  }, [])

  const loadContacts = useCallback(async () => {
    try {
      const data = await apiRequest('/api/v1/lab/contacts')
      setContactOptions(
        (data.items || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })),
      )
    } catch {
      setContactOptions([])
    }
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
    Promise.all([loadSummary(), loadConnections(), loadOrganizations(), loadContacts()]).finally(() => setLoading(false))
  }, [loadSummary, loadConnections, loadOrganizations, loadContacts])

  useEffect(() => {
    if (summary && summary.accounts.length > 0) loadTransactions()
  }, [summary?.accounts?.length, loadTransactions])

  const handleCreateConnection = async (bankName: string, iban: string, accountingScope: string, organizationId?: string | null) => {
    const body: Record<string, unknown> = { bank_name: bankName, iban, accounting_scope: accountingScope }
    if (organizationId) body.organization_id = organizationId
    await apiRequest('/api/v1/bank/connections', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    await Promise.all([loadSummary(), loadConnections()])
  }

  const handleUploadCoda = async (connectionId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await apiRequest(`/api/v1/bank/connections/${connectionId}/upload_coda`, {
      method: 'POST',
      body: formData,
    })
    await Promise.all([loadSummary(), loadTransactions()])
    return result
  }

  const handleDisconnect = async (connectionId: string) => {
    await apiRequest(`/api/v1/bank/connections/${connectionId}`, { method: 'DELETE' })
    await Promise.all([loadSummary(), loadConnections()])
  }

  const handleUpdateConnection = async (
    connectionId: string,
    updates: { bankName?: string; iban?: string | null; accountingScope?: string; organizationId?: string | null }
  ) => {
    const body: Record<string, unknown> = {}
    if (updates.bankName !== undefined) body.bank_name = updates.bankName
    if (updates.iban !== undefined) body.iban = updates.iban
    if (updates.accountingScope !== undefined) body.accounting_scope = updates.accountingScope
    if (updates.organizationId !== undefined) body.organization_id = updates.organizationId
    await apiRequest(`/api/v1/bank/connections/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    await Promise.all([loadSummary(), loadConnections(), loadTransactions()])
  }

  const handleAutoReconcile = async (): Promise<{ autoMatched: number; suggested: number }> => {
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

  const refreshSelectedTransaction = async (transactionId: string) => {
    try {
      const data = await apiRequest(`/api/v1/bank/transactions?connection_id=${selectedTransaction?.connectionId || ''}`)
      const updated = (data.items as BankTransaction[]).find((t) => t.id === transactionId)
      if (updated) setSelectedTransaction(updated)
    } catch {
      // fall back: list refresh below will eventually reflect the state
    }
  }

  const handleReconcile = async (
    transactionId: string,
    reconcilableType: string,
    reconcilableId: string,
    amount?: number
  ) => {
    const body: Record<string, unknown> = {
      bank_transaction_id: transactionId,
      reconcilable_type: reconcilableType,
      reconcilable_id: reconcilableId,
    }
    if (amount != null) body.amount = amount
    const result = await apiRequest('/api/v1/bank/reconciliations', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    await Promise.all([loadSummary(), loadTransactions()])
    // Keep panel open if transaction is only partially allocated; otherwise go back
    if (result?.transaction?.status === 'matched') {
      setSelectedTransaction(null)
      setSubView('transactions')
    } else {
      await refreshSelectedTransaction(transactionId)
    }
  }

  const handleUnreconcile = async (reconciliationId: string) => {
    await apiRequest(`/api/v1/bank/reconciliations/${reconciliationId}`, { method: 'DELETE' })
    await Promise.all([loadSummary(), loadTransactions()])
    if (selectedTransaction) {
      await refreshSelectedTransaction(selectedTransaction.id)
    }
  }

  const openReconcile = (tx: BankTransaction) => {
    setSelectedTransaction(tx)
    setSubView('reconcile')
  }

  const [creationTarget, setCreationTarget] = useState<'expense' | 'revenue' | null>(null)
  const [creationBusy, setCreationBusy] = useState(false)

  const defaultExpenseInitial = selectedTransaction
    ? {
        name: selectedTransaction.counterpartName || '',
        supplier: selectedTransaction.counterpartName || '',
        status: 'paid',
        invoiceDate: selectedTransaction.date,
        paymentDate: selectedTransaction.date,
        paymentType: 'transfer_triodos',
        totalInclVat: Math.abs(selectedTransaction.amount),
        amountExclVat: Math.abs(selectedTransaction.amount),
        expenseType: 'services_and_goods',
        vatRate: selectedTransaction.vatRegime === 'exempt' ? 'na' : '',
        notes: selectedTransaction.remittanceInfo || '',
        poles: [],
      }
    : null

  const defaultRevenueInitial = selectedTransaction
    ? {
        id: '',
        amount: Math.abs(selectedTransaction.amount),
        description: selectedTransaction.remittanceInfo || '',
        date: selectedTransaction.date,
        contactId: null,
        contactName: selectedTransaction.counterpartName,
        pole: selectedTransaction.accountingScope === 'nursery' ? 'nursery' : '',
        trainingId: null,
        designProjectId: null,
        revenueType: null,
        status: 'received',
        notes: selectedTransaction.remittanceInfo || '',
        label: selectedTransaction.counterpartName,
        amountExclVat: Math.abs(selectedTransaction.amount),
        vat6: 0,
        vat21: 0,
        paymentMethod: 'transfer',
        category: null,
        vatRate: selectedTransaction.vatRegime === 'exempt' ? 'exempt' : null,
        vatExemption: selectedTransaction.vatRegime === 'exempt',
        invoiceUrl: null,
        paidAt: selectedTransaction.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null

  const handleCreateExpenseFromTransaction = async (payload: Record<string, unknown>) => {
    if (!selectedTransaction) return
    setCreationBusy(true)
    try {
      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'document' && value instanceof File) {
          formData.append('document', value)
        } else if (key === 'poles' && Array.isArray(value)) {
          value.forEach((p) => formData.append('poles[]', String(p)))
        } else {
          formData.append(key, typeof value === 'boolean' ? String(value) : String(value))
        }
      })
      const created = await apiRequest('/api/v1/lab/expenses', { method: 'POST', body: formData })
      setCreationTarget(null)
      await handleReconcile(selectedTransaction.id, 'Expense', created.id, Math.abs(selectedTransaction.amount))
    } finally {
      setCreationBusy(false)
    }
  }

  const handleCreateRevenueFromTransaction = async (payload: Record<string, unknown>) => {
    if (!selectedTransaction) return
    setCreationBusy(true)
    try {
      const created = await apiRequest('/api/v1/lab/revenues', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setCreationTarget(null)
      await handleReconcile(selectedTransaction.id, 'Revenue', created.id, Math.abs(selectedTransaction.amount))
    } finally {
      setCreationBusy(false)
    }
  }

  const fetchContacts = useCallback(async () => {
    const data = await apiRequest('/api/v1/lab/contacts')
    return data
  }, [])

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
          organizations={organizations}
          onCreateConnection={handleCreateConnection}
          onUploadCoda={handleUploadCoda}
          onDisconnect={handleDisconnect}
          onUpdateConnection={handleUpdateConnection}
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
          onUnreconcile={handleUnreconcile}
          onBack={() => setSubView('transactions')}
          onCreateRequest={(kind) => setCreationTarget(kind)}
          onReload={async () => {
            await Promise.all([loadSummary(), loadTransactions()])
            if (selectedTransaction) await refreshSelectedTransaction(selectedTransaction.id)
          }}
        />
      )}

      {creationTarget === 'expense' && selectedTransaction && defaultExpenseInitial && (
        <ExpenseFormModal
          expense={defaultExpenseInitial}
          defaultTrainingId={undefined}
          defaultDesignProjectId={undefined}
          defaultOrganizationId={selectedTransaction.organizationId || null}
          organizationOptions={organizations.map((o) => ({ value: o.id, label: o.name, vatSubject: o.vatSubject }))}
          fetchContacts={fetchContacts}
          onCreateContact={undefined}
          onSubmit={handleCreateExpenseFromTransaction}
          onCancel={() => setCreationTarget(null)}
          busy={creationBusy}
          showTrainingLink
          showDesignProjectLink
          accentColor="#5B5781"
        />
      )}

      {creationTarget === 'revenue' && selectedTransaction && defaultRevenueInitial && (
        <RevenueFormModal
          revenue={defaultRevenueInitial}
          contacts={contactOptions}
          organizations={organizations.map((o) => ({ value: o.id, label: o.name, vatSubject: o.vatSubject }))}
          defaultOrganizationId={selectedTransaction.organizationId || null}
          onSave={handleCreateRevenueFromTransaction}
          onCancel={() => setCreationTarget(null)}
          busy={creationBusy}
        />
      )}
    </div>
  )
}
