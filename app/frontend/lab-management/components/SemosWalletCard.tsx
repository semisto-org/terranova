import type {
  Wallet,
  Member,
  SemosTransaction,
  SemosEmission,
} from '../types'

interface SemosWalletCardProps {
  wallet: Wallet
  member: Member
  transactions: SemosTransaction[]
  emissions: SemosEmission[]
  allMembers: Member[]
  allWallets: Wallet[]
  onTransfer?: () => void
  onViewHistory?: () => void
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
  })
}

function getMemberName(memberId: string, members: Member[]): string {
  const member = members.find((m) => m.id === memberId)
  return member ? `${member.firstName} ${member.lastName[0]}.` : 'Inconnu'
}

function getWalletMember(walletId: string, wallets: Wallet[], members: Member[]): Member | null {
  const wallet = wallets.find((w) => w.id === walletId)
  if (!wallet) return null
  return members.find((m) => m.id === wallet.memberId) || null
}

export function SemosWalletCard({
  wallet,
  member,
  transactions,
  emissions,
  allMembers,
  allWallets,
  onTransfer,
  onViewHistory,
}: SemosWalletCardProps) {
  // Get recent activity (transactions + emissions) for this wallet
  const recentActivity = [
    ...transactions
      .filter((t) => t.fromWalletId === wallet.id || t.toWalletId === wallet.id)
      .map((t) => ({
        id: t.id,
        type: 'transaction' as const,
        date: t.createdAt,
        description: t.description,
        amount: t.toWalletId === wallet.id ? t.amount : -t.amount,
        isIncoming: t.toWalletId === wallet.id,
        otherParty:
          t.toWalletId === wallet.id
            ? getWalletMember(t.fromWalletId, allWallets, allMembers)
            : getWalletMember(t.toWalletId, allWallets, allMembers),
      })),
    ...emissions
      .filter((e) => e.walletId === wallet.id)
      .map((e) => ({
        id: e.id,
        type: 'emission' as const,
        date: e.createdAt,
        description: e.description,
        amount: e.amount,
        isIncoming: true,
        otherParty: null,
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  // Calculate balance percentage for visual indicator
  const balanceRange = wallet.ceiling - wallet.floor
  const balancePercent = ((wallet.balance - wallet.floor) / balanceRange) * 100

  return (
    <div className="bg-gradient-to-br from-[#5B5781] to-[#4a4670] rounded-xl p-5 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
            Ⓢ
          </div>
          <div>
            <p className="text-white/70 text-xs">Mon portefeuille</p>
            <p className="font-medium">
              {member.firstName} {member.lastName}
            </p>
          </div>
        </div>
        <button
          onClick={onTransfer}
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
        >
          Transférer
        </button>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-3xl font-bold tracking-tight">
          {formatAmount(wallet.balance)}
          <span className="text-lg font-normal text-white/70 ml-1">Semos</span>
        </p>
      </div>

      {/* Balance bar */}
      <div className="mb-5">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#AFBD00] rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, balancePercent))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/50 mt-1">
          <span>Plancher: {wallet.floor}S</span>
          <span>Plafond: {wallet.ceiling}S</span>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-white/70 uppercase tracking-wide">
            Activité récente
          </h4>
          <button
            onClick={onViewHistory}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Voir tout →
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-sm text-white/50 py-2">Aucune activité récente</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${activity.isIncoming ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'}
                  `}
                  >
                    {activity.isIncoming ? '↓' : '↑'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    {activity.otherParty && (
                      <p className="text-[10px] text-white/50">
                        {activity.isIncoming ? 'De' : 'À'} {activity.otherParty.firstName}{' '}
                        {activity.otherParty.lastName[0]}.
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p
                    className={`text-sm font-medium ${activity.isIncoming ? 'text-emerald-300' : 'text-rose-300'}`}
                  >
                    {activity.isIncoming ? '+' : ''}
                    {formatAmount(activity.amount)}S
                  </p>
                  <p className="text-[10px] text-white/50">{formatDate(activity.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
