import type {
  SemosTransaction,
  SemosEmission,
  Member,
  Wallet,
} from '../types'

type ActivityItem = {
  id: string
  type: 'transaction' | 'emission'
  date: string
  description: string
  amount: number
  isIncoming: boolean
  otherParty: Member | null
  transactionType?: 'payment' | 'transfer' | 'exchange'
  emissionReason?: string
}

interface SemosTransactionRowProps {
  activity: ActivityItem
  onClick?: () => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTransactionIcon(activity: ActivityItem): string {
  if (activity.type === 'emission') {
    return '✦'
  }
  switch (activity.transactionType) {
    case 'payment':
      return '💳'
    case 'exchange':
      return '↔'
    case 'transfer':
    default:
      return activity.isIncoming ? '↓' : '↑'
  }
}

function getTransactionLabel(activity: ActivityItem): string {
  if (activity.type === 'emission') {
    switch (activity.emissionReason) {
      case 'cotisation_member':
        return 'Cotisation'
      case 'volunteer_work':
        return 'Bénévolat'
      case 'provider_fee':
        return 'Fidélisation'
      case 'peer_review':
        return 'Peer Review'
      case 'loyalty':
        return 'Fidélité'
      case 'participation':
        return 'Participation'
      default:
        return 'Émission'
    }
  }
  switch (activity.transactionType) {
    case 'payment':
      return 'Paiement'
    case 'exchange':
      return 'Échange'
    case 'transfer':
    default:
      return 'Transfert'
  }
}

export function SemosTransactionRow({ activity, onClick }: SemosTransactionRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700/50 hover:border-[#5B5781]/30 dark:hover:border-[#5B5781]/50 transition-all duration-200 group text-left"
    >
      {/* Icon */}
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0
          ${
            activity.type === 'emission'
              ? 'bg-gradient-to-br from-[#AFBD00]/20 to-[#AFBD00]/10 text-[#AFBD00]'
              : activity.isIncoming
                ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:text-emerald-400'
                : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 dark:from-rose-900/30 dark:to-rose-900/10 dark:text-rose-400'
          }
        `}
      >
        {getTransactionIcon(activity)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-stone-900 dark:text-stone-100 font-medium truncate group-hover:text-[#5B5781] dark:group-hover:text-[#8B87A8] transition-colors">
              {activity.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${
                    activity.type === 'emission'
                      ? 'bg-[#AFBD00]/10 text-[#8a9600]'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                  }
                `}
              >
                {getTransactionLabel(activity)}
              </span>
              {activity.otherParty && (
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {activity.isIncoming ? 'De' : 'À'}{' '}
                  <span className="font-medium">
                    {activity.otherParty.firstName} {activity.otherParty.lastName[0]}.
                  </span>
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`
                text-lg font-bold tabular-nums
                ${
                  activity.type === 'emission'
                    ? 'text-[#AFBD00]'
                    : activity.isIncoming
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                }
              `}
            >
              {activity.isIncoming ? '+' : '-'}
              {formatAmount(Math.abs(activity.amount))}
              <span className="text-sm font-normal ml-0.5">S</span>
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {formatDate(activity.date)} · {formatTime(activity.date)}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}

// Helper to create activity items from transactions and emissions
export function createActivityItems(
  walletId: string,
  transactions: SemosTransaction[],
  emissions: SemosEmission[],
  members: Member[],
  wallets: Wallet[]
): ActivityItem[] {
  const getWalletMember = (wId: string): Member | null => {
    const wallet = wallets.find((w) => w.id === wId)
    if (!wallet) return null
    return members.find((m) => m.id === wallet.memberId) || null
  }

  const transactionItems: ActivityItem[] = transactions
    .filter((t) => t.fromWalletId === walletId || t.toWalletId === walletId)
    .map((t) => ({
      id: t.id,
      type: 'transaction' as const,
      date: t.createdAt,
      description: t.description,
      amount: t.toWalletId === walletId ? t.amount : -t.amount,
      isIncoming: t.toWalletId === walletId,
      otherParty:
        t.toWalletId === walletId
          ? getWalletMember(t.fromWalletId)
          : getWalletMember(t.toWalletId),
      transactionType: t.type,
    }))

  const emissionItems: ActivityItem[] = emissions
    .filter((e) => e.walletId === walletId)
    .map((e) => ({
      id: e.id,
      type: 'emission' as const,
      date: e.createdAt,
      description: e.description,
      amount: e.amount,
      isIncoming: true,
      otherParty: null,
      emissionReason: e.reason,
    }))

  return [...transactionItems, ...emissionItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
