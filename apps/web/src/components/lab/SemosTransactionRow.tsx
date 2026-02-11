import type { SemosTransaction, Member, Wallet } from '@terranova/types'

interface SemosTransactionRowProps {
  transaction: SemosTransaction
  members: Member[]
  wallets: Wallet[]
  currentWalletId: string
}

export function SemosTransactionRow({
  transaction,
  members,
  wallets,
  currentWalletId,
}: SemosTransactionRowProps) {
  const isOutgoing = transaction.fromWalletId === currentWalletId
  const otherWalletId = isOutgoing
    ? transaction.toWalletId
    : transaction.fromWalletId
  const otherWallet = wallets.find((w) => w.id === otherWalletId)
  const otherMember = otherWallet
    ? members.find((m) => m.id === otherWallet.memberId)
    : null

  const typeColors: Record<string, string> = {
    payment: 'bg-blue-100 text-blue-800',
    transfer: 'bg-purple-100 text-purple-800',
    exchange: 'bg-green-100 text-green-800',
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Date */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            typeColors[transaction.type] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {transaction.type}
        </span>
      </td>

      {/* Direction / Other Party */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isOutgoing ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isOutgoing ? 'To' : 'From'}
          </span>
          <span className="text-sm text-gray-900">
            {otherMember
              ? `${otherMember.firstName} ${otherMember.lastName}`
              : 'Unknown'}
          </span>
        </div>
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="max-w-xs truncate">{transaction.description}</div>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm font-semibold ${
            isOutgoing ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {isOutgoing ? '-' : '+'}
          {transaction.amount.toFixed(2)}
        </span>
      </td>
    </tr>
  )
}
