import { useCallback, useEffect, useMemo, useState } from 'react'
import { Vault } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { CashBalanceCard } from './CashBalanceCard'
import { CashMovementList } from './CashMovementList'
import { CashTransferModal } from './CashTransferModal'
import { CASH_ACCENT, type CashAccount, type CashMovement } from './types'

export function CashSection() {
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [transferModal, setTransferModal] = useState<CashAccount | null>(null)

  const loadAccounts = useCallback(async () => {
    const data = await apiRequest('/api/v1/bank/cash_accounts')
    const items = (data.items || []) as CashAccount[]
    setAccounts(items)
    // Default to the first (usually Semisto / default org)
    setSelectedAccountId((prev) => prev || items[0]?.id || null)
  }, [])

  const loadMovements = useCallback(async (connectionId: string) => {
    const data = await apiRequest(`/api/v1/bank/transactions?connection_id=${connectionId}`)
    setMovements(data.items || [])
  }, [])

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false))
  }, [loadAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      loadMovements(selectedAccountId)
    }
  }, [selectedAccountId, loadMovements])

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  )

  const handleTransfer = async (payload: { amount: number; date: string; note: string }) => {
    if (!transferModal) return
    await apiRequest('/api/v1/bank/cash_transfers', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: transferModal.organizationId,
        amount: payload.amount,
        date: payload.date,
        note: payload.note,
      }),
    })
    setTransferModal(null)
    await loadAccounts()
    if (selectedAccountId) await loadMovements(selectedAccountId)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-stone-400">Chargement…</div>
  }

  return (
    <div className="space-y-6">
      {/* Hero — ledger-inspired header */}
      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-5"
        style={{
          borderColor: `${CASH_ACCENT}22`,
          background: `linear-gradient(135deg, #FFFBF4 0%, #FFF 70%)`,
        }}
      >
        {/* Subtle parchment texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${CASH_ACCENT}, ${CASH_ACCENT} 1px, transparent 1px, transparent 32px)`,
          }}
        />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${CASH_ACCENT}15`, color: CASH_ACCENT }}
            >
              <Vault className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: CASH_ACCENT }}>
                Grand livre · Caisses
              </p>
              <h2 className="mt-0.5 text-2xl font-bold text-stone-900 tracking-tight">
                Suivi du cash
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Solde, mouvements, apports. Les ventes shop cash et dépenses cash s'enregistrent automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance cards — one per organization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId
          return (
            <div
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={`cursor-pointer transition-all ${isSelected ? 'scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}
              style={isSelected ? { boxShadow: `0 0 0 2px ${CASH_ACCENT}` } : undefined}
            >
              <CashBalanceCard account={account} onRequestTransfer={() => setTransferModal(account)} />
            </div>
          )
        })}
      </div>

      {selectedAccount && (
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            Mouvements · <span className="font-normal text-stone-500">{selectedAccount.organizationName}</span>
          </h3>
          <CashMovementList movements={movements} />
        </section>
      )}

      {transferModal && (
        <CashTransferModal
          account={transferModal}
          onConfirm={handleTransfer}
          onCancel={() => setTransferModal(null)}
        />
      )}
    </div>
  )
}
