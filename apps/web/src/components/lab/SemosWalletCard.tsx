import type { Wallet, SemosTransaction, Member } from '@terranova/types'

interface SemosWalletCardProps {
  wallet: Wallet
  transactions: SemosTransaction[]
  members: Member[]
  wallets: Wallet[]
}

export function SemosWalletCard({
  wallet,
  transactions,
  members,
  wallets,
}: SemosWalletCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-600">
          Semos Balance
        </h2>
        <p className="mt-2 text-4xl font-bold text-gray-900">
          {wallet.balance.toFixed(2)}
        </p>
      </div>

      {/* Floor & Ceiling */}
      <div className="mb-4 flex gap-4 text-sm">
        <div>
          <span className="text-gray-600">Floor:</span>
          <span className="ml-1 font-medium text-gray-900">
            {wallet.floor.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Ceiling:</span>
          <span className="ml-1 font-medium text-gray-900">
            {wallet.ceiling.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
            style={{
              width: `${Math.min(
                100,
                ((wallet.balance - wallet.floor) /
                  (wallet.ceiling - wallet.floor)) *
                  100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isOutgoing = tx.fromWalletId === wallet.id
              const otherWalletId = isOutgoing ? tx.toWalletId : tx.fromWalletId
              const otherWallet = wallets.find((w) => w.id === otherWalletId)
              const otherMember = otherWallet
                ? members.find((m) => m.id === otherWallet.memberId)
                : null

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md bg-white p-2 text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {isOutgoing ? 'To' : 'From'}{' '}
                      {otherMember
                        ? `${otherMember.firstName} ${otherMember.lastName}`
                        : 'Unknown'}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-gray-500">{tx.description}</p>
                    )}
                  </div>
                  <span
                    className={`font-semibold ${
                      isOutgoing ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {isOutgoing ? '-' : '+'}
                    {tx.amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
