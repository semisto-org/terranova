'use client'

import { useState } from 'react'
import type {
  Member,
  Wallet,
  SemosTransaction,
  SemosEmission,
} from '@terranova/types'
import { SemosTransactionRow } from './SemosTransactionRow'
import { SemosTransferForm } from './SemosTransferForm'
import { useRouter } from 'next/navigation'

interface SemosDashboardProps {
  currentMember: Member
  currentWallet: Wallet
  members: Member[]
  wallets: Wallet[]
  transactions: SemosTransaction[]
  emissions: SemosEmission[]
}

export function SemosDashboard({
  currentMember,
  currentWallet,
  members,
  wallets,
  transactions,
  emissions,
}: SemosDashboardProps) {
  const [showTransferForm, setShowTransferForm] = useState(false)
  const router = useRouter()

  // Filter transactions for current wallet
  const myTransactions = transactions.filter(
    (t) =>
      t.fromWalletId === currentWallet.id || t.toWalletId === currentWallet.id
  )

  // Sort by date (newest first)
  const sortedTransactions = [...myTransactions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Calculate stats
  const totalReceived = transactions
    .filter((t) => t.toWalletId === currentWallet.id)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSent = transactions
    .filter((t) => t.fromWalletId === currentWallet.id)
    .reduce((sum, t) => sum + t.amount, 0)

  const myEmissions = emissions.filter(
    (e) => e.walletId === currentWallet.id
  )
  const totalEmissions = myEmissions.reduce((sum, e) => sum + e.amount, 0)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Semos Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your Semos balance and transactions
            </p>
          </div>

          <button
            onClick={() => setShowTransferForm(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Transfer Semos
          </button>
        </div>

        {/* Wallet Card */}
        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600">
              Your Balance
            </div>
            <div className="mt-2 text-4xl font-bold text-gray-900">
              {currentWallet.balance.toFixed(2)} Semos
            </div>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-gray-600">Floor:</span>
              <span className="ml-2 font-medium text-gray-900">
                {currentWallet.floor.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Ceiling:</span>
              <span className="ml-2 font-medium text-gray-900">
                {currentWallet.ceiling.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((currentWallet.balance - currentWallet.floor) /
                      (currentWallet.ceiling - currentWallet.floor)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Total Received</div>
            <div className="mt-1 text-2xl font-bold text-green-600">
              +{totalReceived.toFixed(2)}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Total Sent</div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              -{totalSent.toFixed(2)}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">Total Emissions</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600">
              +{totalEmissions.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Direction
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => (
                    <SemosTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      members={members}
                      wallets={wallets}
                      currentWalletId={currentWallet.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Emissions History (if any) */}
        {myEmissions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Emission History
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {myEmissions.map((emission) => (
                <div key={emission.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        +{emission.amount.toFixed(2)} Semos
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {emission.reason} • {emission.description}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {new Date(emission.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Emission
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTransferForm && (
        <SemosTransferForm
          currentMember={currentMember}
          currentWallet={currentWallet}
          members={members}
          wallets={wallets}
          onClose={() => setShowTransferForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
